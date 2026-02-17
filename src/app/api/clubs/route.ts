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
    const response = await fetch(`${apiUrl}/api/clubs`, {
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

    const apiResponse = await response.json();

    // Extract clubs from the data array in the API response
    const clubs = apiResponse.data || [];

    return NextResponse.json(
      { 
        clubs,
        success: true,
        count: apiResponse.count || clubs.length
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

export async function POST(request: NextRequest) {
  try {
    const apiUrl = process.env.PLAYFOLIO_API_URL;
    const adminKey = process.env.PLAYFOLIO_ADMIN_KEY;

    if (!apiUrl) {
      return NextResponse.json({ error: 'PLAYFOLIO_API_URL environment variable is not set' }, { status: 500 });
    }
    if (!adminKey) {
      return NextResponse.json({ error: 'PLAYFOLIO_ADMIN_KEY environment variable is not set' }, { status: 500 });
    }

    const body = await request.json();

    const response = await fetch(`${apiUrl}/api/clubs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errBody.error || `Failed to create club: ${response.statusText}` },
        { status: response.status }
      );
    }

    const apiResponse = await response.json();
    return NextResponse.json(apiResponse, { status: 201 });
  } catch (error) {
    console.error('Clubs POST error:', error);
    return NextResponse.json({ error: 'Failed to create club' }, { status: 500 });
  }
}