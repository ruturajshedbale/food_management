-- ============================================================================
-- SMART FOOD RESCUE & REDISTRIBUTION INTELLIGENCE SYSTEM
-- Script 05: 20 Advanced Analytical SQL Queries Demonstrating DBMS Concepts
-- ============================================================================

USE food_rescue_db;

-- ----------------------------------------------------------------------------
-- QUERY 1: Active Donations with Remaining Shelf Life Window
-- Concepts: WHERE, Date Arithmetic (TIMESTAMPDIFF), ORDER BY
-- ----------------------------------------------------------------------------
SELECT 
    d.donation_id,
    dn.organization_name AS donor_name,
    d.food_type,
    d.remaining_quantity,
    d.unit,
    d.expiry_time,
    TIMESTAMPDIFF(HOUR, NOW(), d.expiry_time) AS hours_until_expiry,
    d.status
FROM food_donations d
JOIN donors dn ON d.donor_id = dn.donor_id
WHERE d.status IN ('AVAILABLE', 'PARTIALLY_ALLOCATED')
  AND d.expiry_time > NOW()
ORDER BY hours_until_expiry ASC;

-- ----------------------------------------------------------------------------
-- QUERY 2: Total Quantity Rescued and Donated per Donor Organization
-- Concepts: INNER JOIN, GROUP BY, Aggregate Functions (SUM, COUNT), ORDER BY
-- ----------------------------------------------------------------------------
SELECT 
    dn.donor_id,
    dn.organization_name,
    dn.donor_type,
    COUNT(d.donation_id) AS total_donation_lots,
    SUM(d.quantity) AS total_quantity_declared,
    SUM(d.quantity - d.remaining_quantity) AS total_quantity_allocated,
    SUM(d.remaining_quantity) AS current_unallocated_stock
FROM donors dn
LEFT JOIN food_donations d ON dn.donor_id = d.donor_id
GROUP BY dn.donor_id, dn.organization_name, dn.donor_type
ORDER BY total_quantity_declared DESC;

-- ----------------------------------------------------------------------------
-- QUERY 3: High Priority Outstanding Requests Requiring Immediate Matching
-- Concepts: WHERE, Multiple Status Checks, Date Function, ORDER BY
-- ----------------------------------------------------------------------------
SELECT 
    r.request_id,
    rc.organization_name AS recipient_name,
    r.food_type,
    r.quantity_required,
    (r.quantity_required - r.quantity_fulfilled) AS unmet_quantity,
    r.priority,
    r.required_by,
    TIMESTAMPDIFF(HOUR, NOW(), r.required_by) AS hours_remaining
FROM food_requests r
JOIN recipients rc ON r.recipient_id = rc.recipient_id
WHERE r.status IN ('PENDING', 'PARTIALLY_FULFILLED')
  AND r.priority IN ('HIGH', 'URGENT')
ORDER BY 
    CASE r.priority 
        WHEN 'URGENT' THEN 1 
        WHEN 'HIGH' THEN 2 
        ELSE 3 
    END,
    r.required_by ASC;

-- ----------------------------------------------------------------------------
-- QUERY 4: Donors With Average Donation Size Exceeding 30kg
-- Concepts: GROUP BY, HAVING, AVG(), COUNT()
-- ----------------------------------------------------------------------------
SELECT 
    dn.organization_name,
    dn.donor_type,
    COUNT(d.donation_id) AS donation_count,
    ROUND(AVG(d.quantity), 2) AS avg_lot_size_kg,
    SUM(d.quantity) AS total_donated_kg
FROM donors dn
JOIN food_donations d ON dn.donor_id = d.donor_id
GROUP BY dn.donor_id, dn.organization_name, dn.donor_type
HAVING AVG(d.quantity) >= 30.00
ORDER BY avg_lot_size_kg DESC;

