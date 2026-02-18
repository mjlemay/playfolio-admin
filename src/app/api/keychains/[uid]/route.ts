import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const apiUrl = process.env.PLAYFOLIO_API_URL;
    if (!apiUrl) {
      return NextResponse.json({ error: 'PLAYFOLIO_API_URL environment variable is not set' }, { status: 500 });
    }

    const { uid } = await params;

    const response = await fetch(`${apiUrl}/api/keychains/${uid}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch keychain: ${response.statusText}` }, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    console.error('Keychain GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch keychain' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const apiUrl = process.env.PLAYFOLIO_API_URL;
    if (!apiUrl) {
      return NextResponse.json({ error: 'PLAYFOLIO_API_URL environment variable is not set' }, { status: 500 });
    }

    const { uid } = await params;

    const response = await fetch(`${apiUrl}/api/keychains/${uid}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to delete keychain: ${response.statusText}` }, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    console.error('Keychain DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete keychain' }, { status: 500 });
  }
}
