'use client';

import { useState, useEffect } from 'react';
import { DepositStatus } from '@/types/payment';

interface PaymentSuccessProps {
  depositId: string;
  onNewPayment: () => void;
}

export default function PaymentSuccess({ depositId, onNewPayment }: PaymentSuccessProps) {
  const [depositStatus, setDepositStatus] = useState<DepositStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkDepositStatus = async () => {
      try {
        const response = await fetch(`/api/payments?depositId=${depositId}`);
        const data = await response.json();
        
        if (data.success) {
          setDepositStatus(data.deposit);
        } else {
          setError(data.error || 'Failed to get deposit status');
        }
      } catch {
        console.error('Error opening WhatsApp');
      } finally {
        setLoading(false);
      }
    };

    if (depositId) {
      checkDepositStatus();
      
      // Poll for status updates every 5 seconds for pending deposits
      const interval = setInterval(checkDepositStatus, 5000);
      
      // Clear interval after 2 minutes
      setTimeout(() => clearInterval(interval), 120000);
      
      return () => clearInterval(interval);
    }
  }, [depositId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'PENDING':
      case 'SUBMITTED':
      case 'ENQUEUED':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'FAILED':
      case 'REJECTED':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '✅';
      case 'PENDING':
      case 'SUBMITTED':
      case 'ENQUEUED':
        return '⏳';
      case 'FAILED':
      case 'REJECTED':
        return '❌';
      default:
        return '📋';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Checking Deposit Status</h2>
          <p className="text-gray-600">Please wait while we verify your deposit...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={onNewPayment}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      <div className="text-center mb-6">
        <div className="text-4xl mb-4">
          {depositStatus ? getStatusIcon(depositStatus.status) : '📋'}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Deposit Status</h2>
        <p className="text-gray-600">Deposit ID: {depositId}</p>
      </div>

      {depositStatus && (
        <div className="space-y-4">
          {/* Status Badge */}
          <div className={`p-3 rounded-md border ${getStatusColor(depositStatus.status)}`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              <span className="font-semibold">{depositStatus.status}</span>
            </div>
          </div>

          {/* Deposit Details */}
          <div className="bg-gray-50 p-4 rounded-md space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Requested Amount:</span>
              <span className="font-medium">{depositStatus.currency} {depositStatus.requestedAmount}</span>
            </div>
            {depositStatus.depositedAmount && (
              <div className="flex justify-between">
                <span className="text-gray-600">Deposited Amount:</span>
                <span className="font-medium">{depositStatus.currency} {depositStatus.depositedAmount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <span className="font-medium">{depositStatus.payer.address.value}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Provider:</span>
              <span className="font-medium">{depositStatus.correspondent}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Country:</span>
              <span className="font-medium">{depositStatus.country}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span className="font-medium">
                {new Date(depositStatus.created).toLocaleString()}
              </span>
            </div>
            {depositStatus.completed && (
              <div className="flex justify-between">
                <span className="text-gray-600">Completed:</span>
                <span className="font-medium">
                  {new Date(depositStatus.completed).toLocaleString()}
                </span>
              </div>
            )}
            {depositStatus.statementDescription && (
              <div className="pt-2 border-t border-gray-200">
                <span className="text-gray-600">Description:</span>
                <p className="font-medium mt-1">{depositStatus.statementDescription}</p>
              </div>
            )}
          </div>

          {/* Failure Reason */}
          {depositStatus.failureReason && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-md">
              <h4 className="font-medium text-red-800 mb-1">Failure Reason:</h4>
              <p className="text-red-700 text-sm">
                {depositStatus.failureReason.failureMessage}
              </p>
              <p className="text-red-600 text-xs mt-1">
                Code: {depositStatus.failureReason.failureCode}
              </p>
            </div>
          )}

          {/* Status Messages */}
          {depositStatus.status === 'PENDING' && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
              <p className="text-yellow-800 text-sm">
                Your deposit is being processed. Please check your phone for any prompts from your mobile money provider.
              </p>
            </div>
          )}

          {depositStatus.status === 'COMPLETED' && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-md">
              <p className="text-green-800 text-sm">
                Deposit completed successfully! You should receive a confirmation SMS shortly.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 space-y-2">
        <button
          onClick={onNewPayment}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Make Another Payment
        </button>
        
        {depositStatus && ['PENDING', 'ENQUEUED'].includes(depositStatus.status) && (
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Refresh Status
          </button>
        )}
      </div>
    </div>
  );
}
