import { NextRequest, NextResponse } from 'next/server';
import { getDonationEvents, getFoodConditionLogs, recordFoodCondition, getMongoAggregationStats } from '@/services/event.service';
import { processOutboxEvents } from '@/lib/outbox';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const donationId = searchParams.get('donation_id') ? parseInt(searchParams.get('donation_id')!, 10) : undefined;
    const type = searchParams.get('type');

    // Trigger an outbox sync tick
    await processOutboxEvents().catch(err => console.warn(err));

    if (type === 'stats') {
      const stats = await getMongoAggregationStats();
      return NextResponse.json({ success: true, ...stats });
    }

    if (type === 'conditions') {
      const logs = await getFoodConditionLogs(donationId);
      return NextResponse.json({ success: true, logs });
    }

    const events = await getDonationEvents(donationId);
    return NextResponse.json({ success: true, events });
  } catch (err: any) {
    console.error('GET /api/events error:', err);
    return NextResponse.json({ error: 'Failed to retrieve MongoDB event logs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { donation_id, temperature_celsius, packaging_intact, hygiene_notes, inspector_name } = body;

    if (!donation_id || temperature_celsius === undefined || packaging_intact === undefined) {
      return NextResponse.json({ error: 'Missing required condition log fields' }, { status: 400 });
    }

    await recordFoodCondition({
      donation_id: Number(donation_id),
      temperature_celsius: Number(temperature_celsius),
      packaging_intact: Boolean(packaging_intact),
      hygiene_notes,
      inspector_name: inspector_name || 'Field Inspector',
    });

    return NextResponse.json({ success: true, message: 'Food condition telemetry logged in MongoDB.' }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to log food condition in MongoDB' }, { status: 500 });
  }
}
