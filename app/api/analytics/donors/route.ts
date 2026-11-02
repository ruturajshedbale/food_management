import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { getCurrentUser } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const donorId = searchParams.get('donor_id') 
      ? parseInt(searchParams.get('donor_id')!, 10) 
      : (user?.profile_id || 1);

    const summary = await query<RowDataPacket[]>(
      `SELECT * FROM donation_summary_view WHERE donor_id = ?`,
      [donorId]
    );

    const history = await query<RowDataPacket[]>(
      `SELECT 
          d.donation_id, d.food_type, d.quantity, d.remaining_quantity, 
          d.unit, d.prepared_time, d.expiry_time, d.status, d.created_at,
          COUNT(a.allocation_id) AS allocations_count
       FROM food_donations d
       LEFT JOIN donation_allocations a ON d.donation_id = a.donation_id
       WHERE d.donor_id = ?
       GROUP BY d.donation_id
       ORDER BY d.created_at DESC`,
      [donorId]
    );

    const pickups = await query<RowDataPacket[]>(
      `SELECT 
          p.pickup_id, p.scheduled_time, p.pickup_time, p.pickup_status,
          d.food_type, d.quantity, u.name AS volunteer_name, u.phone AS volunteer_phone
       FROM pickups p
       JOIN food_donations d ON p.donation_id = d.donation_id
       JOIN volunteers v ON p.volunteer_id = v.volunteer_id
       JOIN users u ON v.user_id = u.user_id
       WHERE d.donor_id = ?
       ORDER BY p.scheduled_time DESC`,
      [donorId]
    );

    return NextResponse.json({
      success: true,
      summary: summary[0] || null,
      history,
      pickups,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve donor analytics' }, { status: 500 });
  }
}