-- ----------------------------------------------------------------------------
-- QUERY 5: Recipient Requisition Fulfillment Rate Analysis
-- Concepts: LEFT JOIN, Aggregate Expressions, Percentage Calculation
-- ----------------------------------------------------------------------------
SELECT 
    rc.recipient_id,
    rc.organization_name,
    rc.capacity AS daily_capacity,
    COUNT(r.request_id) AS total_requests_logged,
    COALESCE(SUM(r.quantity_required), 0) AS total_kg_requested,
    COALESCE(SUM(r.quantity_fulfilled), 0) AS total_kg_received,
    ROUND(
        COALESCE(SUM(r.quantity_fulfilled), 0) / NULLIF(SUM(r.quantity_required), 0) * 100, 
        1
    ) AS fulfillment_percentage
FROM recipients rc
LEFT JOIN food_requests r ON rc.recipient_id = r.recipient_id
GROUP BY rc.recipient_id, rc.organization_name, rc.capacity
ORDER BY fulfillment_percentage DESC;

-- ----------------------------------------------------------------------------
-- QUERY 6: Full Multi-Hop Logistics Audit Trail (Donation -> Allocation -> Pickup -> Delivery)
-- Concepts: Multiple INNER JOINs across 6 tables, COALESCE, Timestamping
-- ----------------------------------------------------------------------------
SELECT 
    a.allocation_id,
    dn.organization_name AS donor_source,
    rc.organization_name AS recipient_destination,
    d.food_type,
    a.allocated_quantity,
    v.user_id AS volunteer_user_id,
    u.name AS volunteer_name,
    p.pickup_status,
    del.delivery_status,
    del.delivered_quantity,
    f.rating AS recipient_rating
FROM donation_allocations a
JOIN food_donations d ON a.donation_id = d.donation_id
JOIN donors dn ON d.donor_id = dn.donor_id
JOIN food_requests r ON a.request_id = r.request_id
JOIN recipients rc ON r.recipient_id = rc.recipient_id
LEFT JOIN deliveries del ON a.allocation_id = del.allocation_id
LEFT JOIN pickups p ON del.pickup_id = p.pickup_id
LEFT JOIN volunteers v ON p.volunteer_id = v.volunteer_id
LEFT JOIN users u ON v.user_id = u.user_id
LEFT JOIN feedback f ON del.delivery_id = f.delivery_id
ORDER BY a.allocation_time DESC;

-- ----------------------------------------------------------------------------
-- QUERY 7: Find Donations That Have Never Received Any Allocation (Unallocated Surplus)
-- Concepts: Subquery with NOT EXISTS (Anti-semi join)
-- ----------------------------------------------------------------------------
SELECT 
    d.donation_id,
    dn.organization_name,
    d.food_type,
    d.description,
    d.quantity,
    d.expiry_time
FROM food_donations d
JOIN donors dn ON d.donor_id = dn.donor_id
WHERE NOT EXISTS (
    SELECT 1 
    FROM donation_allocations a 
    WHERE a.donation_id = d.donation_id
);

-- ----------------------------------------------------------------------------
-- QUERY 8: Recipients Who Currently Have Outstanding Unmet Requests
-- Concepts: Subquery with EXISTS (Semi-join)
-- ----------------------------------------------------------------------------
SELECT 
    rc.recipient_id,
    rc.organization_name,
    rc.contact_person,
    rc.address
FROM recipients rc
WHERE EXISTS (
    SELECT 1 
    FROM food_requests r 
    WHERE r.recipient_id = rc.recipient_id 
      AND r.status IN ('PENDING', 'PARTIALLY_FULFILLED')
);

-- ----------------------------------------------------------------------------
-- QUERY 9: Donations Expiring Within Next 24 Hours with Unallocated Balances
-- Concepts: WHERE with INTERVAL, Subquery scalar comparison
-- ----------------------------------------------------------------------------
SELECT 
    d.donation_id,
    d.food_type,
    d.remaining_quantity,
    d.expiry_time,
    dn.organization_name,
    dn.address
FROM food_donations d
JOIN donors dn ON d.donor_id = dn.donor_id
WHERE d.remaining_quantity > 0
  AND d.expiry_time BETWEEN NOW() AND NOW() + INTERVAL 24 HOUR
ORDER BY d.expiry_time ASC;

