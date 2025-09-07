'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PaymentSuccess from '@/components/PaymentSuccess';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [depositId, setDepositId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get depositId from URL params (returned by PawaPay)
    const urlDepositId = searchParams.get('depositId');
    
    // Get depositId from sessionStorage (stored before redirect)
    const storedDepositId = sessionStorage.getItem('eYoteDepositId');
    
    // Use URL depositId if available, otherwise use stored one
    const finalDepositId = urlDepositId || storedDepositId;
    
    if (finalDepositId) {
      setDepositId(finalDepositId);
      // Clear from sessionStorage
      sessionStorage.removeItem('eYoteDepositId');
    }
    
    setLoading(false);
  }, [searchParams]);

  const handleNewPayment = () => {
    // Navigate back to payment page
    window.location.href = '/payment';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
              <p className="text-gray-600">Please wait while we process your return from payment...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!depositId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">❌</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Not Found</h2>
              <p className="text-gray-600 mb-4">
                We couldn&apos;t find your payment information. This might happen if you navigated here directly.
              </p>
              <Link
                href="/payment"
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Start New Payment
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">eYote</h1>
          <p className="text-gray-600">Payment Status</p>
        </div>

        {/* Payment Status */}
        <PaymentSuccess 
          depositId={depositId} 
          onNewPayment={handleNewPayment}
        />

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Powered by{' '}
            <a 
              href="https://pawapay.io" 
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
