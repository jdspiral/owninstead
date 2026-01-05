import { Snaptrade } from 'snaptrade-typescript-sdk';
import { env } from '../config/env.js';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

// Initialize SnapTrade client
const snaptrade = new Snaptrade({
  clientId: env.SNAPTRADE_CLIENT_ID,
  consumerKey: env.SNAPTRADE_CONSUMER_KEY,
});

interface SnapTradeConnection {
  id: string;
  user_id: string;
  snaptrade_user_id: string;
  snaptrade_user_secret: string;
  account_id: string | null;
  brokerage_name: string | null;
  supports_notional: boolean;
}

interface BrokerageAccount {
  id: string;
  brokerageId: string;
  brokerageName: string;
  name: string;
  number: string;
  type: string;
}

interface OrderParams {
  userId: string;
  symbol: string;
  amountDollars: number;
  accountId?: string;
}

interface OrderResult {
  orderId: string;
  status: string;
  symbol: string;
  amount: number;
}

export class SnapTradeService {
  /**
   * Register a user with SnapTrade or get existing credentials
   * Returns the SnapTrade user ID and secret
   */
  async registerUser(userId: string): Promise<{ snaptradeUserId: string; userSecret: string }> {
    // Check if user already has a SnapTrade connection
    const { data: existing } = await supabase
      .from('snaptrade_connections')
      .select('snaptrade_user_id, snaptrade_user_secret')
      .eq('user_id', userId)
      .single();

    if (existing) {
      logger.debug({ userId }, 'Found existing SnapTrade user');
      return {
        snaptradeUserId: existing.snaptrade_user_id,
        userSecret: existing.snaptrade_user_secret,
      };
    }

    // Register new user with SnapTrade
    // Use a prefixed user ID to ensure uniqueness across systems
    const snaptradeUserId = `owninstead_${userId}`;

    const response = await snaptrade.authentication.registerSnapTradeUser({
      requestBody: {
        userId: snaptradeUserId,
      },
    });

    const userSecret = response.data.userSecret;

    if (!userSecret) {
      throw new Error('Failed to get user secret from SnapTrade');
    }

    // Store the credentials
    const { error } = await supabase.from('snaptrade_connections').insert({
      user_id: userId,
      snaptrade_user_id: snaptradeUserId,
      snaptrade_user_secret: userSecret, // TODO: encrypt in production
    });

    if (error) {
      logger.error({ error, userId }, 'Failed to store SnapTrade credentials');
      throw new Error('Failed to store brokerage credentials');
    }

    logger.info({ userId, snaptradeUserId }, 'Registered new SnapTrade user');
    return { snaptradeUserId, userSecret };
  }

  /**
   * Generate a login URL for connecting a brokerage account
   */
  async getLoginUrl(userId: string): Promise<string> {
    const { snaptradeUserId, userSecret } = await this.registerUser(userId);

    const response = await snaptrade.authentication.loginSnapTradeUser({
      userId: snaptradeUserId,
      userSecret,
    });

    // Response can be either EncryptedResponse or LoginRedirectURI
    const data = response.data as { redirectURI?: string };
    const redirectUri = data.redirectURI;

    if (!redirectUri) {
      throw new Error('Failed to get redirect URI from SnapTrade');
    }

    logger.info({ userId }, 'Generated SnapTrade login URL');
    return redirectUri;
  }

  /**
   * Handle OAuth callback after user connects their brokerage
   * This is called when the user returns from SnapTrade's brokerage connection flow
   */
  async handleCallback(userId: string, _authorizationId: string): Promise<void> {
    const connection = await this.getConnection(userId);

    if (!connection) {
      throw new Error('No SnapTrade connection found for user');
    }

    // Get the user's accounts after they've connected a brokerage
    const accountsResponse = await snaptrade.accountInformation.listUserAccounts({
      userId: connection.snaptrade_user_id,
      userSecret: connection.snaptrade_user_secret,
    });

    const accounts = accountsResponse.data;

    if (accounts && accounts.length > 0) {
      // Store the first account (user can select different one later)
      const primaryAccount = accounts[0];
      const accountId = primaryAccount.id;

      if (!accountId) {
        throw new Error('Account ID is missing');
      }

      // Check if this brokerage supports notional (dollar-based) orders
      const supportsNotional = await this.checkNotionalSupport(
        connection.snaptrade_user_id,
        connection.snaptrade_user_secret,
        accountId
      );

      await supabase
        .from('snaptrade_connections')
        .update({
          account_id: accountId,
          brokerage_name: primaryAccount.brokerage?.name || null,
          supports_notional: supportsNotional,
        })
        .eq('user_id', userId);

      logger.info(
        { userId, accountId, brokerage: primaryAccount.brokerage?.name },
        'Stored brokerage account'
      );
    }
  }

