export const ERROR_CODES = {
  // Auth errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Business logic errors
  RULE_LIMIT_EXCEEDED: 'RULE_LIMIT_EXCEEDED',
  INVESTMENT_LIMIT_EXCEEDED: 'INVESTMENT_LIMIT_EXCEEDED',
  BROKERAGE_NOT_CONNECTED: 'BROKERAGE_NOT_CONNECTED',
  BANK_NOT_CONNECTED: 'BANK_NOT_CONNECTED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  INVESTING_PAUSED: 'INVESTING_PAUSED',
  MARKET_CLOSED: 'MARKET_CLOSED',

  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  PLAID_ERROR: 'PLAID_ERROR',
  SNAPTRADE_ERROR: 'SNAPTRADE_ERROR',
} as const;

export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password',
  [ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED]: 'Please verify your email address',
  [ERROR_CODES.AUTH_TOKEN_EXPIRED]: 'Your session has expired. Please log in again',
  [ERROR_CODES.AUTH_UNAUTHORIZED]: 'You are not authorized to perform this action',
  [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again',
  [ERROR_CODES.NOT_FOUND]: 'The requested resource was not found',
  [ERROR_CODES.RULE_LIMIT_EXCEEDED]: 'You have reached the maximum number of rules for your plan',
  [ERROR_CODES.BROKERAGE_NOT_CONNECTED]: 'Please connect your brokerage account first',
  [ERROR_CODES.BANK_NOT_CONNECTED]: 'Please connect your bank account first',
  [ERROR_CODES.INSUFFICIENT_FUNDS]: 'Insufficient funds in your brokerage account',
  [ERROR_CODES.INVESTING_PAUSED]: 'Investing is currently paused',
  [ERROR_CODES.MARKET_CLOSED]: 'Market is currently closed',
  [ERROR_CODES.INTERNAL_ERROR]: 'An unexpected error occurred. Please try again later',
};
