// Payment Configuration and Validation
export interface PaymentLimits {
  minAmount: number;
  maxAmount: number;
  currency: string;
  country: string;
}

export interface PaymentConfig {
  limits: PaymentLimits[];
  supportedCountries: string[];
  defaultLanguage: string;
  callbackUrl?: string;
  webhookSecret?: string;
}

export class PaymentConfigService {
  private static config: PaymentConfig = {
    limits: [
      { minAmount: 1000, maxAmount: 5000000, currency: 'UGX', country: 'UGA' },
      { minAmount: 1, maxAmount: 10000, currency: 'GHS', country: 'GHA' },
      { minAmount: 10, maxAmount: 50000, currency: 'ZMW', country: 'ZMB' },
      { minAmount: 100, maxAmount: 100000, currency: 'KES', country: 'KEN' },
      { minAmount: 1000, maxAmount: 1000000, currency: 'TZS', country: 'TZA' },
      { minAmount: 100, maxAmount: 500000, currency: 'RWF', country: 'RWA' },
    ],
    supportedCountries: ['UGA', 'GHA', 'ZMB', 'KEN', 'TZA', 'RWA'],
    defaultLanguage: 'EN',
    callbackUrl: process.env.PAWAPAY_CALLBACK_URL,
    webhookSecret: process.env.PAWAPAY_WEBHOOK_SECRET,
  };

  /**
   * Get payment limits for a specific country/currency
   */
  static getPaymentLimits(country: string, currency: string): PaymentLimits | null {
    return this.config.limits.find(
      limit => limit.country === country && limit.currency === currency
    ) || null;
  }

  /**
   * Validate payment amount against limits
   */
  static validateAmount(amount: number, country: string, currency: string): {
    isValid: boolean;
    error?: string;
    limits?: PaymentLimits;
  } {
    const limits = this.getPaymentLimits(country, currency);
    
    if (!limits) {
      return {
        isValid: false,
        error: `Payment not supported for ${country} (${currency})`
      };
    }

    if (amount < limits.minAmount) {
      return {
        isValid: false,
        error: `Minimum amount is ${limits.minAmount} ${currency}`,
        limits
      };
    }

    if (amount > limits.maxAmount) {
      return {
        isValid: false,
        error: `Maximum amount is ${limits.maxAmount} ${currency}`,
        limits
      };
    }

    return { isValid: true, limits };
  }

  /**
   * Get formatted amount display
   */
  static formatAmount(amount: number, currency: string): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'UGX' ? 0 : 2,
    });
    
    return formatter.format(amount);
  }

  /**
   * Check if country is supported
   */
  static isCountrySupported(country: string): boolean {
    return this.config.supportedCountries.includes(country);
  }

  /**
   * Get callback configuration
   */
  static getCallbackConfig() {
    return {
      callbackUrl: this.config.callbackUrl,
      webhookSecret: this.config.webhookSecret,
    };
  }
}
