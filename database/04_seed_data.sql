-- ============================================================================
-- SMART FOOD RESCUE & REDISTRIBUTION INTELLIGENCE SYSTEM
-- Script 04: Realistic Seed Data for Development & Demonstration
-- Passwords for all accounts: 'Password123!'
-- Hash: $2b$10$s3rIRH.xIjCp2UsOFxA3C.Bic3LfGR9BF9hzvNOoY0g2p8qDubIIG
-- ============================================================================

USE food_rescue_db;

-- Clear previous test data safely
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE feedback;
TRUNCATE TABLE deliveries;
TRUNCATE TABLE pickups;
TRUNCATE TABLE donation_allocations;
TRUNCATE TABLE food_requests;
TRUNCATE TABLE food_donations;
TRUNCATE TABLE volunteers;
TRUNCATE TABLE recipients;
TRUNCATE TABLE donors;
TRUNCATE TABLE users;
TRUNCATE TABLE donation_audit;
TRUNCATE TABLE outbox_events;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. SEED USERS
-- Password for all: Password123!
INSERT INTO users (user_id, name, email, password_hash, phone, role, status, created_at) VALUES
(1, 'System Administrator', 'admin@foodrescue.org', '$2b$10$s3rIRH.xIjCp2UsOFxA3C.Bic3LfGR9BF9hzvNOoY0g2p8qDubIIG', '+1-555-0100', 'ADMIN', 'ACTIVE', NOW() - INTERVAL 30 DAY),
(2, 'Grand Metropolitan Hotel', 'chef.marcus@grandmetro.com', '$2b$10$s3rIRH.xIjCp2UsOFxA3C.Bic3LfGR9BF9hzvNOoY0g2p8qDubIIG', '+1-555-0201', 'DONOR', 'ACTIVE', NOW() - INTERVAL 25 DAY),
(3, 'Green Garden Organic Bistro', 'sarah@greengarden.com', '$2b$10$s3rIRH.xIjCp2UsOFxA3C.Bic3LfGR9BF9hzvNOoY0g2p8qDubIIG', '+1-555-0202', 'DONOR', 'ACTIVE', NOW() - INTERVAL 24 DAY),
(4, 'Skyline Convention Center', 'events@skylinecenter.org', '$2b$10$s3rIRH.xIjCp2UsOFxA3C.Bic3LfGR9BF9hzvNOoY0g2p8qDubIIG', '+1-555-0203', 'DONOR', 'ACTIVE', NOW() - INTERVAL 20 DAY),
(5, 'Harvest Supermarket Hub', 'manager@harvestgrocers.com', '$2b$10$s3rIRH.xIjCp2UsOFxA3C.Bic3LfGR9BF9hzvNOoY0g2p8qDubIIG', '+1-555-0204', 'DONOR', 'ACTIVE', NOW() - INTERVAL 15 DAY),
(6, 'Hope Harbor Community Kitchen', 'director@hopeharbor.org', '$2b$10$s3rIRH.xIjCp2UsOFxA3C.Bic3LfGR9BF9hzvNOoY0g2p8qDubIIG', '+1-555-0301', 'RECIPIENT', 'ACTIVE', NOW() - INTERVAL 28 DAY),
(7, 'Grace Street Homeless Shelter', 'shelter@gracestreet.org', '$2b$10$s3rIRH.xIjCp2UsOFxA3C.Bic3LfGR9BF9hzvNOoY0g2p8qDubIIG', '+1-555-0302', 'RECIPIENT', 'ACTIVE', NOW() - INTERVAL 22 DAY),
(8, 'St. Jude Youth Center & Pantry', 'meals@stjudeyouth.org', '$2b$10$s3rIRH.xIjCp2UsOFxA3C.Bic3LfGR9BF9hzvNOoY0g2p8qDubIIG', '+1-555-0303', 'RECIPIENT', 'ACTIVE', NOW() - INTERVAL 18 DAY),
(9, 'David Miller (Van Courier)', 'david.courier@rescuevolunteers.net', '$2b$10$s3rIRH.xIjCp2UsOFxA3C.Bic3LfGR9BF9hzvNOoY0g2p8qDubIIG', '+1-555-0401', 'VOLUNTEER', 'ACTIVE', NOW() - INTERVAL 26 DAY),
(10, 'Elena Rostova (Refrigerated Transit)', 'elena.rostova@ecoexpress.com', '$2b$10$s3rIRH.xIjCp2UsOFxA3C.Bic3LfGR9BF9hzvNOoY0g2p8qDubIIG', '+1-555-0402', 'VOLUNTEER', 'ACTIVE', NOW() - INTERVAL 21 DAY),
(11, 'Carlos Mendez (Urban Bike Cargo)', 'carlos.m@bikevolunteers.org', '$2b$10$s3rIRH.xIjCp2UsOFxA3C.Bic3LfGR9BF9hzvNOoY0g2p8qDubIIG', '+1-555-0403', 'VOLUNTEER', 'ACTIVE', NOW() - INTERVAL 14 DAY);