  /**
   * List all brokerage accounts for a user
   */
  async listAccounts(userId: string): Promise<BrokerageAccount[]> {
    const connection = await this.getConnection(userId);

    if (!connection) {
      return [];
    }

    const response = await snaptrade.accountInformation.listUserAccounts({
      userId: connection.snaptrade_user_id,
      userSecret: connection.snaptrade_user_secret,
    });

    const accounts = response.data || [];

    return accounts
      .filter((account) => account.id) // Filter out accounts without ID
      .map((account) => ({
        id: account.id!,
        brokerageId: account.brokerage?.id || '',
        brokerageName: account.brokerage?.name || 'Unknown',
        name: account.name || '',
        number: account.number || '',
        type: (account.meta as { type?: string })?.type || 'Unknown',
      }));
  }

  /**
   * Get connection status for a user
   */
  async getConnectionStatus(userId: string): Promise<{
    connected: boolean;
    brokerageName: string | null;
    accountId: string | null;
  }> {
    const { data: connection } = await supabase
      .from('snaptrade_connections')
      .select('account_id, brokerage_name')
      .eq('user_id', userId)
      .single();

    return {
      connected: !!connection?.account_id,
      brokerageName: connection?.brokerage_name || null,
      accountId: connection?.account_id || null,
    };
  }

  /**
   * Place a market order to buy an asset
   */
  async placeOrder(params: OrderParams): Promise<OrderResult> {
    const connection = await this.getConnection(params.userId);

    if (!connection) {
      throw new Error('No brokerage connection found');
    }

    const accountId = params.accountId || connection.account_id;

    if (!accountId) {
      throw new Error('No account selected for trading');
    }

    // Get the universal symbol ID for the ticker
    const symbolId = await this.getUniversalSymbolId(params.symbol);

    let units: number;

    if (connection.supports_notional) {
      // For notional orders, set units to represent dollar amount
      // Some brokerages support fractional shares
      const quote = await this.getQuote(
        connection.snaptrade_user_id,
        connection.snaptrade_user_secret,
        symbolId,
        accountId
      );
      units = params.amountDollars / quote.lastPrice;
    } else {
      // Calculate whole shares based on current price
      const quote = await this.getQuote(
        connection.snaptrade_user_id,
        connection.snaptrade_user_secret,
        symbolId,
        accountId
      );
      units = Math.floor(params.amountDollars / quote.lastPrice);
    }

    if (units <= 0) {
      throw new Error('Order amount too small to purchase any shares');
    }

    const orderResponse = await snaptrade.trading.placeForceOrder({
      userId: connection.snaptrade_user_id,
      userSecret: connection.snaptrade_user_secret,
      requestBody: {
        account_id: accountId,
        action: 'BUY',
        order_type: 'Market',
        time_in_force: 'Day',
        universal_symbol_id: symbolId,
        units,
      },
    });

    const order = orderResponse.data;

    logger.info(
      { userId: params.userId, symbol: params.symbol, amount: params.amountDollars, orderId: order?.brokerage_order_id },
      'Placed trade order'
    );

    return {
      orderId: order?.brokerage_order_id || '',
      status: order?.status || 'pending',
      symbol: params.symbol,
      amount: params.amountDollars,
    };
  }

  /**
   * Get the status of an order
   */
  async getOrderStatus(
    userId: string,
    orderId: string
  ): Promise<{ status: string; filledPrice?: number; filledShares?: number }> {
    const connection = await this.getConnection(userId);

    if (!connection || !connection.account_id) {
      throw new Error('No brokerage connection found');
    }

    const response = await snaptrade.accountInformation.getUserAccountOrders({
      userId: connection.snaptrade_user_id,
      userSecret: connection.snaptrade_user_secret,
      accountId: connection.account_id,
    });

    const order = response.data?.find((o) => o.brokerage_order_id === orderId);

    if (!order) {
      return { status: 'not_found' };
    }

    return {
      status: order.status || 'unknown',
      filledPrice: order.execution_price || undefined,
      filledShares: order.filled_quantity || undefined,
    };
  }

