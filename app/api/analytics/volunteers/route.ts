import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { getCurrentUser } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const volunteerId = searchParams.get('volunteer_id') 
      ? parseInt(searchParams.get('volunteer_id')!, 10) 
      : (user?.profile_id || 1);

    const scorecard = await query<RowDataPacket[]>(
      `SELECT * FROM volunteer_performance_view WHERE volunteer_id = ?`,
      [volunteerId]
    );

    const pendingPickups = await query<RowDataPacket[]>(
      `SELECT 
          p.pickup_id, p.donation_id, p.scheduled_time, p.pickup_status,
          d.food_type, d.remaining_quantity, d.unit,
          dn.organization_name AS donor_organization,
          dn.address AS pickup_address,
          dn.contact_person AS donor_contact
       FROM pickups p
       JOIN food_donations d ON p.donation_id = d.donation_id
       JOIN donors dn ON d.donor_id = dn.donor_id
       WHERE p.volunteer_id = ? AND p.pickup_status IN ('ASSIGNED', 'ACCEPTED')
       ORDER BY p.scheduled_time ASC`,
      [volunteerId]
    );

    const activeDeliveries = await query<RowDataPacket[]>(
      `SELECT 
          del.delivery_id, del.pickup_id, del.allocation_id, del.delivery_status, del.delivered_quantity,
          a.allocated_quantity,
          d.food_type, d.unit,
          rc.organization_name AS recipient_organization,
          rc.address AS delivery_address,
          rc.contact_person AS recipient_contact
       FROM deliveries del
       JOIN donation_allocations a ON del.allocation_id = a.allocation_id
       JOIN food_donations d ON a.donation_id = d.donation_id
       JOIN food_requests r ON a.request_id = r.request_id
       JOIN recipients rc ON r.recipient_id = rc.recipient_id
       JOIN pickups p ON del.pickup_id = p.pickup_id
       WHERE p.volunteer_id = ? AND del.delivery_status IN ('PENDING', 'IN_TRANSIT')
       ORDER BY del.created_at ASC`,
      [volunteerId]
    );

    return NextResponse.json({
      success: true,
      scorecard: scorecard[0] || null,
      pendingPickups,
      activeDeliveries,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve volunteer analytics' }, { status: 500 });
  }
}
