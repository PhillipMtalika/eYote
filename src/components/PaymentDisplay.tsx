'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PaymentDisplay() {
  const [isLoading, setIsLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    const order = searchParams.get('order');
    const total = searchParams.get('total');

    if (order && total) {
      setOrderId(order);
      setTotalAmount(total);
      setError(null);
    } else {
      setError('Order ID or total amount is missing from the URL.');
    }
  }, [searchParams]);

  const handlePayNow = async () => {
    if (!orderId || !totalAmount) {
      setError('Cannot proceed without Order ID and Total Amount.');
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          depositId: crypto.randomUUID(),
          orderId: orderId,
          reason: `Payment for ${orderId}`,
          country: 'COD',
          amount: totalAmount,
        }),
      });

      const data = await response.json();

      if (data.success && data.redirectUrl) {
        if (data.depositId) {
          sessionStorage.setItem('depositId', data.depositId);
        }
        window.location.href = data.redirectUrl;
      } else {
        alert(data.error || 'Failed to create payment session');
        setIsLoading(false);
      }
    } catch {
      alert('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            e<span className="text-blue-600">Yote</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Secure, fast, and reliable mobile money payments in the Democratic Republic of Congo. 
            Powered by PawaPay&apos;s trusted payment infrastructure.
          </p>

          {error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative max-w-md mx-auto mb-6" role="alert">
              <strong className="font-bold">Error:</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          ) : orderId && totalAmount ? (
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto mb-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Summary</h2>
              <div className="flex justify-between items-center text-lg mb-2">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono text-gray-900">{orderId}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold">
                <span className="text-gray-600">Total Amount:</span>
                <span className="text-blue-600">{new Intl.NumberFormat('en-US').format(Number(totalAmount))} CDF</span>
              </div>
            </div>
          ) : (
            <div className="animate-pulse max-w-md mx-auto mb-8">
              <div className="bg-gray-200 rounded-lg h-32 w-full"></div>
            </div>
          )}

          <button
            onClick={handlePayNow}
            disabled={isLoading || !!error || !orderId}
            className="inline-flex items-center px-12 py-4 bg-blue-600 text-white font-semibold text-lg rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Creating Payment...
              </>
            ) : (
              <>
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Pay Now
              </>
            )}
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure &amp; Trusted</h3>
            <p className="text-gray-600">Bank-grade security with PCI compliance ensures your money and data are always protected.</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast</h3>
            <p className="text-gray-600">Instant payments with real-time processing and immediate confirmations.</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Trusted</h3>
            <p className="text-gray-600">Powered by PawaPay&apos;s reliable mobile money infrastructure.</p>
          </div>
        </div>

        {/* How it Works */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">1</div>
              <h3 className="text-lg font-semibold mb-2">Click Pay Now</h3>
              <p className="text-gray-600">Start your payment by clicking the Pay Now button above</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">2</div>
              <h3 className="text-lg font-semibold mb-2">Enter Details</h3>
              <p className="text-gray-600">You&apos;ll be redirected to PawaPay&apos;s secure payment page to enter your details</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">3</div>
              <h3 className="text-lg font-semibold mb-2">Complete Payment</h3>
              <p className="text-gray-600">Authorize the payment with your mobile money provider</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-gray-500">
            Powered by <span className="font-semibold">PawaPay</span> • Secure Payment Processing
          </p>
        </div>
      </div>
    </div>
  );
}
