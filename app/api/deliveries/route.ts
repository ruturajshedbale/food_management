import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/mysql';
import { processOutboxEvents } from '@/lib/outbox';
import { ResultSetHeader } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const recipientId = searchParams.get('recipient_id');
    const volunteerId = searchParams.get('volunteer_id');
    const status = searchParams.get('status');

    let sql = `
      SELECT 
        del.*,
        a.allocated_quantity,
        a.donation_id,
        a.request_id,
        d.food_type,
        d.unit,
        dn.organization_name AS donor_organization,
        dn.address AS donor_address,
        rc.recipient_id,
        rc.organization_name AS recipient_organization,
        rc.address AS delivery_address,
        u.name AS volunteer_name,
        f.feedback_id,
        f.rating,
        f.comments
      FROM deliveries del
      JOIN donation_allocations a ON del.allocation_id = a.allocation_id
      JOIN food_donations d ON a.donation_id = d.donation_id
      JOIN donors dn ON d.donor_id = dn.donor_id
      JOIN food_requests r ON a.request_id = r.request_id
      JOIN recipients rc ON r.recipient_id = rc.recipient_id
      JOIN pickups p ON del.pickup_id = p.pickup_id
      JOIN volunteers v ON p.volunteer_id = v.volunteer_id
      JOIN users u ON v.user_id = u.user_id
      LEFT JOIN feedback f ON del.delivery_id = f.delivery_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (recipientId) {
      sql += ' AND rc.recipient_id = ?';
      params.push(parseInt(recipientId, 10));
    }
    if (volunteerId) {
      sql += ' AND v.volunteer_id = ?';
      params.push(parseInt(volunteerId, 10));
    }
    if (status) {
      sql += ' AND del.delivery_status = ?';
      params.push(status);
    }

    sql += ' ORDER BY del.created_at DESC';
    const deliveries = await query(sql, params);
    return NextResponse.json({ success: true, deliveries });
  } catch (err: any) {
    console.error('GET /api/deliveries error:', err);
    return NextResponse.json({ error: 'Failed to retrieve deliveries' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await req.json();
    const { pickup_id, allocation_id, delivered_quantity } = body;

    if (!pickup_id || !allocation_id) {
      return NextResponse.json({ error: 'pickup_id and allocation_id are required' }, { status: 400 });
    }

    const res = await query<ResultSetHeader>(
      `INSERT INTO deliveries (pickup_id, allocation_id, delivery_status, delivered_quantity, created_at)
       VALUES (?, ?, 'PENDING', ?, NOW())`,
      [pickup_id, allocation_id, delivered_quantity || 0]
    );

    const deliveryId = res.insertId;

    await query(
      `INSERT INTO outbox_events (aggregate_type, aggregate_id, event_type, payload, status, created_at)
       VALUES ('DELIVERY', ?, 'DELIVERY_SCHEDULED', JSON_OBJECT('delivery_id', ?, 'pickup_id', ?, 'allocation_id', ?), 'PENDING', NOW())`,
      [deliveryId, deliveryId, pickup_id, allocation_id]
    );

    processOutboxEvents().catch(err => console.warn(err));

    return NextResponse.json({ success: true, delivery_id: deliveryId, message: 'Delivery routed successfully' }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/deliveries error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create delivery record' }, { status: 500 });
  }
}
