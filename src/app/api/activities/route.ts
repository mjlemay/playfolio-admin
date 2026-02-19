import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.PLAYFOLIO_API_URL;
    if (!apiUrl) {
      return NextResponse.json({ error: 'PLAYFOLIO_API_URL environment variable is not set' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const upstream = new URLSearchParams();
    for (const [key, value] of searchParams.entries()) {
      upstream.set(key, value);
    }

    const response = await fetch(`${apiUrl}/api/activities?${upstream.toString()}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch activities: ${response.statusText}` }, { status: response.status });
    }

    const apiResponse = await response.json();
    return NextResponse.json({
      activities: apiResponse.data || [],
      success: true,
      count: apiResponse.count || 0,
      total: apiResponse.total || 0,
    });
  } catch (error) {
    console.error('Activities GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}
