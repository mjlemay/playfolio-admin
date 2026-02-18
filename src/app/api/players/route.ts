import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiUrl = process.env.PLAYFOLIO_API_URL;
    if (!apiUrl) {
      return NextResponse.json({ error: 'PLAYFOLIO_API_URL environment variable is not set' }, { status: 500 });
    }

    const response = await fetch(`${apiUrl}/api/players`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch players: ${response.statusText}` }, { status: response.status });
    }

    const apiResponse = await response.json();
    const players = apiResponse.data || [];

    return NextResponse.json({ players, success: true, count: players.length });
  } catch (error) {
    console.error('Players GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiUrl = process.env.PLAYFOLIO_API_URL;
    if (!apiUrl) {
      return NextResponse.json({ error: 'PLAYFOLIO_API_URL environment variable is not set' }, { status: 500 });
    }

    const body = await request.json();

    const response = await fetch(`${apiUrl}/api/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meta: body.meta || null, status: body.status || null }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      return NextResponse.json({ error: errBody.error || `Failed to create player: ${response.statusText}` }, { status: response.status });
    }

    return NextResponse.json(await response.json(), { status: 201 });
  } catch (error) {
    console.error('Players POST error:', error);
    return NextResponse.json({ error: 'Failed to create player' }, { status: 500 });
  }
}