-- 2. SEED DONOR PROFILES
INSERT INTO donors (donor_id, user_id, organization_name, contact_person, address, donor_type) VALUES
(1, 2, 'Grand Metropolitan Hotel & Suites', 'Chef Marcus Vance', '742 Evergreen Terrace, Downtown District', 'HOTEL'),
(2, 3, 'Green Garden Organic Bistro', 'Sarah Jenkins', '120 Market Street, Midtown Arts Quarter', 'RESTAURANT'),
(3, 4, 'Skyline Convention & Banquet Center', 'Arthur Pendelton', '500 Harbor Boulevard, Waterfront District', 'EVENT_ORGANIZER'),
(4, 5, 'Harvest Fresh Supermarket #14', 'Lisa Wong', '880 Pine Ridge Parkway, Suburbia Commercial Park', 'SUPERMARKET');

-- 3. SEED RECIPIENT PROFILES
INSERT INTO recipients (recipient_id, user_id, organization_name, contact_person, address, capacity) VALUES
(1, 6, 'Hope Harbor Community Kitchen', 'Dr. Angela Davis', '304 Elm Street, Southside', 250),
(2, 7, 'Grace Street Emergency Shelter', 'Pastor Robert Hayes', '915 Grace Avenue, North Ward', 180),
(3, 8, 'St. Jude Youth Center & Family Pantry', 'Sister Maria Teresa', '412 Cathedral Parkway, East End', 120);

-- 4. SEED VOLUNTEER PROFILES
INSERT INTO volunteers (volunteer_id, user_id, vehicle_type, availability) VALUES
(1, 9, 'VAN', 'AVAILABLE'),
(2, 10, 'REFRIGERATED_VAN', 'AVAILABLE'),
(3, 11, 'CAR', 'AVAILABLE');

-- 5. SEED FOOD DONATIONS
INSERT INTO food_donations (donation_id, donor_id, food_type, description, quantity, remaining_quantity, unit, prepared_time, expiry_time, status, created_at) VALUES
(1, 1, 'Prepared Meals', 'Freshly prepared buffet trays of grilled chicken breast with roasted potatoes, herb carrots, and dinner rolls.', 45.00, 0.00, 'kg', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 1 DAY, 'COMPLETED', NOW() - INTERVAL 2 DAY),
(2, 1, 'Bakery', 'Assorted breakfast pastries including butter croissants, fruit danishes, and whole grain artisan sourdough boules.', 25.00, 10.00, 'kg', NOW() - INTERVAL 6 HOUR, NOW() + INTERVAL 18 HOUR, 'PARTIALLY_ALLOCATED', NOW() - INTERVAL 6 HOUR),
(3, 2, 'Vegetarian Meals', 'Nutritious vegan lentil dal with basmati rice, steamed spinach, and whole wheat pita breads packed in sealed containers.', 35.00, 35.00, 'kg', NOW() - INTERVAL 3 HOUR, NOW() + INTERVAL 21 HOUR, 'AVAILABLE', NOW() - INTERVAL 3 HOUR),
(4, 3, 'Prepared Meals', 'Catered corporate lunch surplus: Herb-crusted salmon fillets with quinoa salad, roasted asparagus, and citrus vinaigrette.', 60.00, 15.00, 'kg', NOW() - INTERVAL 12 HOUR, NOW() + INTERVAL 12 HOUR, 'PARTIALLY_ALLOCATED', NOW() - INTERVAL 12 HOUR),
(5, 4, 'Fresh Produce', 'Crates of organic apples, ripe bananas, sweet oranges, and crisp mixed salad greens from cold storage inventory.', 80.00, 80.00, 'kg', NOW() - INTERVAL 4 HOUR, NOW() + INTERVAL 48 HOUR, 'AVAILABLE', NOW() - INTERVAL 4 HOUR),
(6, 4, 'Dairy Products', 'Cartons of organic whole milk, greek yogurt tubs, and pasteurized cheddar cheese wheels from daily dairy rotation.', 40.00, 40.00, 'kg', NOW() - INTERVAL 2 HOUR, NOW() + INTERVAL 36 HOUR, 'AVAILABLE', NOW() - INTERVAL 2 HOUR);

