import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { getCurrentUser } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const recipientId = searchParams.get('recipient_id') 
      ? parseInt(searchParams.get('recipient_id')!, 10) 
      : (user?.profile_id || 1);

    const stats = await query<RowDataPacket[]>(
      `SELECT 
          rc.recipient_id,
          rc.organization_name,
          rc.capacity,
          COUNT(r.request_id) AS total_requests,
          COALESCE(SUM(r.quantity_required), 0) AS total_required_kg,
          COALESCE(SUM(r.quantity_fulfilled), 0) AS total_fulfilled_kg,
          COALESCE(SUM(r.quantity_required - r.quantity_fulfilled), 0) AS total_outstanding_kg,
          SUM(CASE WHEN r.status = 'PENDING' THEN 1 ELSE 0 END) AS pending_requests_count
       FROM recipients rc
       LEFT JOIN food_requests r ON rc.recipient_id = r.recipient_id
       WHERE rc.recipient_id = ?
       GROUP BY rc.recipient_id`,
      [recipientId]
    );

    const activeAllocations = await query<RowDataPacket[]>(
      `SELECT 
          a.allocation_id, a.allocated_quantity, a.status AS allocation_status,
          d.food_type, d.unit, dn.organization_name AS donor_organization,
          del.delivery_id, del.delivery_status, del.delivered_quantity,
          u.name AS volunteer_name
       FROM donation_allocations a
       JOIN food_donations d ON a.donation_id = d.donation_id
       JOIN donors dn ON d.donor_id = dn.donor_id
       JOIN food_requests r ON a.request_id = r.request_id
       LEFT JOIN deliveries del ON a.allocation_id = del.allocation_id
       LEFT JOIN pickups p ON del.pickup_id = p.pickup_id
       LEFT JOIN volunteers v ON p.volunteer_id = v.volunteer_id
       LEFT JOIN users u ON v.user_id = u.user_id
       WHERE r.recipient_id = ?
       ORDER BY a.allocation_time DESC`,
      [recipientId]
    );

    return NextResponse.json({
      success: true,
      stats: stats[0] || null,
      activeAllocations,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve recipient analytics' }, { status: 500 });
  }
}
