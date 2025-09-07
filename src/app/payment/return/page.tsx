'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PaymentReturn() {
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'completed' | 'failed' | 'processing'>('loading');
  const [paymentDetails, setPaymentDetails] = useState<{
    depositId: string;
    status: string;
    requestedAmount?: string;
    amount?: string;
    currency?: string;
    failureReason?: {
      failureCode: string;
      failureMessage: string;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const depositId = searchParams.get('depositId');

  const checkPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/payments?depositId=${depositId}`);
      const data = await response.json();

      if (data.success && data.deposit) {
        setPaymentDetails(data.deposit);
        
        if (data.deposit.status === 'COMPLETED') {
          setPaymentStatus('completed');
          // Auto-open WhatsApp after 2 seconds
          setTimeout(() => {
            openWhatsApp(data.deposit);
          }, 2000);
        } else if (data.deposit.status === 'FAILED') {
          setPaymentStatus('failed');
        } else {
          setPaymentStatus('processing');
          // Keep checking status every 3 seconds if still processing
          setTimeout(checkPaymentStatus, 3000);
        }
      } else {
        setError(data.error || 'Failed to check payment status');
      }
    } catch {
      setError('Network error while checking payment status');
    }
  };

  useEffect(() => {
    if (!depositId) {
      setError('No payment ID found');
      return;
    }

    checkPaymentStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depositId]);

  const openWhatsApp = (deposit: {
    depositId: string;
    requestedAmount?: string;
    amount?: string;
    currency?: string;
  }) => {
    const amount = deposit.requestedAmount || deposit.amount || 'N/A';
    const currency = deposit.currency || 'CDF';
    const depositId = deposit.depositId;
    const orderId = `eYote-${depositId.substring(0, 8)}`;
    const total = `${amount}${currency}`;
    
    // WhatsApp number for eYote agent (replace with your actual WhatsApp number)
    const whatsappNumber = '243901234567'; // DRC WhatsApp number format
    
    // Structured message that agent can parse: PAID {order_id} {depositId} {total}
    const message = `PAID ${orderId} ${depositId} ${total}`;

    // Create WhatsApp deep link with specific number and parseable message
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
  };

  const manualWhatsAppOpen = () => {
    if (paymentDetails) {
      openWhatsApp(paymentDetails);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Checking Payment Status</h1>
          <p className="text-gray-600">Please wait while we verify your payment...</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Processing</h1>
          <p className="text-gray-600 mb-4">Your payment is being processed. This may take a few moments.</p>
          <div className="text-sm text-gray-500">
            Payment ID: {depositId}
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Failed</h1>
          <p className="text-gray-600 mb-6">
            Unfortunately, your payment could not be processed.
            {paymentDetails?.failureReason?.failureMessage && (
              <span className="block mt-2 text-sm">
                Reason: {paymentDetails.failureReason.failureMessage}
              </span>
            )}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Payment completed successfully
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful! 🎉</h1>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <div className="text-sm text-gray-600 space-y-2">
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-semibold">{paymentDetails?.requestedAmount || paymentDetails?.amount} {paymentDetails?.currency || 'CDF'}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment ID:</span>
              <span className="font-mono text-xs">{depositId}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-green-600 font-semibold">COMPLETED</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={manualWhatsAppOpen}
            className="w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.787"/>
            </svg>
            Share Payment Confirmation
          </button>
          
          <p className="text-xs text-gray-500">
            WhatsApp will open automatically with your payment confirmation
          </p>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Make Another Payment
          </button>
        </div>
      </div>
    </div>
  );
}