-- ----------------------------------------------------------------------------
-- QUERY 10: Volunteer Dispatch Performance Scorecard
-- Concepts: Multiple JOINs, CASE expressions, Aggregate conditional sums
-- ----------------------------------------------------------------------------
SELECT 
    v.volunteer_id,
    u.name AS volunteer_name,
    v.vehicle_type,
    v.availability,
    COUNT(p.pickup_id) AS total_pickups_assigned,
    SUM(CASE WHEN p.pickup_status = 'PICKED_UP' THEN 1 ELSE 0 END) AS completed_pickups,
    SUM(CASE WHEN del.delivery_status = 'DELIVERED' THEN 1 ELSE 0 END) AS verified_deliveries,
    COALESCE(SUM(del.delivered_quantity), 0) AS total_kg_delivered,
    ROUND(AVG(f.rating), 2) AS avg_recipient_rating
FROM volunteers v
JOIN users u ON v.user_id = u.user_id
LEFT JOIN pickups p ON v.volunteer_id = p.volunteer_id
LEFT JOIN deliveries del ON p.pickup_id = del.pickup_id
LEFT JOIN feedback f ON del.delivery_id = f.delivery_id
GROUP BY v.volunteer_id, u.name, v.vehicle_type, v.availability
ORDER BY verified_deliveries DESC, avg_recipient_rating DESC;

-- ----------------------------------------------------------------------------
-- QUERY 11: Food Category Redistribution Breakdown
-- Concepts: GROUP BY food_type, percentage of total volume
-- ----------------------------------------------------------------------------
SELECT 
    d.food_type,
    COUNT(d.donation_id) AS donation_count,
    SUM(d.quantity) AS total_quantity_kg,
    ROUND(
        SUM(d.quantity) / (SELECT SUM(quantity) FROM food_donations) * 100, 
        2
    ) AS pct_of_total_donated_volume
FROM food_donations d
GROUP BY d.food_type
ORDER BY total_quantity_kg DESC;

-- ----------------------------------------------------------------------------
-- QUERY 12: Window Function - Cumulative Volume Donated per Donor Over Time
-- Concepts: Window Function SUM(...) OVER (PARTITION BY ... ORDER BY ...)
-- ----------------------------------------------------------------------------
SELECT 
    d.donation_id,
    dn.organization_name,
    d.food_type,
    d.quantity,
    d.created_at,
    SUM(d.quantity) OVER (
        PARTITION BY d.donor_id 
        ORDER BY d.created_at 
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_cumulative_kg
FROM food_donations d
JOIN donors dn ON d.donor_id = dn.donor_id
ORDER BY dn.organization_name, d.created_at ASC;

-- ----------------------------------------------------------------------------
-- QUERY 13: Window Function - Ranking Donors by Total Rescued Volume (DENSE_RANK)
-- Concepts: Subquery with DENSE_RANK() OVER (ORDER BY ...)
-- ----------------------------------------------------------------------------
SELECT 
    donor_id,
    organization_name,
    total_volume_kg,
    DENSE_RANK() OVER (ORDER BY total_volume_kg DESC) AS volume_rank
FROM (
    SELECT 
        dn.donor_id,
        dn.organization_name,
        COALESCE(SUM(d.quantity), 0) AS total_volume_kg
    FROM donors dn
    LEFT JOIN food_donations d ON dn.donor_id = d.donor_id
    GROUP BY dn.donor_id, dn.organization_name
) ranked_donors;

-- ----------------------------------------------------------------------------
-- QUERY 14: Window Function - Most Recent Donation per Donor (ROW_NUMBER)
-- Concepts: ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ... DESC)
-- ----------------------------------------------------------------------------
WITH RankedDonations AS (
    SELECT 
        d.donation_id,
        d.donor_id,
        dn.organization_name,
        d.food_type,
        d.quantity,
        d.created_at,
        ROW_NUMBER() OVER (PARTITION BY d.donor_id ORDER BY d.created_at DESC) AS seq
    FROM food_donations d
    JOIN donors dn ON d.donor_id = dn.donor_id
)
SELECT 
    donation_id,
    donor_id,
    organization_name,
    food_type,
    quantity,
    created_at AS latest_donation_time
FROM RankedDonations
WHERE seq = 1;

