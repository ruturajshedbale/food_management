-- ============================================================================
-- SMART FOOD RESCUE & REDISTRIBUTION INTELLIGENCE SYSTEM
-- Script 06: Database Views (DDL)
-- ============================================================================

USE food_rescue_db;

-- 1. VIEW: available_donations_view
-- Lists all active, unexpired food donations with remaining quantities and donor information
CREATE OR REPLACE VIEW available_donations_view AS
SELECT 
    d.donation_id,
    d.donor_id,
    dn.organization_name AS donor_organization,
    dn.donor_type,
    dn.contact_person AS donor_contact,
    dn.address AS pickup_address,
    d.food_type,
    d.description,
    d.quantity AS total_quantity,
    d.remaining_quantity,
    d.unit,
    d.prepared_time,
    d.expiry_time,
    TIMESTAMPDIFF(HOUR, NOW(), d.expiry_time) AS hours_until_expiry,
    d.status,
    d.created_at
FROM food_donations d
JOIN donors dn ON d.donor_id = dn.donor_id
WHERE d.status IN ('AVAILABLE', 'PARTIALLY_ALLOCATED')
  AND d.remaining_quantity > 0
  AND d.expiry_time > NOW();

-- 2. VIEW: pending_requests_view
-- Lists all active, unfulfilled food requisitions with recipient details and triage priority
CREATE OR REPLACE VIEW pending_requests_view AS
SELECT 
    r.request_id,
    r.recipient_id,
    rc.organization_name AS recipient_organization,
    rc.contact_person AS recipient_contact,
    rc.address AS delivery_address,
    rc.capacity AS recipient_daily_capacity,
    r.food_type,
    r.description,
    r.quantity_required,
    r.quantity_fulfilled,
    (r.quantity_required - r.quantity_fulfilled) AS quantity_outstanding,
    r.unit,
    r.required_by,
    TIMESTAMPDIFF(HOUR, NOW(), r.required_by) AS hours_until_required,
    r.priority,
    r.status,
    r.created_at
FROM food_requests r
JOIN recipients rc ON r.recipient_id = rc.recipient_id
WHERE r.status IN ('PENDING', 'PARTIALLY_FULFILLED')
  AND r.quantity_required > r.quantity_fulfilled;

-- 3. VIEW: donation_summary_view
-- Aggregates inventory metrics per donor
CREATE OR REPLACE VIEW donation_summary_view AS
SELECT 
    dn.donor_id,
    dn.organization_name,
    dn.donor_type,
    COUNT(d.donation_id) AS total_lots_donated,
    COALESCE(SUM(d.quantity), 0) AS total_quantity_declared_kg,
    COALESCE(SUM(d.remaining_quantity), 0) AS current_available_kg,
    COALESCE(SUM(d.quantity - d.remaining_quantity), 0) AS total_quantity_allocated_kg,
    SUM(CASE WHEN d.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_lots,
    SUM(CASE WHEN d.status = 'EXPIRED' THEN 1 ELSE 0 END) AS expired_lots,
    MAX(d.created_at) AS latest_donation_date
FROM donors dn
LEFT JOIN food_donations d ON dn.donor_id = d.donor_id
GROUP BY dn.donor_id, dn.organization_name, dn.donor_type;

-- 4. VIEW: volunteer_performance_view
-- Metrics on pickup execution and delivery verification per volunteer
CREATE OR REPLACE VIEW volunteer_performance_view AS
SELECT 
    v.volunteer_id,
    u.user_id,
    u.name AS volunteer_name,
    u.phone AS contact_phone,
    v.vehicle_type,
    v.availability,
    COUNT(DISTINCT p.pickup_id) AS total_assigned_pickups,
    SUM(CASE WHEN p.pickup_status = 'PICKED_UP' THEN 1 ELSE 0 END) AS successful_pickups,
    COUNT(DISTINCT del.delivery_id) AS total_deliveries_routed,
    SUM(CASE WHEN del.delivery_status = 'DELIVERED' THEN 1 ELSE 0 END) AS verified_deliveries,
    COALESCE(SUM(CASE WHEN del.delivery_status = 'DELIVERED' THEN del.delivered_quantity ELSE 0 END), 0) AS total_kg_delivered,
    ROUND(AVG(f.rating), 2) AS average_recipient_rating
FROM volunteers v
JOIN users u ON v.user_id = u.user_id
LEFT JOIN pickups p ON v.volunteer_id = p.volunteer_id
LEFT JOIN deliveries del ON p.pickup_id = del.pickup_id
LEFT JOIN feedback f ON del.delivery_id = f.delivery_id
GROUP BY v.volunteer_id, u.user_id, u.name, u.phone, v.vehicle_type, v.availability;

-- 5. VIEW: redistribution_analytics_view
-- High-level operational dashboard KPIs across the entire ecosystem
CREATE OR REPLACE VIEW redistribution_analytics_view AS
SELECT 
    (SELECT COUNT(*) FROM donors) AS total_registered_donors,
    (SELECT COUNT(*) FROM recipients) AS total_registered_recipients,
    (SELECT COUNT(*) FROM volunteers WHERE availability = 'AVAILABLE') AS active_volunteers_available,
    (SELECT COUNT(*) FROM food_donations) AS total_donation_lots,
    (SELECT COALESCE(SUM(quantity), 0) FROM food_donations) AS total_food_declared_kg,
    (SELECT COALESCE(SUM(delivered_quantity), 0) FROM deliveries WHERE delivery_status = 'DELIVERED') AS total_food_delivered_kg,
    (SELECT COALESCE(SUM(remaining_quantity), 0) FROM food_donations WHERE status IN ('AVAILABLE', 'PARTIALLY_ALLOCATED')) AS active_available_surplus_kg,
    (SELECT COUNT(*) FROM food_requests WHERE status IN ('PENDING', 'PARTIALLY_FULFILLED')) AS active_pending_requests,
    (SELECT COUNT(*) FROM deliveries WHERE delivery_status = 'IN_TRANSIT') AS active_dispatches_in_transit,
    (SELECT ROUND(AVG(rating), 2) FROM feedback) AS platform_satisfaction_rating;
