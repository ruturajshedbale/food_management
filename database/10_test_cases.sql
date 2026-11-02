-- ============================================================================
-- SMART FOOD RESCUE & REDISTRIBUTION INTELLIGENCE SYSTEM
-- Script 10: Automated Database Verification & Boundary Constraint Test Cases
-- ============================================================================

USE food_rescue_db;

-- ----------------------------------------------------------------------------
-- TEST 1: Test Stored Procedure allocate_food for Valid Partial Allocation
-- ----------------------------------------------------------------------------
SET @v_alloc_id = 0;
SET @v_msg = '';

CALL allocate_food(3, 2, 10.00, 1, @v_alloc_id, @v_msg);
SELECT @v_alloc_id AS allocated_id, @v_msg AS allocation_result;

-- Check remaining quantity of donation 3 (was 35.00, should now be 25.00)
SELECT donation_id, quantity, remaining_quantity, status 
FROM food_donations WHERE donation_id = 3;

-- Check request 2 (required 30.00, fulfilled should now be 10.00)
SELECT request_id, quantity_required, quantity_fulfilled, status 
FROM food_requests WHERE request_id = 2;

-- ----------------------------------------------------------------------------
-- TEST 2: Over-Allocation Prevention Test
-- Attempting to allocate 100 kg when only 25 kg remains must fail cleanly
-- ----------------------------------------------------------------------------
SET @v_alloc_fail_id = 0;
SET @v_fail_msg = '';

CALL allocate_food(3, 2, 100.00, 1, @v_alloc_fail_id, @v_fail_msg);
SELECT @v_alloc_fail_id AS must_be_zero, @v_fail_msg AS error_message;

-- ----------------------------------------------------------------------------
-- TEST 3: Verify View Performance & Results
-- ----------------------------------------------------------------------------
SELECT * FROM available_donations_view;
SELECT * FROM pending_requests_view;
SELECT * FROM redistribution_analytics_view;
