// PawaPay v2 Payment Page API Types
export interface PaymentPageRequest {
  depositId: string;
  returnUrl: string;
  customerMessage: string;
  amountDetails: {
    amount: string;
    currency: string;
  };
  phoneNumber: string;
  language: string;
  country: string;
  reason: string;
  metadata?: Array<{
    [key: string]: string | boolean;
  }>;
}

export interface PaymentPageResponse {
  depositId: string;
  redirectUrl: string;
  status?: 'REJECTED';
  failureReason?: {
    failureCode: string;
    failureMessage: string;
  };
}

export interface DepositStatus {
  depositId: string;
  status: 'ENQUEUED' | 'PENDING' | 'COMPLETED' | 'FAILED';
  requestedAmount: string;
  depositedAmount?: string;
  currency: string;
  country: string;
  correspondent: string;
  payer: {
    type: string;
    address: {
      value: string;
    };
  };
  created: string;
  completed?: string;
  statementDescription: string;
  failureReason?: {
    failureCode: string;
    failureMessage: string;
  };
}

export interface Country {
  code: string;
  name: string;
  currency: string;
  flag: string;
}

// UI Types
export interface PaymentFormData {
  amount: number;
  country: string;
  currency: string;
  description: string;
}

export interface PaymentState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  depositId?: string;
  errorMessage?: string;
}
