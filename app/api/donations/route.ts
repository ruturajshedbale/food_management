import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createDonation, listDonations } from '@/services/donation.service';
import { CreateDonationSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const donorId = searchParams.get('donor_id') ? parseInt(searchParams.get('donor_id')!, 10) : undefined;
    const status = searchParams.get('status') || undefined;
    const availableOnly = searchParams.get('available') === 'true';

    const donations = await listDonations({ donor_id: donorId, status, available_only: availableOnly });
    return NextResponse.json({ success: true, donations });
  } catch (err: any) {
    console.error('GET /api/donations error:', err);
    return NextResponse.json({ error: 'Failed to retrieve donations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (user.role !== 'DONOR' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only donors can create food donation declarations' }, { status: 403 });
    }
    if (!user.profile_id && user.role === 'DONOR') {
      return NextResponse.json({ error: 'Donor profile record missing' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = CreateDonationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid donation parameters' }, { status: 400 });
    }

    const donorId = user.role === 'ADMIN' && body.donor_id ? Number(body.donor_id) : user.profile_id!;

    // Validation: Expiry must be after prepared time
    if (new Date(parsed.data.expiry_time) <= new Date(parsed.data.prepared_time)) {
      return NextResponse.json({ error: 'Expiry time must be strictly after the preparation time.' }, { status: 400 });
    }

    const donationId = await createDonation({
      donor_id: donorId,
      food_type: parsed.data.food_type,
      description: parsed.data.description,
      quantity: parsed.data.quantity,
      unit: parsed.data.unit,
      prepared_time: parsed.data.prepared_time,
      expiry_time: parsed.data.expiry_time,
    });

    return NextResponse.json({
      success: true,
      donation_id: donationId,
      message: 'Surplus food donation published successfully and audit logged.',
    }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/donations error:', err);
    return NextResponse.json({ error: 'Failed to create food donation.' }, { status: 500 });
  }
}
