import { Alert } from 'react-native';

// Mock types matching the real SDK
export interface LinkSuccess {
  publicToken: string;
  metadata: {
    institution: {
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
    linkSessionId: string;
  };
}

export interface LinkExit {
  error: {
    errorCode: string;
    errorMessage: string;
    displayMessage: string;
  } | null;
  metadata: {
    status: string;
    institution: {
      id: string;
      name: string;
    } | null;
    linkSessionId: string;
  };
}

export interface LinkOpenProps {
  onSuccess: (success: LinkSuccess) => void;
  onExit: (exit: LinkExit) => void;
}

let storedCallbacks: LinkOpenProps | null = null;

export function create(_config: { token: string }): void {
  // No-op
}

export function open(props: LinkOpenProps): void {
  storedCallbacks = props;

  Alert.alert(
    'Select a Bank (Mock)',
    'This is a simulated Plaid connection for testing.',
    [
      {
        text: 'Chase Bank',
        onPress: () => simulateSuccess('Chase'),
      },
      {
        text: 'Bank of America', 
        onPress: () => simulateSuccess('Bank of America'),
      },
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => simulateExit(),
      },
    ]
  );
}

export function dismissLink(): void {
  storedCallbacks = null;
}

function simulateSuccess(bankName: string): void {
  if (!storedCallbacks) return;

  const success: LinkSuccess = {
    publicToken: 'mock-public-token-' + Date.now(),
    metadata: {
      institution: {
        id: 'ins_' + bankName.toLowerCase().replace(/\s/g, '_'),
        name: bankName,
      },
      accounts: [
        {
          id: 'mock-account-1',
          name: 'Checking',
          mask: '1234',
          type: 'depository',
          subtype: 'checking',
        },
      ],
      linkSessionId: 'mock-session-' + Date.now(),
    },
  };

  storedCallbacks.onSuccess(success);
  storedCallbacks = null;
}

function simulateExit(): void {
  if (!storedCallbacks) return;

  const exit: LinkExit = {
    error: null,
    metadata: {
      status: 'user_exit',
      institution: null,
      linkSessionId: 'mock-session-' + Date.now(),
    },
  };

  storedCallbacks.onExit(exit);
  storedCallbacks = null;
}
