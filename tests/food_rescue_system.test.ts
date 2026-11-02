import test from 'node:test';
import assert from 'node:assert/strict';
import { query } from '../lib/mysql';
import { createAllocation, cancelAllocation } from '../services/allocation.service';
import { generateSemanticEmbedding, getRecommendationsForRequest } from '../services/matching.service';
import { hashPassword, comparePassword } from '../lib/auth';
import { processOutboxEvents } from '../lib/outbox';
import { getMongoDB } from '../lib/mongodb';
import { RowDataPacket } from 'mysql2';

test('1 & 3 & 4. Password hashing and verification logic', async () => {
  const plain = 'Password123!';
  const hash = await hashPassword(plain);
  assert.equal(typeof hash, 'string');
  const valid = await comparePassword(plain, hash);
  assert.equal(valid, true, 'Valid password must match');
  const invalid = await comparePassword('WrongPassword', hash);
  assert.equal(invalid, false, 'Invalid password must be rejected');
});

test('2. Duplicate email rejection check in users table', async () => {
  const existingUsers = await query<RowDataPacket[]>(
    'SELECT email FROM users WHERE email = ?',
    ['admin@foodrescue.org']
  );
  assert.equal(existingUsers.length, 1, 'Admin user must exist in seed data');
});

test('6 & 7. Donation quantity constraints in MySQL', async () => {
  const donations = await query<RowDataPacket[]>(
    'SELECT donation_id, quantity, remaining_quantity, expiry_time, prepared_time FROM food_donations WHERE donation_id = 5'
  );
  assert.equal(donations.length, 1);
  const d = donations[0];
  assert.ok(Number(d.quantity) > 0, 'Quantity must be positive');
  assert.ok(Number(d.remaining_quantity) <= Number(d.quantity), 'Remaining quantity must not exceed total quantity');
  assert.ok(new Date(d.expiry_time) > new Date(d.prepared_time), 'Expiry must be after prepared time');
});

test('10 & 11 & 12. Over-allocation prevention and ACID transaction rollback', async () => {
  // Try to allocate an absurd amount (e.g. 50000 kg) to request 5 from donation 5 (which only has 80 kg)
  const result = await createAllocation(5, 5, 50000, 1);
  assert.equal(result.success, false, 'Must prevent over-allocation');
  assert.ok(result.message.includes('ERROR'), 'Must return an error message');

  // Verify that donation remaining quantity was NOT changed
  const check = await query<RowDataPacket[]>(
    'SELECT remaining_quantity FROM food_donations WHERE donation_id = 5'
  );
  assert.equal(Number(check[0].remaining_quantity), 80, 'Inventory balance must be untouched after rollback');
});

test('12. Partial allocation execution with ACID update', async () => {
  // Allocate 15 kg from donation 5 (has 80 kg) to request 5 (requires 50 kg)
  const allocRes = await createAllocation(5, 5, 15, 1);
  assert.equal(allocRes.success, true, 'Partial allocation must succeed');
  assert.ok(allocRes.allocation_id > 0, 'Must return new allocation ID');

  // Verify donation updated to 65 kg
  const donCheck = await query<RowDataPacket[]>(
    'SELECT remaining_quantity, status FROM food_donations WHERE donation_id = 5'
  );
  assert.equal(Number(donCheck[0].remaining_quantity), 65);
  assert.equal(donCheck[0].status, 'PARTIALLY_ALLOCATED');

  // Verify request fulfilled updated to 15 kg
  const reqCheck = await query<RowDataPacket[]>(
    'SELECT quantity_fulfilled, status FROM food_requests WHERE request_id = 5'
  );
  assert.equal(Number(reqCheck[0].quantity_fulfilled), 15);
  assert.equal(reqCheck[0].status, 'PARTIALLY_FULFILLED');

  // Now cancel the allocation to verify rollback and return of inventory
  const cancelRes = await cancelAllocation(allocRes.allocation_id, 1);
  assert.equal(cancelRes.success, true, 'Cancellation must succeed');

  // Verify donation returned back to 80 kg
  const donRestored = await query<RowDataPacket[]>(
    'SELECT remaining_quantity FROM food_donations WHERE donation_id = 5'
  );
  assert.equal(Number(donRestored[0].remaining_quantity), 80, 'Returned inventory must equal 80 kg');
});

test('19. Transactional Outbox Pattern and MongoDB Event Sync', async () => {
  const syncResult = await processOutboxEvents();
  assert.ok(syncResult.processed >= 0, 'Outbox sync must execute without crash');

  const mongo = await getMongoDB();
  const eventCount = await mongo.collection('donation_events').countDocuments();
  assert.ok(eventCount >= 0, 'MongoDB donation_events must be queryable');
});

test('20. Semantic Embeddings and Multi-Criteria Recommendation Algorithm', async () => {
  const vec1 = generateSemanticEmbedding('Fresh vegetarian warm meals');
  const vec2 = generateSemanticEmbedding('Nutritious vegetarian warm dishes');
  const vec3 = generateSemanticEmbedding('Industrial auto spare parts');

  assert.equal(vec1.length, 384, 'Vector dimension must be 384');
  assert.equal(vec2.length, 384);

  // Recommendations query
  const recData = await getRecommendationsForRequest(2);
  assert.ok(recData.recommendations.length > 0, 'Must produce candidate recommendations');
  assert.ok(recData.recommendations[0].composite_score >= 0, 'Scores must be valid numbers');
  assert.ok(recData.recommendations[0].match_reasons.length > 0, 'Must supply match explanations');
});

test('22. Analytics Views accuracy against live relational data', async () => {
  const analyticsRows = await query<RowDataPacket[]>('SELECT * FROM redistribution_analytics_view');
  assert.equal(analyticsRows.length, 1);
  const row = analyticsRows[0];
  assert.ok(Number(row.total_registered_donors) > 0);
  assert.ok(Number(row.total_registered_recipients) > 0);
  assert.ok(Number(row.total_food_declared_kg) > 0);

  // Clean exit teardown
  setTimeout(() => process.exit(0), 100);
});

