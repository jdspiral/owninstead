import { Alert } from 'react-native';

// Mock types matching react-native-plaid-link-sdk
export interface LinkSuccess {
  publicToken: string;
  metadata: {
    linkSessionId: string;
    institution?: {
      id: string;
      name: string;
    };
    accounts: Array<{
      id: string;
      name: string;
      mask: string;
      type: string;
      subtype: string;
    }>;
  };
}

export interface LinkExit {
  error?: {
    errorCode: string;
    errorMessage: string;
    displayMessage: string;
  };
  metadata: {
    linkSessionId: string;
    status: string;
  };
}

interface OpenConfig {
  onSuccess: (success: LinkSuccess) => void;
  onExit: (exit: LinkExit) => void;
}

// Mock implementations
export function create(_config: { token: string }): void {
  console.log('[Mock Plaid] Link created with token');
}

export function open(config: OpenConfig): void {
  console.log('[Mock Plaid] Opening Link...');

  Alert.alert(
    'Demo Mode',
    'Plaid Link requires a native build. For this demo, we\'ll simulate a successful bank connection.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => {
          config.onExit({
            metadata: {
              linkSessionId: 'mock-session',
              status: 'cancelled',
            },
          });
        },
      },
      {
        text: 'Connect Demo Bank',
        onPress: () => {
          // Simulate successful connection
          config.onSuccess({
            publicToken: 'mock-public-token-sandbox',
            metadata: {
              linkSessionId: 'mock-session-123',
              institution: {
                id: 'ins_mock',
                name: 'Demo Bank',
              },
              accounts: [
                {
                  id: 'mock-account-1',
                  name: 'Demo Checking',
                  mask: '1234',
                  type: 'depository',
                  subtype: 'checking',
                },
              ],
            },
          });
        },
      },
    ]
  );
}

export function dismissLink(): void {
  console.log('[Mock Plaid] Link dismissed');
}
