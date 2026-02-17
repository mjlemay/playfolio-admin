import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ uid: string; key: string }> }) {
  try {
    const apiUrl = process.env.PLAYFOLIO_API_URL;

    if (!apiUrl) {
      return NextResponse.json(
        { error: 'PLAYFOLIO_API_URL environment variable is not set' },
        { status: 500 }
      );
    }

    const { uid, key } = await params;

    const response = await fetch(`${apiUrl}/api/clubs/${uid}/keys/${key}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to delete key: ${response.statusText}` },
        { status: response.status }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Keys DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete key' }, { status: 500 });
  }
}
