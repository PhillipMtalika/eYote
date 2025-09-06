import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { depositId, returnUrl, reason } = await request.json();

    // Validate required fields
    if (!depositId || !returnUrl || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: depositId, returnUrl, reason' },
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

    // Create payment page request using PawaPay v2 API format (with DRC as default country)
    const paymentPageRequest = {
      depositId: depositId,
      returnUrl: `https://merchant.com/paymentProcessed?depositId=${depositId}`,
      reason: reason,
      country: "COD"  // Set DRC as default country
    };

    // Call PawaPay v2 Payment Page API directly
    const pawaPayResponse = await fetch('https://api.sandbox.pawapay.io/v2/paymentpage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
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
          retryable: pawaPayResponse.status >= 500
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
      message: 'Payment page created successfully'
    });

  } catch (error) {
    console.error('Create payment API error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create payment page',
        success: false,
        retryable: true
      },
      { status: 500 }
    );
  }
}
