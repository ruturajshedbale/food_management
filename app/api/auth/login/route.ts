import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { LoginSchema } from '@/lib/validation';
import { comparePassword, createSession, AuthUser } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }

    interface UserAuthRow extends RowDataPacket {
      user_id: number;
      name: string;
      email: string;
      password_hash: string;
      role: 'ADMIN' | 'DONOR' | 'RECIPIENT' | 'VOLUNTEER';
      status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
      donor_id?: number;
      recipient_id?: number;
      volunteer_id?: number;
      organization_name?: string;
      vehicle_type?: string;
    }

    const rows = await query<UserAuthRow[]>(
      `SELECT 
          u.user_id, u.name, u.email, u.password_hash, u.role, u.status,
          dn.donor_id, dn.organization_name AS donor_org,
          rc.recipient_id, rc.organization_name AS recipient_org,
          v.volunteer_id, v.vehicle_type
       FROM users u
       LEFT JOIN donors dn ON u.user_id = dn.user_id
       LEFT JOIN recipients rc ON u.user_id = rc.user_id
       LEFT JOIN volunteers v ON u.user_id = v.user_id
       WHERE u.email = ?`,
      [parsed.data.email.toLowerCase().trim()]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const user = rows[0];
    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: `Account is ${user.status}. Please contact administrator.` }, { status: 403 });
    }

    const match = await comparePassword(parsed.data.password, user.password_hash);
    if (!match) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const authUser: AuthUser = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      profile_id: user.donor_id || user.recipient_id || user.volunteer_id,
      organization_name: user.donor_org || user.recipient_org,
      vehicle_type: user.vehicle_type,
    };

    await createSession(authUser);

    return NextResponse.json({
      success: true,
      user: {
        user_id: authUser.user_id,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
        profile_id: authUser.profile_id,
        organization_name: authUser.organization_name,
        vehicle_type: authUser.vehicle_type,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'An unexpected internal error occurred.' }, { status: 500 });
  }
}
