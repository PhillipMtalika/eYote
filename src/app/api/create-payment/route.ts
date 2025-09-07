import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { depositId, reason, country } = await request.json();

    // Validate required fields
    if (!depositId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: depositId, reason' },
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
    // LOCALHOST FOCUS: Simple solution for local development
    const host = request.headers.get('host');
    const isLocalhost = !host || host.includes('localhost') || host.includes('127.0.0.1');
    
    let returnUrl;
    if (isLocalhost) {
      // For localhost: PawaPay requires HTTPS, so use a redirect service
      // This will redirect back to your localhost after payment
      returnUrl = `https://httpbin.org/redirect-to?url=http://localhost:3000/payment/return?depositId=${depositId}`;
      
      console.log(`\n🔧 LOCALHOST DEV MODE:`);
      console.log(`✅ Payment created with depositId: ${depositId}`);
      console.log(`🔗 After payment, PawaPay will redirect through httpbin to:`);
      console.log(`📱 http://localhost:3000/payment/return?depositId=${depositId}`);
      console.log(`\n`);
    } else {
      // Production: Use actual domain
      returnUrl = `https://${host}/payment/return?depositId=${depositId}`;
    }
    
    const paymentPageRequest = {
      depositId: depositId,
      returnUrl: returnUrl,
      reason: reason,
      country: country || "COD"  // Use provided country or default to DRC
    };

    // Call PawaPay v2 Payment Page API
    const pawaPayResponse = await fetch('https://api.sandbox.pawapay.io/v2/paymentpage', {
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