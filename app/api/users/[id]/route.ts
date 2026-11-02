import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/mysql';
import { ResultSetHeader } from 'mysql2';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
    }

    const { id } = await params;
    const targetUserId = parseInt(id, 10);
    const body = await req.json();
    const { status } = body;

    if (!['ACTIVE', 'SUSPENDED', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Invalid user status' }, { status: 400 });
    }

    const res = await query<ResultSetHeader>(
      'UPDATE users SET status = ? WHERE user_id = ?',
      [status, targetUserId]
    );

    if (res.affectedRows === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `User status updated to ${status}` });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
