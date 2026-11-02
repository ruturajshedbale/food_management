/**
 * MongoDB Aggregation Pipelines
 * Demonstrates aggregation stages: $match, $group, $sort, $project, $lookup, $unwind
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food_rescue_logs';
const DB_NAME = process.env.MONGODB_DB_NAME || 'food_rescue_logs';

/**
 * Aggregation Pipeline 1: Event Frequency Distribution by Type
 */
async function getEventFrequency(db) {
  return await db.collection('donation_events').aggregate([
    {
      $group: {
        _id: '$event_type',
        count: { $sum: 1 },
        last_occurred: { $max: '$timestamp' },
        unique_donations: { $addToSet: '$donation_id' }
      }
    },
    {
      $project: {
        event_type: '$_id',
        count: 1,
        last_occurred: 1,
        distinct_donation_count: { $size: '$unique_donations' },
        _id: 0
      }
    },
    { $sort: { count: -1 } }
  ]).toArray();
}

/**
 * Aggregation Pipeline 2: Volunteer Dispatch Velocity & Milestones
 */
async function getVolunteerActivityReport(db, volunteerId = null) {
  const matchStage = volunteerId ? { volunteer_id: Number(volunteerId) } : {};
  return await db.collection('pickup_events').aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$volunteer_id',
        total_pickups: { $sum: 1 },
        earliest_dispatch: { $min: '$timestamp' },
        latest_dispatch: { $max: '$timestamp' },
        event_breakdown: { $push: { type: '$event_type', time: '$timestamp' } }
      }
    },
    { $sort: { total_pickups: -1 } }
  ]).toArray();
}

/**
 * Aggregation Pipeline 3: Donation Lifecycle Chronological Timeline
 */
async function getDonationTimeline(db, donationId) {
  return await db.collection('donation_events').aggregate([
    { $match: { donation_id: Number(donationId) } },
    { $sort: { timestamp: 1 } },
    {
      $project: {
        _id: 0,
        donation_id: 1,
        event_type: 1,
        actor_id: 1,
        timestamp: 1,
        metadata: 1
      }
    }
  ]).toArray();
}

module.exports = {
  getEventFrequency,
  getVolunteerActivityReport,
  getDonationTimeline
};
