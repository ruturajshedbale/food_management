/**
 * MongoDB Collections Initialization Script
 * Database: food_rescue_logs
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food_rescue_logs';
const DB_NAME = process.env.MONGODB_DB_NAME || 'food_rescue_logs';

async function initCollections() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log(`Connected to MongoDB at ${MONGODB_URI}`);
    const db = client.db(DB_NAME);

    const collections = [
      'donation_events',
      'pickup_events',
      'delivery_events',
      'food_condition_logs',
      'notification_logs',
      'matching_logs'
    ];

    const existing = await db.listCollections().toArray();
    const existingNames = new Set(existing.map(c => c.name));

    for (const name of collections) {
      if (!existingNames.has(name)) {
        await db.createCollection(name);
        console.log(`Created MongoDB collection: ${name}`);
      } else {
        console.log(`MongoDB collection already exists: ${name}`);
      }
    }
    console.log('MongoDB collections initialization complete.');
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  initCollections().catch(console.error);
}

module.exports = { initCollections };
