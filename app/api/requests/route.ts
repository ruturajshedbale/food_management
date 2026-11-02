import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createRequest, listRequests } from '@/services/request.service';
import { CreateRequestSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const recipientId = searchParams.get('recipient_id') ? parseInt(searchParams.get('recipient_id')!, 10) : undefined;
    const status = searchParams.get('status') || undefined;
    const pendingOnly = searchParams.get('pending') === 'true';

    const requests = await listRequests({ recipient_id: recipientId, status, pending_only: pendingOnly });
    return NextResponse.json({ success: true, requests });
  } catch (err: any) {
    console.error('GET /api/requests error:', err);
    return NextResponse.json({ error: 'Failed to retrieve food requests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (user.role !== 'RECIPIENT' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only recipients or administrators can create food requisitions' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = CreateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request parameters' }, { status: 400 });
    }

    const recipientId = user.role === 'ADMIN' && body.recipient_id ? Number(body.recipient_id) : user.profile_id!;
    if (!recipientId) {
      return NextResponse.json({ error: 'Recipient profile record missing' }, { status: 400 });
    }

    const requestId = await createRequest({
      recipient_id: recipientId,
      food_type: parsed.data.food_type,
      description: parsed.data.description,
      quantity_required: parsed.data.quantity_required,
      unit: parsed.data.unit,
      required_by: parsed.data.required_by,
      priority: parsed.data.priority,
    });

    return NextResponse.json({
      success: true,
      request_id: requestId,
      message: 'Food requisition created successfully.',
    }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/requests error:', err);
    return NextResponse.json({ error: 'Failed to create food request.' }, { status: 500 });
  }
}
