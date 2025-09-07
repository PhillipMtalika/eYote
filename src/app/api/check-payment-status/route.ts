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
      
      // If deposit not found (404), it might be too early - return PENDING
      if (pawaPayResponse.status === 404) {
        console.log(`⏳ Deposit ${depositId} not found yet, returning PENDING status`);
        return NextResponse.json({
          success: true,
          deposit: {
            depositId: depositId,
            status: 'PENDING',
            amount: null,
            currency: 'CDF',
            requestedAmount: null,
            failureReason: null
          }
        });
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.message || `Failed to check payment status: ${pawaPayResponse.status}` 
        },
        { status: pawaPayResponse.status }
      );
    }

    const depositData = await pawaPayResponse.json();

    console.log(`🔍 PawaPay status response for ${depositId}:`, JSON.stringify(depositData, null, 2));

    // PawaPay returns an array, so get the first item
    const deposit = Array.isArray(depositData) ? depositData[0] : depositData;
    
    if (!deposit) {
      console.log(`❌ No deposit data found in response`);
      return NextResponse.json({
        success: false,
        error: 'No deposit data found'
      }, { status: 404 });
    }

    console.log(`✅ Found deposit with status: ${deposit.status}`);

    // Return the deposit status
    return NextResponse.json({
      success: true,
      deposit: {
        depositId: deposit.depositId || depositId,
        status: deposit.status || 'PENDING',
        amount: deposit.requestedAmount || deposit.depositedAmount || deposit.amount,
        currency: deposit.currency || 'CDF',
        requestedAmount: deposit.requestedAmount || deposit.depositedAmount,
        failureReason: deposit.failureReason
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
