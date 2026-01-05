import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
} from 'plaid';
import { env } from '../config/env.js';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

// Initialize Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments[env.PLAID_ENV as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': env.PLAID_CLIENT_ID,
      'PLAID-SECRET': env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export class PlaidService {
  /**
   * Create a Link token for initializing Plaid Link in the mobile app
   */
  async createLinkToken(userId: string): Promise<string> {
    const isSandbox = env.PLAID_ENV === 'sandbox';

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'OwnInstead',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
      // Redirect URI for OAuth banks - must be registered in Plaid Dashboard
      redirect_uri: isSandbox ? undefined : 'https://owninstead-backend.onrender.com/plaid/oauth-callback',
    });

    logger.info({ userId }, 'Created Plaid link token');
    return response.data.link_token;
  }

  /**
   * Exchange a public token for an access token and store the connection
   */
  async exchangePublicToken(
    userId: string,
    publicToken: string
  ): Promise<{ itemId: string; institutionName: string | null }> {
    // Handle mock tokens for testing
    if (publicToken.startsWith('mock-public-token-')) {
      return this.createMockConnection(userId);
    }

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Get institution info
    const itemResponse = await plaidClient.itemGet({ access_token: accessToken });
    const institutionId = itemResponse.data.item.institution_id;

    let institutionName: string | null = null;
    if (institutionId) {
      const institutionResponse = await plaidClient.institutionsGetById({
        institution_id: institutionId,
        country_codes: [CountryCode.Us],
      });
      institutionName = institutionResponse.data.institution.name;
    }

    // Store connection in database
    const { error } = await supabase.from('plaid_connections').insert({
      user_id: userId,
      access_token: accessToken, // TODO: encrypt this in production
      item_id: itemId,
      institution_name: institutionName,
    });

    if (error) {
      logger.error({ error, userId }, 'Failed to store Plaid connection');
      throw new Error('Failed to store bank connection');
    }

    logger.info({ userId, itemId, institutionName }, 'Plaid connection stored');
    return { itemId, institutionName };
  }

  /**
   * Create a mock connection for testing in Expo Go
   */
  private async createMockConnection(userId: string): Promise<{ itemId: string; institutionName: string | null }> {
    const itemId = 'mock-item-' + Date.now();
    const institutionName = 'Mock Bank (Testing)';

    // Store mock connection
    const { error } = await supabase.from('plaid_connections').insert({
      user_id: userId,
      access_token: 'mock-access-token-' + Date.now(),
      item_id: itemId,
      institution_name: institutionName,
    });

    if (error) {
      logger.error({ error, userId }, 'Failed to store mock Plaid connection');
      throw new Error('Failed to store bank connection');
    }

    logger.info({ userId, itemId }, 'Created mock Plaid connection');
    return { itemId, institutionName };
  }

  /**
   * Sync transactions for a user from all their connected accounts
   */
  async syncTransactions(userId: string): Promise<{ synced: number; accounts: number }> {
    // Get all Plaid connections for user
    const { data: connections, error: connError } = await supabase
      .from('plaid_connections')
      .select('*')
      .eq('user_id', userId);

    if (connError || !connections?.length) {
      logger.warn({ userId }, 'No Plaid connections found for user');
      return { synced: 0, accounts: 0 };
    }

    let totalSynced = 0;

    for (const connection of connections) {
      try {
        const synced = await this.syncTransactionsForConnection(userId, connection);
        totalSynced += synced;

        // Update last_synced_at
        await supabase
          .from('plaid_connections')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', connection.id);
      } catch (err) {
        logger.error({ err, connectionId: connection.id }, 'Failed to sync transactions for connection');
      }
    }

    return { synced: totalSynced, accounts: connections.length };
  }

  /**
   * Sync transactions for a single Plaid connection
   */
  private async syncTransactionsForConnection(
    userId: string,
    connection: { id: string; access_token: string; item_id: string }
  ): Promise<number> {
    // Handle mock connections
    if (connection.access_token.startsWith('mock-access-token-')) {
      return this.createMockTransactions(userId);
    }

    // Get transactions from the last 30 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();

    const response = await plaidClient.transactionsGet({
      access_token: connection.access_token,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    });

    const transactions = response.data.transactions;
    let synced = 0;

    for (const tx of transactions) {
      // Skip pending transactions
      if (tx.pending) continue;

      // Upsert transaction (update if exists, insert if not)
      const { error } = await supabase.from('transactions').upsert(
        {
          user_id: userId,
          plaid_transaction_id: tx.transaction_id,
          amount: Math.abs(tx.amount), // Plaid uses negative for debits
          merchant_name: tx.merchant_name || tx.name,
          category: tx.category,
          date: tx.date,
        },
        {
          onConflict: 'plaid_transaction_id',
        }
      );

      if (!error) {
        synced++;
      }
    }

    logger.info(
      { userId, connectionId: connection.id, synced, total: transactions.length },
      'Synced transactions'
    );

    return synced;
  }

  /**
   * Create sample mock transactions for testing
   */
  private async createMockTransactions(userId: string): Promise<number> {
    const today = new Date();
    const mockTransactions = [
      // Delivery - spread across the week
      { merchant: 'DoorDash', amount: 28.50, category: ['Food and Drink', 'Restaurants', 'Fast Food'], daysAgo: 1 },
      { merchant: 'Uber Eats', amount: 32.00, category: ['Food and Drink', 'Restaurants'], daysAgo: 3 },
      { merchant: 'Grubhub', amount: 24.75, category: ['Food and Drink', 'Restaurants'], daysAgo: 5 },

      // Coffee
      { merchant: 'Starbucks', amount: 6.45, category: ['Food and Drink', 'Coffee Shop'], daysAgo: 0 },
      { merchant: 'Starbucks', amount: 5.95, category: ['Food and Drink', 'Coffee Shop'], daysAgo: 2 },
      { merchant: 'Starbucks', amount: 7.20, category: ['Food and Drink', 'Coffee Shop'], daysAgo: 4 },
      { merchant: 'Blue Bottle Coffee', amount: 8.50, category: ['Food and Drink', 'Coffee Shop'], daysAgo: 6 },

      // Rideshare
      { merchant: 'Uber', amount: 18.50, category: ['Travel', 'Taxi'], daysAgo: 2 },
      { merchant: 'Lyft', amount: 22.00, category: ['Travel', 'Taxi'], daysAgo: 4 },

      // Entertainment
      { merchant: 'Netflix', amount: 15.99, category: ['Service', 'Subscription'], daysAgo: 7 },
      { merchant: 'Spotify', amount: 10.99, category: ['Service', 'Subscription'], daysAgo: 7 },

      // Shopping
      { merchant: 'Amazon', amount: 45.99, category: ['Shops', 'Online Marketplace'], daysAgo: 3 },
      { merchant: 'Target', amount: 67.32, category: ['Shops', 'Supermarkets and Groceries'], daysAgo: 5 },

      // Groceries
      { merchant: 'Whole Foods', amount: 89.45, category: ['Shops', 'Supermarkets and Groceries'], daysAgo: 1 },
      { merchant: 'Trader Joes', amount: 52.18, category: ['Shops', 'Supermarkets and Groceries'], daysAgo: 6 },
    ];

    let synced = 0;
    for (const tx of mockTransactions) {
      const date = new Date(today);
      date.setDate(date.getDate() - tx.daysAgo);

      const { error } = await supabase.from('transactions').upsert(
        {
          user_id: userId,
          plaid_transaction_id: 'mock-tx-' + tx.merchant.toLowerCase().replace(/\s/g, '-') + '-' + tx.daysAgo,
          amount: tx.amount,
          merchant_name: tx.merchant,
          category: tx.category,
          date: date.toISOString().split('T')[0],
        },
        {
          onConflict: 'plaid_transaction_id',
        }
      );

      if (!error) synced++;
    }

    logger.info({ userId, synced }, 'Created mock transactions');
    return synced;
  }

  /**
   * Get connection status for a user
   */
  async getConnectionStatus(userId: string): Promise<{
    connected: boolean;
    connections: Array<{ id: string; institutionName: string | null; lastSynced: string | null }>;
  }> {
    const { data: connections } = await supabase
      .from('plaid_connections')
      .select('id, institution_name, last_synced_at')
      .eq('user_id', userId);

    return {
      connected: (connections?.length ?? 0) > 0,
      connections:
        connections?.map((c) => ({
          id: c.id,
          institutionName: c.institution_name,
          lastSynced: c.last_synced_at,
        })) ?? [],
    };
  }

  /**
   * Remove a Plaid connection
   */
  async removeConnection(userId: string, connectionId: string): Promise<void> {
    const { data: connection } = await supabase
      .from('plaid_connections')
      .select('access_token')
      .eq('id', connectionId)
      .eq('user_id', userId)
      .single();

    if (connection) {
      // Revoke access token with Plaid
      try {
        await plaidClient.itemRemove({ access_token: connection.access_token });
      } catch (err) {
        logger.warn({ err, connectionId }, 'Failed to revoke Plaid access token');
      }

      // Delete from database
      await supabase.from('plaid_connections').delete().eq('id', connectionId);

      logger.info({ userId, connectionId }, 'Removed Plaid connection');
    }
  }
}

export const plaidService = new PlaidService();
