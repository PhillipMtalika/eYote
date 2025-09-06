import { NextResponse } from 'next/server';
import { PawaPayService } from '@/lib/pawapay';

export async function GET() {
  try {
    // Get available countries from PawaPay service
    const countries = PawaPayService.getAvailableCountries();

    return NextResponse.json({
      success: true,
      countries,
    });

  } catch (error) {
    console.error('Countries API error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to get countries',
        success: false 
      },
      { status: 500 }
    );
  }
}
