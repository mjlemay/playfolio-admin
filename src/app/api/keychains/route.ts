import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiUrl = process.env.PLAYFOLIO_API_URL;
    if (!apiUrl) {
      return NextResponse.json({ error: 'PLAYFOLIO_API_URL environment variable is not set' }, { status: 500 });
    }

    const response = await fetch(`${apiUrl}/api/keychains`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch keychains: ${response.statusText}` }, { status: response.status });
    }

    const apiResponse = await response.json();
    return NextResponse.json({ keychains: apiResponse.data || [], success: true, count: apiResponse.count || 0 });
  } catch (error) {
    console.error('Keychains GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch keychains' }, { status: 500 });
  }
}

// POST /api/keychains - join flow: { auth_code, player_uid }
export async function POST(request: NextRequest) {
  try {
    const apiUrl = process.env.PLAYFOLIO_API_URL;
    if (!apiUrl) {
      return NextResponse.json({ error: 'PLAYFOLIO_API_URL environment variable is not set' }, { status: 500 });
    }

    const body = await request.json();

    const response = await fetch(`${apiUrl}/api/keychains`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth_code: body.auth_code, player_uid: body.player_uid }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      return NextResponse.json({ error: errBody.error || `Failed: ${response.statusText}` }, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    console.error('Keychains POST error:', error);
    return NextResponse.json({ error: 'Failed to join keychain' }, { status: 500 });
  }
}
