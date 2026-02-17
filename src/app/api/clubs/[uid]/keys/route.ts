import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const apiUrl = process.env.PLAYFOLIO_API_URL;

    if (!apiUrl) {
      return NextResponse.json(
        { error: 'PLAYFOLIO_API_URL environment variable is not set' },
        { status: 500 }
      );
    }

    const { uid } = await params;

    const response = await fetch(`${apiUrl}/api/clubs/${uid}/keys`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch keys: ${response.statusText}` },
        { status: response.status }
      );
    }

    const apiResponse = await response.json();
    const keys = apiResponse.data || [];

    return NextResponse.json({ keys, success: true, count: apiResponse.count || keys.length }, { status: 200 });
  } catch (error) {
    console.error('Keys GET error:', error);
    return NextResponse.json({ error: 'Failed to connect to keys service' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const apiUrl = process.env.PLAYFOLIO_API_URL;

    if (!apiUrl) {
      return NextResponse.json(
        { error: 'PLAYFOLIO_API_URL environment variable is not set' },
        { status: 500 }
      );
    }

    const { uid } = await params;
    const body = await request.json();

    const response = await fetch(`${apiUrl}/api/clubs/${uid}/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_uid: body.player_uid }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to create key: ${response.statusText}` },
        { status: response.status }
      );
    }

    const apiResponse = await response.json();

    return NextResponse.json(apiResponse, { status: 201 });
  } catch (error) {
    console.error('Keys POST error:', error);
    return NextResponse.json({ error: 'Failed to create key' }, { status: 500 });
  }
}
