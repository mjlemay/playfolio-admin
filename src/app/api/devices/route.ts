import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiUrl = process.env.PLAYFOLIO_API_URL;
    if (!apiUrl) {
      return NextResponse.json({ error: 'PLAYFOLIO_API_URL environment variable is not set' }, { status: 500 });
    }

    const response = await fetch(`${apiUrl}/api/devices`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch devices: ${response.statusText}` }, { status: response.status });
    }

    const apiResponse = await response.json();
    const devices = apiResponse.data || [];

    return NextResponse.json({ devices, success: true, count: devices.length });
  } catch (error) {
    console.error('Devices GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiUrl = process.env.PLAYFOLIO_API_URL;
    if (!apiUrl) {
      return NextResponse.json({ error: 'PLAYFOLIO_API_URL environment variable is not set' }, { status: 500 });
    }

    const body = await request.json();

    const response = await fetch(`${apiUrl}/api/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: body.name, club_id: body.club_id }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      return NextResponse.json({ error: errBody.error || `Failed to create device: ${response.statusText}` }, { status: response.status });
    }

    return NextResponse.json(await response.json(), { status: 201 });
  } catch (error) {
    console.error('Devices POST error:', error);
    return NextResponse.json({ error: 'Failed to create device' }, { status: 500 });
  }
}
