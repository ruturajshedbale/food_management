import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/mysql';
import { processOutboxEvents } from '@/lib/outbox';
import { RowDataPacket } from 'mysql2';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;
    const deliveryId = parseInt(id, 10);
    const body = await req.json();
    const { delivery_status, delivered_quantity, recipient_signature } = body;

    await query('SET @v_msg = ""');
    await query(
      'CALL update_delivery_status(?, ?, ?, ?, @v_msg)',
      [deliveryId, delivery_status, delivered_quantity || 0, recipient_signature || null]
    );

    interface ProcMsg extends RowDataPacket {
      v_msg: string;
    }
    const res = await query<ProcMsg[]>('SELECT @v_msg AS v_msg');
    const msg = res[0]?.v_msg || '';

    if (msg.startsWith('SUCCESS')) {
      processOutboxEvents().catch(err => console.warn(err));
      return NextResponse.json({ success: true, message: msg });
    } else {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } catch (err: any) {
    console.error('PATCH /api/deliveries/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update delivery' }, { status: 500 });
  }
}
