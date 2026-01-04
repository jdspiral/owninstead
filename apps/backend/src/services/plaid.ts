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
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'OwnInstead',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
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
