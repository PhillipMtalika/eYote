import { Suspense } from 'react';
import PaymentDisplay from '@/components/PaymentDisplay';

export default function Home() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PaymentDisplay />
    </Suspense>
  );
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
        <h2 className="text-2xl font-semibold text-gray-700 mt-8">Loading Payment Details...</h2>
      </div>
    </div>
  );
}
