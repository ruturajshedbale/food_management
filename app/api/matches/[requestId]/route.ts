import { NextRequest, NextResponse } from 'next/server';
import { getRecommendationsForRequest } from '@/services/matching.service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const reqId = parseInt(requestId, 10);
    if (isNaN(reqId) || reqId <= 0) {
      return NextResponse.json({ error: 'Invalid requestId parameter' }, { status: 400 });
    }

    const data = await getRecommendationsForRequest(reqId);
    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    console.error('GET /api/matches/[requestId] error:', err);
    return NextResponse.json({ error: err.message || 'Failed to compute intelligent matches' }, { status: 500 });
  }
}
