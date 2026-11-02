-- ============================================================================
-- SMART FOOD RESCUE & REDISTRIBUTION INTELLIGENCE SYSTEM
-- Script 09: B-Tree Index Definitions & Query Plan Optimization
-- ============================================================================

USE food_rescue_db;

-- 1. Index on food_donations for fast available surplus lookups
-- Justification: Matching algorithm continuously filters by (status, expiry_time, food_type)
CREATE INDEX idx_donations_status_expiry 
ON food_donations (status, expiry_time);

CREATE INDEX idx_donations_donor 
ON food_donations (donor_id);

CREATE INDEX idx_donations_foodtype 
ON food_donations (food_type);

-- 2. Index on food_requests for triage and outstanding demand searches
-- Justification: Urgency sorting and pending request queries filter by (status, priority, required_by)
CREATE INDEX idx_requests_status_priority 
ON food_requests (status, priority, required_by);

CREATE INDEX idx_requests_recipient 
ON food_requests (recipient_id);

-- 3. Indexes on donation_allocations for relationship joins and integrity checks
CREATE INDEX idx_alloc_donation 
ON donation_allocations (donation_id, status);

CREATE INDEX idx_alloc_request 
ON donation_allocations (request_id, status);

-- 4. Indexes on pickups for volunteer scheduling
CREATE INDEX idx_pickups_volunteer_status 
ON pickups (volunteer_id, pickup_status);

CREATE INDEX idx_pickups_donation 
ON pickups (donation_id);

-- 5. Indexes on deliveries for fulfillment queries
CREATE INDEX idx_deliveries_allocation 
ON deliveries (allocation_id);

CREATE INDEX idx_deliveries_pickup 
ON deliveries (pickup_id);

CREATE INDEX idx_deliveries_status 
ON deliveries (delivery_status);

-- 6. Index on outbox_events for fast pending event polling
CREATE INDEX idx_outbox_status_created 
ON outbox_events (status, created_at);

-- ----------------------------------------------------------------------------
-- EXPLAIN / Query Plan Verification:
-- Demonstrates query optimization using the composite index idx_donations_status_expiry
-- ----------------------------------------------------------------------------
EXPLAIN 
SELECT donation_id, food_type, remaining_quantity, expiry_time
FROM food_donations
WHERE status = 'AVAILABLE' 
  AND expiry_time > NOW();
