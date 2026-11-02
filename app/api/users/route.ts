import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/mysql';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');

    let sql = `
      SELECT 
        u.user_id, u.name, u.email, u.phone, u.role, u.status, u.created_at,
        dn.organization_name AS donor_org,
        rc.organization_name AS recipient_org,
        v.vehicle_type
      FROM users u
      LEFT JOIN donors dn ON u.user_id = dn.user_id
      LEFT JOIN recipients rc ON u.user_id = rc.user_id
      LEFT JOIN volunteers v ON u.user_id = v.user_id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (role) {
      sql += ' AND u.role = ?';
      params.push(role);
    }
    sql += ' ORDER BY u.created_at DESC';

    const users = await query<RowDataPacket[]>(sql, params);
    return NextResponse.json({ success: true, users });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve users' }, { status: 500 });
  }
}
