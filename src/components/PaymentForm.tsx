'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { PaymentFormData, PaymentState, Country } from '@/types/payment';
import { PaymentConfigService } from '@/lib/payment-config';
import { EnhancedPawaPayService } from '@/lib/enhanced-pawapay';

interface PaymentFormProps {
  onPaymentSubmit: (data: PaymentFormData) => void;
  paymentState: PaymentState;
}

export default function PaymentForm({ onPaymentSubmit, paymentState }: PaymentFormProps) {
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: 0,
    country: '',
    currency: '',
    description: '',
  });
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [paymentLimits, setPaymentLimits] = useState<{min: number; max: number; currency: string} | null>(null);

  // Load countries on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('/api/correspondents');
        const data = await response.json();
        if (data.success) {
          setCountries(data.countries);
        }
      } catch (error) {
        console.error('Failed to load countries:', error);
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Clear validation errors for the field being changed
    setValidationErrors(prev => ({ ...prev, [name]: '' }));
    
    if (name === 'country') {
      // When country changes, update currency automatically and get limits
      const selectedCountry = countries.find(c => c.code === value);
      const currency = selectedCountry?.currency || '';
      
      setFormData(prev => ({
        ...prev,
        country: value,
        currency: currency,
      }));
      
      // Update payment limits
      if (value && currency) {
        const limits = PaymentConfigService.getPaymentLimits(value, currency);
        if (limits) {
          setPaymentLimits({
            min: limits.minAmount,
            max: limits.maxAmount,
            currency: limits.currency
          });
        }
      } else {
        setPaymentLimits(null);
      }
    } else if (name === 'amount') {
      const numValue = parseFloat(value) || 0;
      
      // Validate amount against limits
      if (formData.country && formData.currency && numValue > 0) {
        const validation = PaymentConfigService.validateAmount(numValue, formData.country, formData.currency);
        if (!validation.isValid) {
          setValidationErrors(prev => ({ ...prev, amount: validation.error || 'Invalid amount' }));
        }
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: numValue,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onPaymentSubmit(formData);
    }
  };

  // Enhanced form validation with memoization to prevent infinite re-renders
  const validationResult = useMemo(() => {
    const errors: Record<string, string> = {};
    
    // Amount validation
    if (formData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    } else if (formData.country && formData.currency) {
      const validation = PaymentConfigService.validateAmount(formData.amount, formData.country, formData.currency);
      if (!validation.isValid) {
        errors.amount = validation.error || 'Invalid amount';
      }
    }
    

    
    // Country validation
    if (!formData.country) {
      errors.country = 'Please select a country';
    }
    
    // Description validation
    if (!formData.description.trim()) {
      errors.description = 'Payment description is required';
    } else if (formData.description.length < 4) {
      errors.description = 'Description must be at least 4 characters';
    } else if (formData.description.length > 22) {
      errors.description = 'Description must be 22 characters or less';
    }
    
    const isValid = Object.keys(errors).length === 0 &&
                   formData.amount > 0 && 
                   formData.country !== '' && 
                   formData.currency !== '' && 
                   formData.description.trim() !== '';
    
    return { errors, isValid };
  }, [formData]);
  
  // Update validation errors when validation result changes
  useEffect(() => {
    setValidationErrors(validationResult.errors);
  }, [validationResult.errors]);
  
  const validateForm = useCallback(() => {
    return validationResult.isValid;
  }, [validationResult.isValid]);
  
  const isFormValid = validationResult.isValid;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">eYote Payment</h2>
        <p className="text-gray-600">Secure mobile money payments via PawaPay</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount Input */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount {formData.currency ? `(${formData.currency})` : ''}
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount || ''}
            onChange={handleInputChange}
            min="0.01"
            step="0.01"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
              validationErrors.amount 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="0.00"
            required
          />
          {paymentLimits && (
            <p className="text-xs text-gray-500 mt-1">
              Limits: {PaymentConfigService.formatAmount(paymentLimits.min, paymentLimits.currency)} - {PaymentConfigService.formatAmount(paymentLimits.max, paymentLimits.currency)}
            </p>
          )}
          {validationErrors.amount && (
            <p className="text-xs text-red-600 mt-1">{validationErrors.amount}</p>
          )}
        </div>

        {/* Country Selection */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          {loadingCountries ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              Loading countries...
            </div>
          ) : (
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                validationErrors.country 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              required
            >
              <option value="">Select a country</option>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name} ({country.currency})
                </option>
              ))}
            </select>
          )}
          {formData.currency && !validationErrors.country && (
            <p className="text-xs text-gray-500 mt-1">
              Currency: {formData.currency}
            </p>
          )}
          {validationErrors.country && (
            <p className="text-xs text-red-600 mt-1">{validationErrors.country}</p>
          )}
        </div>

        {/* Description Input */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Payment Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent resize-none ${
              validationErrors.description 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="What is this payment for?"
            maxLength={22}
            required
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">
              {formData.description.length}/22 characters
            </span>
            {validationErrors.description && (
              <span className="text-xs text-red-600">{validationErrors.description}</span>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid || paymentState.isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {paymentState.isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            'Pay Now'
          )}
        </button>
      </form>

      {/* Error Message */}
      {paymentState.isError && paymentState.errorMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{paymentState.errorMessage}</p>
        </div>
      )}
    </div>
  );
}
