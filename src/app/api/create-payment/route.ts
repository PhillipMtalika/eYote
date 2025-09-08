import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { depositId, orderId, reason, country, amount } = await request.json();

    // Validate required fields
    if (!depositId || !orderId || !reason || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: depositId, orderId, reason, amount' },
        { status: 400 }
      );
    }

    // Get PawaPay API token from environment
    const apiToken = process.env.PAWAPAY_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json(
        { error: 'PawaPay API token not configured' },
        { status: 500 }
      );
    }

    // Determine the base URL for the returnUrl
    const baseUrl = 'https://payment.eyote.net';
    const returnUrl = `${baseUrl}/payment/return?depositId=${depositId}`;

    console.log(`🔧 Constructed returnUrl: ${returnUrl}`);
    
    console.log(`💰 Amount: ${amount}`);
    
    const paymentPageRequest = {
      depositId: depositId,
      returnUrl: returnUrl,
      statementDescription: `eYote ${depositId.substring(0, 8)}`,
      amount: amount.toString(), // Amount from frontend as string
      language: "FR",
      country: country || "COD",
      reason: reason,
      metadata: [
        {"fieldName": "orderId", "fieldValue": orderId}
      ]
    };

    console.log(`🔧 PawaPay payload:`, JSON.stringify(paymentPageRequest, null, 2));

    // Call PawaPay v1 Widget Sessions API (as per your specification)
    const pawaPayResponse = await fetch('https://api.sandbox.pawapay.io/v1/widget/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentPageRequest),
    });

    if (!pawaPayResponse.ok) {
      const errorData = await pawaPayResponse.json().catch(() => ({}));
      console.error('PawaPay API error:', errorData);

      return NextResponse.json(
        {
          error: errorData.message || `PawaPay API error: ${pawaPayResponse.status}`,
          success: false,
          retryable: pawaPayResponse.status >= 500,
        },
        { status: pawaPayResponse.status }
      );
    }

    const pawaPayData = await pawaPayResponse.json();

    // Return the redirect URL from PawaPay
    return NextResponse.json({
      success: true,
      depositId: depositId,
      redirectUrl: pawaPayData.redirectUrl,
      message: 'Payment page created successfully',
    });
  } catch (error) {
    console.error('Create payment API error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create payment page',
        success: false,
        retryable: true,
      },
      { status: 500 }
    );
  }
}