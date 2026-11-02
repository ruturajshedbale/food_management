/**
 * MongoDB Indexes Configuration Script
 * Creates indexes on event collections to optimize time-series queries and entity lookups.
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food_rescue_logs';
const DB_NAME = process.env.MONGODB_DB_NAME || 'food_rescue_logs';

async function createIndexes() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);

    // 1. donation_events indexes
    await db.collection('donation_events').createIndex({ donation_id: 1, timestamp: -1 });
    await db.collection('donation_events').createIndex({ event_type: 1 });
    await db.collection('donation_events').createIndex({ actor_id: 1 });

    // 2. pickup_events indexes
    await db.collection('pickup_events').createIndex({ pickup_id: 1, timestamp: -1 });
    await db.collection('pickup_events').createIndex({ volunteer_id: 1 });

    // 3. delivery_events indexes
    await db.collection('delivery_events').createIndex({ delivery_id: 1, timestamp: -1 });
    await db.collection('delivery_events').createIndex({ allocation_id: 1 });

    // 4. food_condition_logs indexes
    await db.collection('food_condition_logs').createIndex({ donation_id: 1, recorded_at: -1 });

    // 5. notification_logs indexes
    await db.collection('notification_logs').createIndex({ recipient_user_id: 1, created_at: -1 });

    // 6. matching_logs indexes
    await db.collection('matching_logs').createIndex({ request_id: 1, calculated_at: -1 });
    await db.collection('matching_logs').createIndex({ entity_type: 1, entity_id: 1 });

    console.log('Successfully created all MongoDB indexes.');
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  createIndexes().catch(console.error);
}

module.exports = { createIndexes };
