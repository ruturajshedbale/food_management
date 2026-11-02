import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { cancelAllocation } from '@/services/allocation.service';
import { query } from '@/lib/mysql';
import { RowDataPacket } from 'mysql2';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = await query<RowDataPacket[]>(
      `SELECT a.*, d.food_type, d.unit, dn.organization_name AS donor_name, rc.organization_name AS recipient_name
       FROM donation_allocations a
       JOIN food_donations d ON a.donation_id = d.donation_id
       JOIN donors dn ON d.donor_id = dn.donor_id
       JOIN food_requests r ON a.request_id = r.request_id
       JOIN recipients rc ON r.recipient_id = rc.recipient_id
       WHERE a.allocation_id = ?`,
      [parseInt(id, 10)]
    );
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Allocation not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, allocation: rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch allocation' }, { status: 500 });
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
    const allocId = parseInt(id, 10);

    const result = await cancelAllocation(allocId, user.user_id);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to cancel allocation' }, { status: 500 });
  }
}
