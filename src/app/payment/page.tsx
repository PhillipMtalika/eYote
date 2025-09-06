'use client';

import { useState } from 'react';
import PaymentForm from '@/components/PaymentForm';
import PaymentSuccess from '@/components/PaymentSuccess';
import { PaymentFormData, PaymentState } from '@/types/payment';

export default function PaymentPage() {
  const [paymentState, setPaymentState] = useState<PaymentState>({
    isLoading: false,
    isSuccess: false,
    isError: false,
  });

  const handlePaymentSubmit = async (formData: PaymentFormData) => {
    setPaymentState({
      isLoading: true,
      isSuccess: false,
      isError: false,
    });

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success && data.redirectUrl) {
        // Store deposit ID in sessionStorage for tracking
        sessionStorage.setItem('eYoteDepositId', data.depositId);
        
        // Redirect to PawaPay's payment page
        window.location.href = data.redirectUrl;
      } else {
        setPaymentState({
          isLoading: false,
          isSuccess: false,
          isError: true,
          errorMessage: data.error || 'Payment page creation failed. Please try again.',
        });
      }
    } catch (error) {
      setPaymentState({
        isLoading: false,
        isSuccess: false,
        isError: true,
        errorMessage: 'Network error. Please check your connection and try again.',
      });
    }
  };

  const handleNewPayment = () => {
    setPaymentState({
      isLoading: false,
      isSuccess: false,
      isError: false,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">eYote</h1>
          <p className="text-gray-600">Secure Mobile Money Payments</p>
        </div>

        {/* Payment Flow */}
        <PaymentForm 
          onPaymentSubmit={handlePaymentSubmit}
          paymentState={paymentState}
        />

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Powered by{' '}
            <a 
              href="https://pawapay.cloud" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              PawaPay
            </a>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Secure • Fast • Reliable
          </p>
        </div>
      </div>
    </div>
  );
}
