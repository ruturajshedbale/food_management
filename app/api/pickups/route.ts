import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/mysql';
import { AssignPickupSchema } from '@/lib/validation';
import { processOutboxEvents } from '@/lib/outbox';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const volunteerId = searchParams.get('volunteer_id') ? parseInt(searchParams.get('volunteer_id')!, 10) : undefined;
    const status = searchParams.get('status') || undefined;

    let sql = `
      SELECT 
        p.*,
        d.food_type,
        d.quantity AS total_donation_qty,
        d.remaining_quantity,
        d.unit,
        d.expiry_time,
        dn.donor_id,
        dn.organization_name AS donor_organization,
        dn.contact_person AS donor_contact,
        dn.address AS pickup_address,
        u.name AS volunteer_name,
        v.vehicle_type
      FROM pickups p
      JOIN food_donations d ON p.donation_id = d.donation_id
      JOIN donors dn ON d.donor_id = dn.donor_id
      JOIN volunteers v ON p.volunteer_id = v.volunteer_id
      JOIN users u ON v.user_id = u.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (volunteerId) {
      sql += ' AND p.volunteer_id = ?';
      params.push(volunteerId);
    }
    if (status) {
      sql += ' AND p.pickup_status = ?';
      params.push(status);
    }

    sql += ' ORDER BY p.scheduled_time ASC';
    const pickups = await query(sql, params);
    return NextResponse.json({ success: true, pickups });
  } catch (err: any) {
    console.error('GET /api/pickups error:', err);
    return NextResponse.json({ error: 'Failed to retrieve pickups' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await req.json();
    const parsed = AssignPickupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid parameters' }, { status: 400 });
    }

    await query('SET @v_pickup_id = 0, @v_msg = ""');
    await query(
      'CALL assign_volunteer(?, ?, ?, @v_pickup_id, @v_msg)',
      [parsed.data.donation_id, parsed.data.volunteer_id, parsed.data.scheduled_time]
    );

    interface ProcResult extends RowDataPacket {
      v_id: number;
      v_msg: string;
    }
    const res = await query<ProcResult[]>('SELECT @v_pickup_id AS v_id, @v_msg AS v_msg');
    const pickupId = Number(res[0]?.v_id || 0);
    const msg = res[0]?.v_msg || '';

    if (pickupId > 0) {
      processOutboxEvents().catch(err => console.warn(err));
      return NextResponse.json({ success: true, pickup_id: pickupId, message: msg }, { status: 201 });
    } else {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } catch (err: any) {
    console.error('POST /api/pickups error:', err);
    return NextResponse.json({ error: 'Failed to assign pickup' }, { status: 500 });
  }
}