  /**
   * Search for symbols that can be traded on the user's account
   * Filters to ETFs only
   */
  async searchSymbols(
    userId: string,
    query: string
  ): Promise<{ symbol: string; name: string; description: string; universalSymbolId: string }[]> {
    const connection = await this.getConnection(userId);

    if (!connection || !connection.account_id) {
      return [];
    }

    try {
      const response = await snaptrade.referenceData.symbolSearchUserAccount({
        userId: connection.snaptrade_user_id,
        userSecret: connection.snaptrade_user_secret,
        accountId: connection.account_id,
        requestBody: {
          substring: query,
        },
      });

      const symbols = response.data || [];

      // Filter to ETFs only and map to our format
      return symbols
        .filter((s) => {
          const typeCode = s.type?.code?.toLowerCase() || '';
          return typeCode.includes('etf');
        })
        .slice(0, 20) // Limit results
        .map((s) => ({
          symbol: s.symbol || '',
          name: s.description || s.symbol || '',
          description: s.exchange?.name || '',
          universalSymbolId: s.id || '',
        }));
    } catch (err) {
      logger.error({ err, userId, query }, 'Failed to search symbols');
      return [];
    }
  }

  /**
   * Check if a specific symbol is available on the user's account
   */
  async isSymbolAvailable(userId: string, symbol: string): Promise<boolean> {
    const connection = await this.getConnection(userId);

    if (!connection || !connection.account_id) {
      return false;
    }

    try {
      const response = await snaptrade.referenceData.symbolSearchUserAccount({
        userId: connection.snaptrade_user_id,
        userSecret: connection.snaptrade_user_secret,
        accountId: connection.account_id,
        requestBody: {
          substring: symbol,
        },
      });

      const symbols = response.data || [];
      return symbols.some(
        (s) => s.symbol?.toUpperCase() === symbol.toUpperCase()
      );
    } catch {
      return false;
    }
  }

  /**
   * Remove a SnapTrade connection
   */
  async removeConnection(userId: string): Promise<void> {
    const connection = await this.getConnection(userId);

    if (connection) {
      // Delete user from SnapTrade
      try {
        await snaptrade.authentication.deleteSnapTradeUser({
          userId: connection.snaptrade_user_id,
        });
      } catch (err) {
        logger.warn({ err, userId }, 'Failed to delete SnapTrade user');
      }

      // Delete from database
      await supabase.from('snaptrade_connections').delete().eq('user_id', userId);

      logger.info({ userId }, 'Removed SnapTrade connection');
    }
  }

  /**
   * Get the stored SnapTrade connection for a user
   */
  private async getConnection(userId: string): Promise<SnapTradeConnection | null> {
    const { data, error } = await supabase
      .from('snaptrade_connections')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as SnapTradeConnection;
  }

  /**
   * Check if a brokerage account supports notional (dollar-based) orders
   */
  private async checkNotionalSupport(
    snaptradeUserId: string,
    userSecret: string,
    accountId: string
  ): Promise<boolean> {
    try {
      const response = await snaptrade.accountInformation.getUserAccountDetails({
        userId: snaptradeUserId,
        userSecret,
        accountId,
      });

      // Response is an array of Account, get the first one
      const accounts = response.data;
      if (!accounts || accounts.length === 0) {
        return false;
      }

      // Check if the account/brokerage supports fractional trading
      const account = accounts[0];
      const brokerage = account?.brokerage;
      const supportsFractional = brokerage?.allows_fractional_units || false;

      return supportsFractional;
    } catch {
      return false;
    }
  }

  /**
   * Get a quote for a symbol
   */
  private async getQuote(
    snaptradeUserId: string,
    userSecret: string,
    symbolId: string,
    accountId: string
  ): Promise<{ lastPrice: number }> {
    const response = await snaptrade.trading.getUserAccountQuotes({
      userId: snaptradeUserId,
      userSecret,
      symbols: symbolId,
      accountId,
    });

    const quotes = response.data;
    if (!quotes || quotes.length === 0) {
      throw new Error('No quote available');
    }

    const quote = quotes[0];
    const price = quote.last_trade_price || 0;
    return { lastPrice: price };
  }

  /**
   * Get the universal symbol ID for a ticker
   */
  private async getUniversalSymbolId(ticker: string): Promise<string> {
    const response = await snaptrade.referenceData.getSymbolsByTicker({
      ticker,
    });

    const symbol = response.data;
    if (!symbol || !symbol.id) {
      throw new Error(`Symbol ${ticker} not found`);
    }

    return symbol.id;
  }
}

export const snaptradeService = new SnapTradeService();
