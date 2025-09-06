import axios from 'axios';
import { PaymentPageRequest, PaymentPageResponse, DepositStatus, Country } from '@/types/payment';

// PawaPay v2 API configuration
const PAWAPAY_BASE_URL = process.env.PAWAPAY_BASE_URL || 'https://api.sandbox.pawapay.io';
const PAWAPAY_API_TOKEN = process.env.PAWAPAY_API_TOKEN || 'eyJraWQiOiIxIiwiYWxnIjoiRVMyNTYifQ.eyJ0dCI6IkFBVCIsInN1YiI6IjEwMDk2IiwibWF2IjoiMSIsImV4cCI6MjA3MjY2MTA0OSwiaWF0IjoxNzU3MTI4MjQ5LCJwbSI6IkRBRixQQUYiLCJqdGkiOiIwNDM0NmZjMy03NGQ1LTQ0NDYtYTE2OC00N2Q3NTUwODQ0Y2QifQ.EuXhjwYBxwK0jsBRT-k4mKh7yoV_2OPl-rTY7ThYk0lBRYPFKBwnadZZEnFy4hMFxMSwRFMtXB-OZc4ip4_SSQ';

// Create axios instance with default headers
const pawapayApi = axios.create({
  baseURL: PAWAPAY_BASE_URL,
  headers: {
    'Authorization': `Bearer ${PAWAPAY_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

export class PawaPayService {
  /**
   * Create a payment page session
   */
  static async createPaymentPage(paymentData: PaymentPageRequest): Promise<PaymentPageResponse> {
    try {
      const response = await pawapayApi.post('/v2/paymentpage', paymentData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.failureReason?.failureMessage || 
                           error.response?.data?.message || 
                           error.message;
        throw new Error(`Payment page creation failed: ${errorMessage}`);
      }
      throw new Error('Payment page creation failed: Unknown error');
    }
  }

  /**
   * Check deposit status (v2 API)
   */
  static async getDepositStatus(depositId: string): Promise<DepositStatus> {
    try {
      const response = await pawapayApi.get(`/v2/deposits/${depositId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get deposit status: ${error.response?.data?.message || error.message}`);
      }
      throw new Error('Failed to get deposit status: Unknown error');
    }
  }

  /**
   * Get available countries for payment page
   */
  static getAvailableCountries(): Country[] {
    return [
      {
        code: 'UGA',
        name: 'Uganda',
        currency: 'UGX',
        flag: '🇺🇬'
      },
      {
        code: 'GHA',
        name: 'Ghana',
        currency: 'GHS',
        flag: '🇬🇭'
      },
      {
        code: 'ZMB',
        name: 'Zambia',
        currency: 'ZMW',
        flag: '🇿🇲'
      },
      {
        code: 'KEN',
        name: 'Kenya',
        currency: 'KES',
        flag: '🇰🇪'
      },
      {
        code: 'TZA',
        name: 'Tanzania',
        currency: 'TZS',
        flag: '🇹🇿'
      },
      {
        code: 'RWA',
        name: 'Rwanda',
        currency: 'RWF',
        flag: '🇷🇼'
      }
    ];
  }

  /**
   * Generate a unique deposit ID (UUID v4)
   */
  static generateDepositId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Get country details by code
   */
  static getCountryByCode(countryCode: string): Country | undefined {
    return this.getAvailableCountries().find(country => country.code === countryCode);
  }

  /**
   * Get return URL for payment completion
   */
  static getReturnUrl(baseUrl: string): string {
    return `${baseUrl}/payment/success`;
  }

  /**
   * Format phone number for PawaPay (remove + and spaces)
   */
  static formatPhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/[\s+\-()]/g, '');
  }

  /**
   * Validate phone number format
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    const cleanNumber = this.formatPhoneNumber(phoneNumber);
    // Basic validation for international mobile numbers
    return /^\d{10,15}$/.test(cleanNumber);
  }
}
