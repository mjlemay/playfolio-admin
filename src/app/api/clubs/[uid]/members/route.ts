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

    const response = await fetch(`${apiUrl}/api/clubs/${uid}/members`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch members: ${response.statusText}` },
        { status: response.status }
      );
    }

    const apiResponse = await response.json();
    const members = apiResponse.data || [];

    return NextResponse.json({ members, success: true, count: apiResponse.count || members.length }, { status: 200 });
  } catch (error) {
    console.error('Members API error:', error);
    return NextResponse.json({ error: 'Failed to connect to members service' }, { status: 500 });
  }
}
