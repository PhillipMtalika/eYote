import axios, { AxiosError } from 'axios';
import { PaymentPageRequest, PaymentPageResponse, DepositStatus } from '@/types/payment';
import { PaymentConfigService } from './payment-config';

// Enhanced error types
export interface PawaPayError {
  code: string;
  message: string;
  retryable: boolean;
  statusCode?: number;
}

// Payment session management
export interface PaymentSession {
  depositId: string;
  status: 'CREATED' | 'REDIRECTED' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  createdAt: Date;
  expiresAt: Date;
  redirectUrl?: string;
  metadata?: Record<string, unknown>;
}

export class EnhancedPawaPayService {
  private static readonly BASE_URL = process.env.PAWAPAY_BASE_URL || 'https://api.sandbox.pawapay.io';
  private static readonly API_TOKEN = process.env.PAWAPAY_API_TOKEN || 'eyJraWQiOiIxIiwiYWxnIjoiRVMyNTYifQ.eyJ0dCI6IkFBVCIsInN1YiI6IjEwMDk2IiwibWF2IjoiMSIsImV4cCI6MjA3MjY2MTA0OSwiaWF0IjoxNzU3MTI4MjQ5LCJwbSI6IkRBRixQQUYiLCJqdGkiOiIwNDM0NmZjMy03NGQ1LTQ0NDYtYTE2OC00N2Q3NTUwODQ0Y2QifQ.EuXhjwYBxwK0jsBRT-k4mKh7yoV_2OPl-rTY7ThYk0lBRYPFKBwnadZZEnFy4hMFxMSwRFMtXB-OZc4ip4_SSQ';
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  private static api = axios.create({
    baseURL: this.BASE_URL,
    headers: {
      'Authorization': `Bearer ${this.API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds
  });

  /**
   * Create payment page with enhanced validation and error handling
   */
  static async createPaymentPage(
    paymentData: PaymentPageRequest,
    options: {
      retries?: number;
      validateLimits?: boolean;
      sessionId?: string;
    } = {}
  ): Promise<{
    success: boolean;
    data?: PaymentPageResponse;
    error?: PawaPayError;
    session?: PaymentSession;
  }> {
    const { retries = this.MAX_RETRIES, validateLimits = true, sessionId } = options;

    try {
      // Validate payment limits if enabled
      if (validateLimits) {
        const validation = PaymentConfigService.validateAmount(
          parseFloat(paymentData.amountDetails.amount),
          paymentData.country,
          paymentData.amountDetails.currency
        );

        if (!validation.isValid) {
          return {
            success: false,
            error: {
              code: 'AMOUNT_VALIDATION_FAILED',
              message: validation.error || 'Invalid amount',
              retryable: false,
            }
          };
        }
      }

      // Create payment session
      const session: PaymentSession = {
        depositId: paymentData.depositId,
        status: 'CREATED',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        metadata: {
          sessionId,
          country: paymentData.country,
          currency: paymentData.amountDetails.currency,
          amount: paymentData.amountDetails.amount,
        }
      };

      // Make API call with retry logic
      const response = await this.makeRequestWithRetry(
        () => this.api.post('/v2/paymentpage', paymentData),
        retries
      );

      session.status = 'REDIRECTED';
      session.redirectUrl = response.data.redirectUrl;

      return {
        success: true,
        data: response.data,
        session,
      };

    } catch (error) {
      const pawaPayError = this.handleError(error);
      
      return {
        success: false,
        error: pawaPayError,
      };
    }
  }

  /**
   * Get deposit status with caching and error handling
   */
  static async getDepositStatus(
    depositId: string,
    options: {
      retries?: number;
      useCache?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    data?: DepositStatus;
    error?: PawaPayError;
  }> {
    const { retries = this.MAX_RETRIES } = options;

    try {
      const response = await this.makeRequestWithRetry(
        () => this.api.get(`/v2/deposits/${depositId}`),
        retries
      );

      return {
        success: true,
        data: response.data,
      };

    } catch (error) {
      const pawaPayError = this.handleError(error);
      
      return {
        success: false,
        error: pawaPayError,
      };
    }
  }

  /**
   * Verify webhook signature for security
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      console.error('Webhook signature verification failed');
      return false;
    }
  }

  /**
   * Process webhook callback
   */
  static async processWebhook(
    payload: Record<string, unknown>,
    signature?: string
  ): Promise<{
    success: boolean;
    depositId?: string;
    status?: string;
    error?: string;
  }> {
    try {
      // Verify signature if provided
      const { webhookSecret } = PaymentConfigService.getCallbackConfig();
      if (signature && webhookSecret) {
        const isValid = this.verifyWebhookSignature(
          JSON.stringify(payload),
          signature,
          webhookSecret
        );
        
        if (!isValid) {
          return {
            success: false,
            error: 'Invalid webhook signature'
          };
        }
      }

      // Process the webhook payload
      const depositId = payload.depositId as string;
      const status = payload.status as string;
      
      if (!depositId || !status) {
        return {
          success: false,
          error: 'Missing required fields in webhook payload'
        };
      }

      // Here you would typically update your database
      // await updatePaymentStatus(depositId, status);

      return {
        success: true,
        depositId,
        status,
      };

    } catch (error) {
      console.error('Webhook processing error:', error);
      return {
        success: false,
        error: 'Webhook processing failed'
      };
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private static async makeRequestWithRetry<T>(
    requestFn: () => Promise<T>,
    maxRetries: number
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          throw error;
        }

        // Wait before retrying with exponential backoff
        const delay = this.RETRY_DELAY * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Enhanced error handling
   */
  private static handleError(error: unknown): PawaPayError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data as Record<string, unknown>;

      // Handle specific PawaPay error responses
      if (data?.failureReason) {
        return {
          code: data.failureReason.failureCode || 'PAWAPAY_ERROR',
          message: data.failureReason.failureMessage || 'Payment processing failed',
          retryable: this.isRetryableError(data.failureReason.failureCode),
          statusCode: status,
        };
      }

      // Handle HTTP errors
      if (status) {
        return {
          code: `HTTP_${status}`,
          message: this.getHttpErrorMessage(status),
          retryable: status >= 500,
          statusCode: status,
        };
      }

      // Handle network errors
      if (axiosError.code === 'ECONNABORTED') {
        return {
          code: 'TIMEOUT',
          message: 'Request timeout - please try again',
          retryable: true,
        };
      }

      if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNREFUSED') {
        return {
          code: 'NETWORK_ERROR',
          message: 'Network connection failed - please check your internet connection',
          retryable: true,
        };
      }
    }

    // Generic error
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
      retryable: false,
    };
  }

  /**
   * Determine if an error is retryable
   */
  private static isRetryableError(errorCode: string): boolean {
    const retryableCodes = [
      'PROVIDER_TEMPORARILY_UNAVAILABLE',
      'SYSTEM_TEMPORARILY_UNAVAILABLE',
      'RATE_LIMIT_EXCEEDED',
    ];
    
    return retryableCodes.includes(errorCode);
  }

  /**
   * Get user-friendly HTTP error messages
   */
  private static getHttpErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Invalid payment request - please check your details';
      case 401:
        return 'Authentication failed - please contact support';
      case 403:
        return 'Payment not authorized - please contact support';
      case 404:
        return 'Payment service not found - please try again';
      case 429:
        return 'Too many requests - please wait and try again';
      case 500:
        return 'Payment service temporarily unavailable - please try again';
      case 502:
      case 503:
      case 504:
        return 'Payment service is currently down - please try again later';
      default:
        return `Payment failed with error ${status} - please try again`;
    }
  }

  /**
   * Generate secure deposit ID
   */
  static generateDepositId(prefix: string = 'eYote'): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Validate phone number format for different countries
   */
  static validatePhoneNumber(phoneNumber: string, country?: string): {
    isValid: boolean;
    formatted?: string;
    error?: string;
  } {
    const cleaned = phoneNumber.replace(/[\s+\-()]/g, '');
    
    // Basic validation
    if (!/^\d{10,15}$/.test(cleaned)) {
      return {
        isValid: false,
        error: 'Phone number must be 10-15 digits'
      };
    }

    // Country-specific validation
    const countryPatterns: Record<string, { pattern: RegExp; format: string }> = {
      'UGA': { pattern: /^256\d{9}$/, format: '256XXXXXXXXX' },
      'GHA': { pattern: /^233\d{9}$/, format: '233XXXXXXXXX' },
      'ZMB': { pattern: /^260\d{9}$/, format: '260XXXXXXXXX' },
      'KEN': { pattern: /^254\d{9}$/, format: '254XXXXXXXXX' },
      'TZA': { pattern: /^255\d{9}$/, format: '255XXXXXXXXX' },
      'RWA': { pattern: /^250\d{9}$/, format: '250XXXXXXXXX' },
    };

    if (country && countryPatterns[country]) {
      const { pattern, format } = countryPatterns[country];
      if (!pattern.test(cleaned)) {
        return {
          isValid: false,
          error: `Phone number must match format: ${format}`
        };
      }
    }

    return {
      isValid: true,
      formatted: cleaned
    };
  }
}
