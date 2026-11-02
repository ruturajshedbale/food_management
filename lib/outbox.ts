import { query } from './mysql';
import { getMongoDB } from './mongodb';
import { RowDataPacket } from 'mysql2';

interface OutboxRow extends RowDataPacket {
  event_id: number;
  aggregate_type: string;
  aggregate_id: number;
  event_type: string;
  payload: any;
  status: string;
  created_at: string;
}

/**
 * Idempotently processes pending outbox events from MySQL into MongoDB.
 */
export async function processOutboxEvents(): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;

  try {
    const rows = await query<OutboxRow[]>(
      `SELECT event_id, aggregate_type, aggregate_id, event_type, payload, status, created_at 
       FROM outbox_events 
       WHERE status = 'PENDING' 
       ORDER BY event_id ASC 
       LIMIT 50`
    );

    if (!rows || rows.length === 0) {
      return { processed: 0, errors: 0 };
    }

    const mongoDb = await getMongoDB();

    for (const row of rows) {
      try {
        const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
        const eventDoc = {
          outbox_event_id: row.event_id,
          aggregate_type: row.aggregate_type,
          aggregate_id: row.aggregate_id,
          event_type: row.event_type,
          payload,
          timestamp: new Date(row.created_at || Date.now()),
          synced_at: new Date(),
        };

        // Route to the appropriate MongoDB collection
        switch (row.aggregate_type) {
          case 'DONATION':
            await mongoDb.collection('donation_events').updateOne(
              { outbox_event_id: row.event_id },
              { $set: eventDoc },
              { upsert: true }
            );
            break;
          case 'PICKUP':
            await mongoDb.collection('pickup_events').updateOne(
              { outbox_event_id: row.event_id },
              { $set: eventDoc },
              { upsert: true }
            );
            break;
          case 'DELIVERY':
            await mongoDb.collection('delivery_events').updateOne(
              { outbox_event_id: row.event_id },
              { $set: eventDoc },
              { upsert: true }
            );
            break;
          default:
            await mongoDb.collection('donation_events').updateOne(
              { outbox_event_id: row.event_id },
              { $set: eventDoc },
              { upsert: true }
            );
            break;
        }

        // Mark as PUBLISHED in MySQL
        await query(
          `UPDATE outbox_events 
           SET status = 'PUBLISHED', processed_at = NOW() 
           WHERE event_id = ?`,
          [row.event_id]
        );
        processed++;
      } catch (itemErr) {
        console.error(`Failed to process outbox event ${row.event_id}:`, itemErr);
        await query(
          `UPDATE outbox_events 
           SET status = 'FAILED' 
           WHERE event_id = ?`,
          [row.event_id]
        );
        errors++;
      }
    }
  } catch (err) {
    console.error('Outbox dispatcher batch error:', err);
  }

  return { processed, errors };
}
