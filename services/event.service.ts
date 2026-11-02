import { getMongoDB } from '@/lib/mongodb';

export async function getDonationEvents(donationId?: number) {
  const db = await getMongoDB();
  const filter = donationId ? { 'payload.donation_id': Number(donationId) } : {};
  return await db.collection('donation_events')
    .find(filter)
    .sort({ timestamp: -1 })
    .limit(50)
    .toArray();
}

export async function getPickupEvents(pickupId?: number) {
  const db = await getMongoDB();
  const filter = pickupId ? { 'payload.pickup_id': Number(pickupId) } : {};
  return await db.collection('pickup_events')
    .find(filter)
    .sort({ timestamp: -1 })
    .limit(50)
    .toArray();
}

export async function getDeliveryEvents(deliveryId?: number) {
  const db = await getMongoDB();
  const filter = deliveryId ? { 'payload.delivery_id': Number(deliveryId) } : {};
  return await db.collection('delivery_events')
    .find(filter)
    .sort({ timestamp: -1 })
    .limit(50)
    .toArray();
}

export async function getFoodConditionLogs(donationId?: number) {
  const db = await getMongoDB();
  const filter = donationId ? { donation_id: Number(donationId) } : {};
  return await db.collection('food_condition_logs')
    .find(filter)
    .sort({ recorded_at: -1 })
    .limit(50)
    .toArray();
}

export async function recordFoodCondition(log: {
  donation_id: number;
  temperature_celsius: number;
  packaging_intact: boolean;
  hygiene_notes?: string;
  inspector_name: string;
}) {
  const db = await getMongoDB();
  const doc = {
    ...log,
    recorded_at: new Date(),
  };
  return await db.collection('food_condition_logs').insertOne(doc);
}

export async function getMongoAggregationStats() {
  const db = await getMongoDB();

  // 1. Event frequency by type
  const eventTypes = await db.collection('donation_events').aggregate([
    {
      $group: {
        _id: '$event_type',
        count: { $sum: 1 },
        last_event: { $max: '$timestamp' }
      }
    },
    { $sort: { count: -1 } }
  ]).toArray();

  // 2. Matching logs summary
  const matchingSummary = await db.collection('matching_logs').aggregate([
    {
      $group: {
        _id: null,
        total_evaluations: { $sum: 1 },
        avg_candidates: { $avg: '$candidate_count' },
        avg_top_score: { $avg: '$top_score' }
      }
    }
  ]).toArray();

  return {
    eventTypes,
    matchingStats: matchingSummary[0] || { total_evaluations: 0, avg_candidates: 0, avg_top_score: 0 }
  };
}