-- ----------------------------------------------------------------------------
-- QUERY 15: Monthly Redistribution Trend (Monthly Rescued Food Volume)
-- Concepts: DATE_FORMAT, SUM, GROUP BY month
-- ----------------------------------------------------------------------------
SELECT 
    DATE_FORMAT(del.delivery_time, '%Y-%m') AS delivery_month,
    COUNT(del.delivery_id) AS completed_deliveries,
    SUM(del.delivered_quantity) AS total_kg_delivered,
    COUNT(DISTINCT del.allocation_id) AS distinct_allocations
FROM deliveries del
WHERE del.delivery_status = 'DELIVERED'
GROUP BY DATE_FORMAT(del.delivery_time, '%Y-%m')
ORDER BY delivery_month DESC;

-- ----------------------------------------------------------------------------
-- QUERY 16: Audit Trail Discrepancy & State Transition History
-- Concepts: Correlated audit analysis, ORDER BY changed_at
-- ----------------------------------------------------------------------------
SELECT 
    a.audit_id,
    a.donation_id,
    d.food_type,
    a.changed_by,
    a.old_quantity,
    a.new_quantity,
    (a.old_quantity - a.new_quantity) AS quantity_decremented,
    a.old_status,
    a.new_status,
    a.action_type,
    a.changed_at
FROM donation_audit a
JOIN food_donations d ON a.donation_id = d.donation_id
ORDER BY a.changed_at DESC;

-- ----------------------------------------------------------------------------
-- QUERY 17: Pending Outbox Events Ready for MongoDB Dispatch
-- Concepts: WHERE status = 'PENDING', LIMIT, Lock potential
-- ----------------------------------------------------------------------------
SELECT 
    event_id,
    aggregate_type,
    aggregate_id,
    event_type,
    payload,
    created_at
FROM outbox_events
WHERE status = 'PENDING'
ORDER BY event_id ASC
LIMIT 50;

-- ----------------------------------------------------------------------------
-- QUERY 18: Recipient Feedback & Quality Satisfaction Distribution
-- Concepts: GROUP BY rating, COUNT, Percentage of total feedback
-- ----------------------------------------------------------------------------
SELECT 
    f.rating,
    COUNT(f.feedback_id) AS count_reviews,
    ROUND(COUNT(f.feedback_id) / (SELECT COUNT(*) FROM feedback) * 100, 1) AS pct_of_reviews
FROM feedback f
GROUP BY f.rating
ORDER BY f.rating DESC;

-- ----------------------------------------------------------------------------
-- QUERY 19: Unassigned Pickups with Volunteer Capacity Matching
-- Concepts: LEFT JOIN, volunteer availability matching
-- ----------------------------------------------------------------------------
SELECT 
    p.pickup_id,
    p.donation_id,
    d.food_type,
    d.quantity,
    d.unit,
    dn.organization_name AS donor_name,
    dn.address AS pickup_address,
    p.scheduled_time,
    p.pickup_status
FROM pickups p
JOIN food_donations d ON p.donation_id = d.donation_id
JOIN donors dn ON d.donor_id = dn.donor_id
WHERE p.pickup_status IN ('ASSIGNED', 'ACCEPTED')
ORDER BY p.scheduled_time ASC;

-- ----------------------------------------------------------------------------
-- QUERY 20: System Operational Efficiency & Waste Reduction Metric
-- Concepts: Aggregate ratios, COALESCE, Subquery KPIs
-- ----------------------------------------------------------------------------
SELECT 
    (SELECT COUNT(*) FROM food_donations) AS total_donations_count,
    (SELECT COALESCE(SUM(quantity), 0) FROM food_donations) AS total_declared_kg,
    (SELECT COALESCE(SUM(delivered_quantity), 0) FROM deliveries WHERE delivery_status = 'DELIVERED') AS total_delivered_kg,
    (SELECT COUNT(*) FROM food_donations WHERE status = 'EXPIRED') AS expired_donations_count,
    ROUND(
        (SELECT COALESCE(SUM(delivered_quantity), 0) FROM deliveries WHERE delivery_status = 'DELIVERED') /
        NULLIF((SELECT COALESCE(SUM(quantity), 0) FROM food_donations), 0) * 100,
        2
    ) AS system_redistribution_efficiency_pct;
