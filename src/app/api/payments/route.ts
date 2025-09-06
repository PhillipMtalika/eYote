import { NextRequest, NextResponse } from 'next/server';
import { EnhancedPawaPayService } from '@/lib/enhanced-pawapay';
import { PaymentConfigService } from '@/lib/payment-config';
import { PaymentPageRequest } from '@/types/payment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, phoneNumber, country, currency, description } = body;

    // Validate required fields
    if (!amount || !phoneNumber || !country || !currency || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate phone number
    const phoneValidation = EnhancedPawaPayService.validatePhoneNumber(phoneNumber, country);
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        { error: phoneValidation.error || 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Validate amount against limits
    const amountValidation = PaymentConfigService.validateAmount(numAmount, country, currency);
    if (!amountValidation.isValid) {
      return NextResponse.json(
        { 
          error: amountValidation.error || 'Amount validation failed',
          limits: amountValidation.limits
        },
        { status: 400 }
      );
    }

    // Generate unique deposit ID with session tracking
    const sessionId = request.headers.get('x-session-id') || crypto.randomUUID();
    const depositId = EnhancedPawaPayService.generateDepositId('eYote');
    
    // Get base URL for return URL
    const baseUrl = request.headers.get('origin') || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/payment/success`;

    // Create payment page request
    const paymentPageRequest: PaymentPageRequest = {
      depositId: depositId,
      returnUrl: returnUrl,
      customerMessage: description.substring(0, 22), // PawaPay limit is 4-22 chars
      amountDetails: {
        amount: parseFloat(amount).toFixed(2),
        currency: currency
      },
      phoneNumber: phoneValidation.formatted || phoneNumber,
      language: 'EN',
      country: country,
      reason: description,
      metadata: [
        {
          source: 'eYote',
          timestamp: new Date().toISOString()
        }
      ]
    };

    // Create payment page with enhanced error handling
    const result = await EnhancedPawaPayService.createPaymentPage(paymentPageRequest, {
      validateLimits: true,
      sessionId: sessionId
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error?.message || 'Payment page creation failed',
          code: result.error?.code,
          retryable: result.error?.retryable || false,
          success: false 
        },
        { status: result.error?.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      depositId: result.data?.depositId,
      redirectUrl: result.data?.redirectUrl,
      sessionId: sessionId,
      message: 'Payment page created successfully'
    });

  } catch (error) {
    console.error('Payment page API error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Payment page creation failed',
        success: false 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const depositId = searchParams.get('depositId');

    if (!depositId) {
      return NextResponse.json(
        { error: 'Deposit ID is required' },
        { status: 400 }
      );
    }

    // Get deposit status with enhanced error handling
    const result = await EnhancedPawaPayService.getDepositStatus(depositId);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error?.message || 'Failed to get deposit status',
          code: result.error?.code,
          retryable: result.error?.retryable || false,
          success: false 
        },
        { status: result.error?.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deposit: result.data,
    });

  } catch (error) {
    console.error('Deposit status API error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to get deposit status',
        success: false,
        retryable: true
      },
      { status: 500 }
    );
  }
}
