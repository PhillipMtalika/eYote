import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const depositId = searchParams.get('depositId');

    if (!depositId) {
      return NextResponse.json(
        { success: false, error: 'Missing depositId parameter' },
        { status: 400 }
      );
    }

    // Get PawaPay API token from environment
    const apiToken = process.env.PAWAPAY_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json(
        { success: false, error: 'PawaPay API token not configured' },
        { status: 500 }
      );
    }

    // Call PawaPay API to check deposit status
    const pawaPayResponse = await fetch(`https://api.sandbox.pawapay.io/deposits/${depositId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!pawaPayResponse.ok) {
      const errorData = await pawaPayResponse.json().catch(() => ({}));
      console.error('PawaPay status check error:', errorData);
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.message || `Failed to check payment status: ${pawaPayResponse.status}` 
        },
        { status: pawaPayResponse.status }
      );
    }

    const depositData = await pawaPayResponse.json();

    // Return the deposit status
    return NextResponse.json({
      success: true,
      deposit: {
        depositId: depositData.depositId,
        status: depositData.status,
        amount: depositData.requestedAmount,
        currency: depositData.currency,
        requestedAmount: depositData.requestedAmount,
        failureReason: depositData.failureReason
      }
    });

  } catch (error) {
    console.error('Check payment status API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check payment status' 
      },
      { status: 500 }
    );
  }
}
