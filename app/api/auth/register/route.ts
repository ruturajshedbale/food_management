import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/mysql';
import { RegisterSchema } from '@/lib/validation';
import { hashPassword, createSession, AuthUser } from '@/lib/auth';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input data' }, { status: 400 });
    }

    const {
      name, email, password, phone, role,
      organization_name, contact_person, address,
      donor_type, capacity, vehicle_type
    } = parsed.data;

    // Check duplicate email
    const existing = await query<RowDataPacket[]>(
      'SELECT user_id FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: 'An account with this email address already exists.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    // Insert user and corresponding role profile within an ACID transaction
    const authUser = await withTransaction(async (conn) => {
      const [userRes] = await conn.execute<ResultSetHeader>(
        `INSERT INTO users (name, email, password_hash, phone, role, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'ACTIVE', NOW())`,
        [name, email.toLowerCase().trim(), passwordHash, phone || null, role]
      );
      const userId = userRes.insertId;
      let profileId: number | undefined;

      if (role === 'DONOR') {
        const [donorRes] = await conn.execute<ResultSetHeader>(
          `INSERT INTO donors (user_id, organization_name, contact_person, address, donor_type)
           VALUES (?, ?, ?, ?, ?)`,
          [
            userId,
            organization_name || name,
            contact_person || name,
            address || 'Registered Address',
            donor_type || 'RESTAURANT',
          ]
        );
        profileId = donorRes.insertId;
      } else if (role === 'RECIPIENT') {
        const [recipRes] = await conn.execute<ResultSetHeader>(
          `INSERT INTO recipients (user_id, organization_name, contact_person, address, capacity)
           VALUES (?, ?, ?, ?, ?)`,
          [
            userId,
            organization_name || name,
            contact_person || name,
            address || 'Delivery Address',
            capacity || 100,
          ]
        );
        profileId = recipRes.insertId;
      } else if (role === 'VOLUNTEER') {
        const [volRes] = await conn.execute<ResultSetHeader>(
          `INSERT INTO volunteers (user_id, vehicle_type, availability)
           VALUES (?, ?, 'AVAILABLE')`,
          [userId, vehicle_type || 'CAR']
        );
        profileId = volRes.insertId;
      }

      return {
        user_id: userId,
        name,
        email: email.toLowerCase().trim(),
        role,
        status: 'ACTIVE' as const,
        profile_id: profileId,
        organization_name: organization_name || name,
        vehicle_type,
      };
    });

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
      },
    }, { status: 201 });
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Failed to complete registration.' }, { status: 500 });
  }
}