-- 6. SEED FOOD REQUESTS
INSERT INTO food_requests (request_id, recipient_id, food_type, description, quantity_required, quantity_fulfilled, unit, required_by, priority, status, created_at) VALUES
(1, 1, 'Prepared Meals', 'Urgent dinner service request for 100 shelter residents: Hot protein-rich cooked dinner portions required before 7 PM.', 45.00, 45.00, 'kg', NOW() - INTERVAL 1 DAY, 'URGENT', 'FULFILLED', NOW() - INTERVAL 2 DAY),
(2, 1, 'Vegetarian Meals', 'Lunch service needs nutritious vegetarian or vegan warm meals with grain and pulse components.', 30.00, 0.00, 'kg', NOW() + INTERVAL 10 HOUR, 'HIGH', 'PENDING', NOW() - INTERVAL 4 HOUR),
(3, 2, 'Bakery', 'Breakfast program requires baked bread, pastries, rolls, or bagels for morning soup kitchen guests.', 25.00, 15.00, 'kg', NOW() + INTERVAL 14 HOUR, 'MEDIUM', 'PARTIALLY_FULFILLED', NOW() - INTERVAL 5 HOUR),
(4, 2, 'Prepared Meals', 'Dinner meal portions for families staying in emergency temporary shelter housing.', 50.00, 45.00, 'kg', NOW() + INTERVAL 8 HOUR, 'URGENT', 'PARTIALLY_FULFILLED', NOW() - INTERVAL 10 HOUR),
(5, 3, 'Fresh Produce', 'Weekly food pantry hampers need fresh seasonal fruits and salad greens for local vulnerable families.', 50.00, 0.00, 'kg', NOW() + INTERVAL 30 HOUR, 'MEDIUM', 'PENDING', NOW() - INTERVAL 2 HOUR);

-- 7. SEED DONATION ALLOCATIONS
INSERT INTO donation_allocations (allocation_id, donation_id, request_id, allocated_quantity, allocation_time, status) VALUES
(1, 1, 1, 45.00, NOW() - INTERVAL 2 DAY + INTERVAL 1 HOUR, 'DELIVERED'),
(2, 2, 3, 15.00, NOW() - INTERVAL 5 HOUR, 'IN_TRANSIT'),
(3, 4, 4, 45.00, NOW() - INTERVAL 8 HOUR, 'PENDING_PICKUP');

-- 8. SEED PICKUPS
INSERT INTO pickups (pickup_id, donation_id, volunteer_id, scheduled_time, pickup_time, pickup_status, created_at) VALUES
(1, 1, 1, NOW() - INTERVAL 2 DAY + INTERVAL 2 HOUR, NOW() - INTERVAL 2 DAY + INTERVAL 2 HOUR + INTERVAL 15 MINUTE, 'PICKED_UP', NOW() - INTERVAL 2 DAY + INTERVAL 1 HOUR),
(2, 2, 3, NOW() - INTERVAL 4 HOUR, NOW() - INTERVAL 3 HOUR + INTERVAL 30 MINUTE, 'PICKED_UP', NOW() - INTERVAL 5 HOUR),
(3, 4, 2, NOW() + INTERVAL 2 HOUR, NULL, 'ACCEPTED', NOW() - INTERVAL 8 HOUR);

