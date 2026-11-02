import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;
let isStartingServer = false;

const DEFAULT_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food_rescue_logs';
const DB_NAME = process.env.MONGODB_DB_NAME || 'food_rescue_logs';

async function ensureMongoServerRunning() {
  if (globalThis._mongoServerStarted) return;
  if (isStartingServer) {
    while (isStartingServer) {
      await new Promise(r => setTimeout(r, 100));
    }
    return;
  }

  isStartingServer = true;
  try {
    // Try to connect to existing daemon first
    const testClient = new MongoClient(DEFAULT_URI, { serverSelectionTimeoutMS: 1000 });
    try {
      await testClient.connect();
      await testClient.db(DB_NAME).command({ ping: 1 });
      await testClient.close();
      globalThis._mongoServerStarted = true;
      return;
    } catch {
      // Local daemon not active, spawn in-memory daemon on 27017
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({
        instance: {
          port: 27017,
          dbName: DB_NAME,
        },
      });
      globalThis._mongoMemoryServerInstance = mongod;
      globalThis._mongoServerStarted = true;
      console.log('Started local MongoDB daemon on port 27017');
    }
  } catch (err) {
    console.warn('MongoDB daemon check/start warning:', err);
  } finally {
    isStartingServer = false;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoServerStarted: boolean | undefined;
  // eslint-disable-next-line no-var
  var _mongoMemoryServerInstance: any;
}

export async function getMongoDB(): Promise<Db> {
  if (db && client) {
    return db;
  }

  await ensureMongoServerRunning();

  if (!client) {
    client = new MongoClient(DEFAULT_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    await client.connect();
    db = client.db(DB_NAME);

    // Ensure collections exist
    const collections = await db.listCollections().toArray();
    const names = new Set(collections.map(c => c.name));
    const required = [
      'donation_events',
      'pickup_events',
      'delivery_events',
      'food_condition_logs',
      'notification_logs',
      'matching_logs'
    ];

    for (const coll of required) {
      if (!names.has(coll)) {
        await db.createCollection(coll);
      }
    }
  }

  return db!;
}

export async function closeMongoDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
