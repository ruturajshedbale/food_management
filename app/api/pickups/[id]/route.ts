import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/mysql';
import { processOutboxEvents } from '@/lib/outbox';
import { ResultSetHeader } from 'mysql2';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;
    const pickupId = parseInt(id, 10);
    const body = await req.json();
    const { status } = body;

    if (!['ACCEPTED', 'PICKED_UP', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid pickup status' }, { status: 400 });
    }

    const updates: string[] = ['pickup_status = ?'];
    const sqlParams: any[] = [status];

    if (status === 'PICKED_UP') {
      updates.push('pickup_time = NOW()');
    }

    sqlParams.push(pickupId);

    const res = await query<ResultSetHeader>(
      `UPDATE pickups SET ${updates.join(', ')} WHERE pickup_id = ?`,
      sqlParams
    );

    if (res.affectedRows === 0) {
      return NextResponse.json({ error: 'Pickup not found' }, { status: 404 });
    }

    // Insert outbox event for MongoDB sync
    await query(
      `INSERT INTO outbox_events (aggregate_type, aggregate_id, event_type, payload, status, created_at)
       VALUES ('PICKUP', ?, ?, JSON_OBJECT('pickup_id', ?, 'status', ?, 'actor_id', ?), 'PENDING', NOW())`,
      [pickupId, `PICKUP_${status}`, pickupId, status, user.user_id]
    );

    processOutboxEvents().catch(err => console.warn(err));

    return NextResponse.json({ success: true, message: `Pickup status updated to ${status}` });
  } catch (err: any) {
    console.error('PATCH /api/pickups/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update pickup status' }, { status: 500 });
  }
}
