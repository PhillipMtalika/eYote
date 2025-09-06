import { NextRequest, NextResponse } from 'next/server';
import { EnhancedPawaPayService } from '@/lib/enhanced-pawapay';

export async function POST(request: NextRequest) {
  try {
    // Get webhook signature from headers
    const signature = request.headers.get('x-pawapay-signature');
    
    // Parse webhook payload
    const payload = await request.json();
    
    console.log('Received PawaPay webhook:', {
      depositId: payload.depositId,
      status: payload.status,
      timestamp: new Date().toISOString()
    });

    // Process webhook with signature verification
    const result = await EnhancedPawaPayService.processWebhook(payload, signature || undefined);
    
    if (!result.success) {
      console.error('Webhook processing failed:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Here you would typically:
    // 1. Update payment status in your database
    // 2. Send notifications to users
    // 3. Trigger business logic based on status
    // 4. Update analytics/reporting

    console.log('Webhook processed successfully:', {
      depositId: result.depositId,
      status: result.status
    });

    // Respond with 200 to acknowledge receipt
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      depositId: result.depositId
    });

  } catch (error) {
    console.error('Webhook handler error:', error);
    
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { message: 'PawaPay webhook endpoint is active' },
    { status: 200 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
