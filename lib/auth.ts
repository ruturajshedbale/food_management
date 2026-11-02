import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from './mysql';
import { RowDataPacket } from 'mysql2';

const SESSION_COOKIE_NAME = 'food_rescue_session';
const SECRET_KEY = process.env.SESSION_SECRET || 'smart_food_rescue_system_super_secret_jwt_key_2026';

export interface AuthUser {
  user_id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'DONOR' | 'RECIPIENT' | 'VOLUNTEER';
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  profile_id?: number;
  organization_name?: string;
  vehicle_type?: string;
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

function signPayload(data: object): string {
  const json = JSON.stringify(data);
  const b64 = Buffer.from(json).toString('base64url');
  const hmac = crypto.createHmac('sha256', SECRET_KEY).update(b64).digest('base64url');
  return `${b64}.${hmac}`;
}

function verifyPayload<T>(token: string): T | null {
  try {
    const [b64, signature] = token.split('.');
    if (!b64 || !signature) return null;
    const expected = crypto.createHmac('sha256', SECRET_KEY).update(b64).digest('base64url');
    if (signature !== expected) return null;
    const json = Buffer.from(b64, 'base64url').toString('utf8');
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export async function createSession(user: AuthUser): Promise<string> {
  const payload = {
    sub: user.user_id,
    role: user.role,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  };
  const token = signPayload(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return token;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!tokenCookie || !tokenCookie.value) {
      return null;
    }

    const payload = verifyPayload<{ sub: number; exp: number }>(tokenCookie.value);
    if (!payload || !payload.sub || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    interface UserRow extends RowDataPacket {
      user_id: number;
      name: string;
      email: string;
      role: 'ADMIN' | 'DONOR' | 'RECIPIENT' | 'VOLUNTEER';
      status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
      donor_id?: number;
      recipient_id?: number;
      volunteer_id?: number;
      organization_name?: string;
      vehicle_type?: string;
    }

    const users = await query<UserRow[]>(
      `SELECT 
          u.user_id, u.name, u.email, u.role, u.status,
          dn.donor_id, dn.organization_name AS donor_org,
          rc.recipient_id, rc.organization_name AS recipient_org,
          v.volunteer_id, v.vehicle_type
       FROM users u
       LEFT JOIN donors dn ON u.user_id = dn.user_id
       LEFT JOIN recipients rc ON u.user_id = rc.user_id
       LEFT JOIN volunteers v ON u.user_id = v.user_id
       WHERE u.user_id = ? AND u.status = 'ACTIVE'`,
      [payload.sub]
    );

    if (!users || users.length === 0) {
      return null;
    }

    const u = users[0];
    const profile_id = u.donor_id || u.recipient_id || u.volunteer_id;
    const organization_name = u.donor_org || u.recipient_org;

    return {
      user_id: u.user_id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      profile_id,
      organization_name,
      vehicle_type: u.vehicle_type,
    };
  } catch (err) {
    console.error('getCurrentUser error:', err);
    return null;
  }
}
