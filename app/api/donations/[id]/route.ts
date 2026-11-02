import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDonationById, updateDonation, cancelDonation } from '@/services/donation.service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const donation = await getDonationById(parseInt(id, 10));
    if (!donation) {
      return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, donation });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch donation' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;
    const donationId = parseInt(id, 10);
    const body = await req.json();

    const existing = await getDonationById(donationId);
    if (!existing) return NextResponse.json({ error: 'Donation not found' }, { status: 404 });

    if (user.role !== 'ADMIN' && user.profile_id !== existing.donor_id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this donation' }, { status: 403 });
    }

    const updated = await updateDonation(donationId, existing.donor_id, {
      description: body.description,
      expiry_time: body.expiry_time,
    });

    return NextResponse.json({ success: updated, message: 'Donation updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update donation' }, { status: 500 });
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
    const donationId = parseInt(id, 10);
    const existing = await getDonationById(donationId);
    if (!existing) return NextResponse.json({ error: 'Donation not found' }, { status: 404 });

    if (user.role !== 'ADMIN' && user.profile_id !== existing.donor_id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this donation' }, { status: 403 });
    }

    const cancelled = await cancelDonation(donationId, existing.donor_id);
    if (!cancelled) {
      return NextResponse.json({ error: 'Cannot cancel a donation that is already allocated or expired' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Donation cancelled successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to cancel donation' }, { status: 500 });
  }
}
