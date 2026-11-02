import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/mysql';
import { FeedbackSchema } from '@/lib/validation';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deliveryId = searchParams.get('delivery_id');

    let sql = `
      SELECT 
        f.*,
        del.delivered_quantity,
        del.delivery_time,
        d.food_type,
        dn.organization_name AS donor_organization,
        rc.organization_name AS recipient_organization,
        u.name AS volunteer_name
      FROM feedback f
      JOIN deliveries del ON f.delivery_id = del.delivery_id
      JOIN donation_allocations a ON del.allocation_id = a.allocation_id
      JOIN food_donations d ON a.donation_id = d.donation_id
      JOIN donors dn ON d.donor_id = dn.donor_id
      JOIN food_requests r ON a.request_id = r.request_id
      JOIN recipients rc ON r.recipient_id = rc.recipient_id
      JOIN pickups p ON del.pickup_id = p.pickup_id
      JOIN volunteers v ON p.volunteer_id = v.volunteer_id
      JOIN users u ON v.user_id = u.user_id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (deliveryId) {
      sql += ' AND f.delivery_id = ?';
      params.push(parseInt(deliveryId, 10));
    }
    sql += ' ORDER BY f.created_at DESC';

    const feedback = await query(sql, params);
    return NextResponse.json({ success: true, feedback });
  } catch (err: any) {
    console.error('GET /api/feedback error:', err);
    return NextResponse.json({ error: 'Failed to retrieve feedback' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await req.json();
    const parsed = FeedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid feedback data' }, { status: 400 });
    }

    // Check if feedback already exists for this delivery (UNIQUE constraint enforcement)
    const existing = await query<RowDataPacket[]>(
      'SELECT feedback_id FROM feedback WHERE delivery_id = ?',
      [parsed.data.delivery_id]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Feedback has already been submitted for this delivery' }, { status: 409 });
    }

    const res = await query<ResultSetHeader>(
      `INSERT INTO feedback (delivery_id, rating, comments, created_at)
       VALUES (?, ?, ?, NOW())`,
      [parsed.data.delivery_id, parsed.data.rating, parsed.data.comments || null]
    );

    return NextResponse.json({
      success: true,
      feedback_id: res.insertId,
      message: 'Feedback submitted successfully. Thank you for rating the food rescue delivery!',
    }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/feedback error:', err);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
