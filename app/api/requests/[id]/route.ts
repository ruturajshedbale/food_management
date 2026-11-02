import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getRequestById, cancelRequest } from '@/services/request.service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const request = await getRequestById(parseInt(id, 10));
    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, request });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch request' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;
    const requestId = parseInt(id, 10);
    const existing = await getRequestById(requestId);
    if (!existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    if (user.role !== 'ADMIN' && user.profile_id !== existing.recipient_id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this request' }, { status: 403 });
    }

    const cancelled = await cancelRequest(requestId, existing.recipient_id);
    if (!cancelled) {
      return NextResponse.json({ error: 'Cannot cancel a request that is already fulfilled or cancelled' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Request cancelled successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to cancel request' }, { status: 500 });
  }
}