-- 9. SEED DELIVERIES
INSERT INTO deliveries (delivery_id, pickup_id, allocation_id, delivery_time, delivery_status, delivered_quantity, recipient_signature, created_at) VALUES
(1, 1, 1, NOW() - INTERVAL 2 DAY + INTERVAL 3 HOUR, 'DELIVERED', 45.00, 'Dr. Angela Davis - Hope Harbor', NOW() - INTERVAL 2 DAY + INTERVAL 2 HOUR),
(2, 2, 2, NULL, 'IN_TRANSIT', 15.00, NULL, NOW() - INTERVAL 3 HOUR);

-- 10. SEED FEEDBACK
INSERT INTO feedback (feedback_id, delivery_id, rating, comments, created_at) VALUES
(1, 1, 5, 'Exceptional quality food, hot and sealed in pristine thermal hotel containers. Served 95 individuals with zero waste. Thank you!', NOW() - INTERVAL 2 DAY + INTERVAL 4 HOUR);

-- 11. SEED AUDIT LOGS
INSERT INTO donation_audit (donation_id, changed_by, old_quantity, new_quantity, old_status, new_status, action_type, changed_at) VALUES
(1, 'System Seeder', NULL, 45.00, NULL, 'AVAILABLE', 'INSERT', NOW() - INTERVAL 2 DAY),
(1, 'allocate_food procedure', 45.00, 0.00, 'AVAILABLE', 'COMPLETED', 'UPDATE', NOW() - INTERVAL 2 DAY + INTERVAL 1 HOUR),
(2, 'System Seeder', NULL, 25.00, NULL, 'AVAILABLE', 'INSERT', NOW() - INTERVAL 6 HOUR),
(2, 'allocate_food procedure', 25.00, 10.00, 'AVAILABLE', 'PARTIALLY_ALLOCATED', 'UPDATE', NOW() - INTERVAL 5 HOUR),
(4, 'System Seeder', NULL, 60.00, NULL, 'AVAILABLE', 'INSERT', NOW() - INTERVAL 12 HOUR),
(4, 'allocate_food procedure', 60.00, 15.00, 'AVAILABLE', 'PARTIALLY_ALLOCATED', 'UPDATE', NOW() - INTERVAL 8 HOUR);

-- 12. SEED OUTBOX EVENTS
INSERT INTO outbox_events (aggregate_type, aggregate_id, event_type, payload, status, created_at, processed_at) VALUES
('DONATION', 1, 'DONATION_CREATED', '{"donation_id": 1, "donor_id": 1, "food_type": "Prepared Meals", "quantity": 45.0, "unit": "kg"}', 'PUBLISHED', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),
('ALLOCATION', 1, 'ALLOCATION_CREATED', '{"allocation_id": 1, "donation_id": 1, "request_id": 1, "quantity": 45.0}', 'PUBLISHED', NOW() - INTERVAL 2 DAY + INTERVAL 1 HOUR, NOW() - INTERVAL 2 DAY + INTERVAL 1 HOUR),
('DELIVERY', 1, 'DELIVERY_COMPLETED', '{"delivery_id": 1, "recipient_id": 1, "delivered_quantity": 45.0, "rating": 5}', 'PUBLISHED', NOW() - INTERVAL 2 DAY + INTERVAL 3 HOUR, NOW() - INTERVAL 2 DAY + INTERVAL 3 HOUR),
('DONATION', 3, 'DONATION_CREATED', '{"donation_id": 3, "donor_id": 2, "food_type": "Vegetarian Meals", "quantity": 35.0, "unit": "kg"}', 'PENDING', NOW() - INTERVAL 3 HOUR, NULL);
