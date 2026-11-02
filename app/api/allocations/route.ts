import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createAllocation, listAllocations } from '@/services/allocation.service';
import { CreateAllocationSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const donorId = searchParams.get('donor_id') ? parseInt(searchParams.get('donor_id')!, 10) : undefined;
    const recipientId = searchParams.get('recipient_id') ? parseInt(searchParams.get('recipient_id')!, 10) : undefined;
    const status = searchParams.get('status') || undefined;

    const allocations = await listAllocations({ donor_id: donorId, recipient_id: recipientId, status });
    return NextResponse.json({ success: true, allocations });
  } catch (err: any) {
    console.error('GET /api/allocations error:', err);
    return NextResponse.json({ error: 'Failed to retrieve allocations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await req.json();
    const parsed = CreateAllocationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid allocation parameters' }, { status: 400 });
    }

    const result = await createAllocation(
      parsed.data.donation_id,
      parsed.data.request_id,
      parsed.data.allocated_quantity,
      user.user_id
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      allocation_id: result.allocation_id,
      message: result.message,
    }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/allocations error:', err);
    return NextResponse.json({ error: 'Internal transaction error during allocation' }, { status: 500 });
  }
}
