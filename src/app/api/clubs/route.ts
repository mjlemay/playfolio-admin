import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get API URL from environment variable
    const apiUrl = process.env.PLAYFOLIO_API_URL;
    
    if (!apiUrl) {
      return NextResponse.json(
        { error: 'PLAYFOLIO_API_URL environment variable is not set' },
        { status: 500 }
      );
    }

    // Make request to get all clubs
    const response = await fetch(`${apiUrl}/clubs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch clubs: ${response.statusText}` },
        { status: response.status }
      );
    }

    const clubs = await response.json();

    return NextResponse.json(
      { 
        clubs,
        success: true 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Clubs API error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to clubs service' },
      { status: 500 }
    );
  }
}