import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.PLAYFOLIO_API_URL;
    if (!apiUrl) {
      return NextResponse.json({ error: 'PLAYFOLIO_API_URL environment variable is not set' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const auth_code = searchParams.get('auth_code');

    if (!auth_code) {
      return NextResponse.json({ error: 'auth_code is required' }, { status: 400 });
    }

    const response = await fetch(`${apiUrl}/api/keychains/lookup?auth_code=${encodeURIComponent(auth_code)}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Not found` }, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    console.error('Keychains lookup GET error:', error);
    return NextResponse.json({ error: 'Failed to look up keychain' }, { status: 500 });
  }
}
