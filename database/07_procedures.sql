-- ============================================================================
-- SMART FOOD RESCUE & REDISTRIBUTION INTELLIGENCE SYSTEM
-- Script 07: Stored Procedures with ACID Transactions & Concurrency Control
-- ============================================================================

USE food_rescue_db;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- PROCEDURE 1: allocate_food
-- Atomically allocates a specified quantity of surplus food to a recipient request.
-- Guarantees ACID compliance, prevents over-allocation, and writes outbox event.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS allocate_food$$

CREATE PROCEDURE allocate_food(
    IN p_donation_id INT,
    IN p_request_id INT,
    IN p_quantity DECIMAL(10,2),
    IN p_actor_id INT,
    OUT p_allocation_id INT,
    OUT p_status_message VARCHAR(255)
)
proc_block: BEGIN
    DECLARE v_remaining_qty DECIMAL(10,2);
    DECLARE v_donation_expiry DATETIME;
    DECLARE v_donation_status VARCHAR(50);
    DECLARE v_req_required DECIMAL(10,2);
    DECLARE v_req_fulfilled DECIMAL(10,2);
    DECLARE v_req_status VARCHAR(50);
    DECLARE v_req_unmet DECIMAL(10,2);
    DECLARE v_new_rem_qty DECIMAL(10,2);
    DECLARE v_new_fulfilled_qty DECIMAL(10,2);
    DECLARE v_new_donation_status VARCHAR(50);
    DECLARE v_new_req_status VARCHAR(50);

    -- Standard error handler triggers ROLLBACK on any SQL exception
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_allocation_id = 0;
        SET p_status_message = 'ERROR: Database transaction failed during allocation. Changes rolled back.';
    END;

    -- Validate input quantity
    IF p_quantity <= 0 THEN
        SET p_allocation_id = 0;
        SET p_status_message = 'ERROR: Allocation quantity must be strictly greater than zero.';
        LEAVE proc_block;
    END IF;

    -- BEGIN ACID TRANSACTION
    START TRANSACTION;

    -- Lock both records in deterministic order (by table hierarchy) to prevent deadlocks
    -- 1. Lock and inspect donation record
    SELECT remaining_quantity, expiry_time, status
    INTO v_remaining_qty, v_donation_expiry, v_donation_status
    FROM food_donations
    WHERE donation_id = p_donation_id
    FOR UPDATE;

    IF v_remaining_qty IS NULL THEN
        ROLLBACK;
        SET p_allocation_id = 0;
        SET p_status_message = 'ERROR: Donation lot not found.';
        LEAVE proc_block;
    END IF;

    IF v_donation_expiry <= NOW() THEN
        ROLLBACK;
        SET p_allocation_id = 0;
        SET p_status_message = 'ERROR: Cannot allocate expired food donation.';
        LEAVE proc_block;
    END IF;

    IF v_donation_status NOT IN ('AVAILABLE', 'PARTIALLY_ALLOCATED') THEN
        ROLLBACK;
        SET p_allocation_id = 0;
        SET p_status_message = 'ERROR: Donation status does not permit new allocations.';
        LEAVE proc_block;
    END IF;

    IF v_remaining_qty < p_quantity THEN
        ROLLBACK;
        SET p_allocation_id = 0;
        SET p_status_message = CONCAT('ERROR: Over-allocation prevented. Requested ', p_quantity, ' kg but only ', v_remaining_qty, ' kg remains.');
        LEAVE proc_block;
    END IF;

    -- 2. Lock and inspect request record
    SELECT quantity_required, quantity_fulfilled, status
    INTO v_req_required, v_req_fulfilled, v_req_status
    FROM food_requests
    WHERE request_id = p_request_id
    FOR UPDATE;

    IF v_req_required IS NULL THEN
        ROLLBACK;
        SET p_allocation_id = 0;
        SET p_status_message = 'ERROR: Food request not found.';
        LEAVE proc_block;
    END IF;

    IF v_req_status NOT IN ('PENDING', 'PARTIALLY_FULFILLED') THEN
        ROLLBACK;
        SET p_allocation_id = 0;
        SET p_status_message = 'ERROR: Request is not open for fulfillment.';
        LEAVE proc_block;
    END IF;

    SET v_req_unmet = v_req_required - v_req_fulfilled;
    IF p_quantity > v_req_unmet THEN
        ROLLBACK;
        SET p_allocation_id = 0;
        SET p_status_message = CONCAT('ERROR: Allocation exceeds request requirement. Unmet: ', v_req_unmet, ' kg, attempted: ', p_quantity, ' kg.');
        LEAVE proc_block;
    END IF;

    -- 3. Insert allocation record
    INSERT INTO donation_allocations (donation_id, request_id, allocated_quantity, allocation_time, status)
    VALUES (p_donation_id, p_request_id, p_quantity, NOW(), 'PENDING_PICKUP');
    
    SET p_allocation_id = LAST_INSERT_ID();

    -- 4. Calculate new inventory balances
    SET v_new_rem_qty = v_remaining_qty - p_quantity;
    IF v_new_rem_qty = 0 THEN
        SET v_new_donation_status = 'FULLY_ALLOCATED';
    ELSE
        SET v_new_donation_status = 'PARTIALLY_ALLOCATED';
    END IF;

    UPDATE food_donations
    SET remaining_quantity = v_new_rem_qty,
        status = v_new_donation_status
    WHERE donation_id = p_donation_id;

    -- 5. Calculate new request fulfillment balances
    SET v_new_fulfilled_qty = v_req_fulfilled + p_quantity;
    IF v_new_fulfilled_qty >= v_req_required THEN
        SET v_new_req_status = 'FULFILLED';
    ELSE
        SET v_new_req_status = 'PARTIALLY_FULFILLED';
    END IF;

    UPDATE food_requests
    SET quantity_fulfilled = v_new_fulfilled_qty,
        status = v_new_req_status
    WHERE request_id = p_request_id;

    -- 6. Insert audit trail entry
    INSERT INTO donation_audit (donation_id, changed_by, old_quantity, new_quantity, old_status, new_status, action_type, changed_at)
    VALUES (p_donation_id, CONCAT('User:', p_actor_id, ' via allocate_food'), v_remaining_qty, v_new_rem_qty, v_donation_status, v_new_donation_status, 'ALLOCATE', NOW());

    -- 7. Write to Transactional Outbox for MongoDB synchronization
    INSERT INTO outbox_events (aggregate_type, aggregate_id, event_type, payload, status, created_at)
    VALUES ('ALLOCATION', p_allocation_id, 'ALLOCATION_CREATED', JSON_OBJECT(
        'allocation_id', p_allocation_id,
        'donation_id', p_donation_id,
        'request_id', p_request_id,
        'allocated_quantity', p_quantity,
        'actor_id', p_actor_id,
        'allocated_at', NOW()
    ), 'PENDING', NOW());

    -- COMMIT TRANSACTION
    COMMIT;
    SET p_status_message = 'SUCCESS: Allocation committed successfully.';
END proc_block$$

-- ----------------------------------------------------------------------------
-- PROCEDURE 2: cancel_allocation
-- Rolls back an uncollected allocation and returns quantity to available inventory.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS cancel_allocation$$

CREATE PROCEDURE cancel_allocation(
    IN p_allocation_id INT,
    IN p_actor_id INT,
    OUT p_status_message VARCHAR(255)
)
proc_block: BEGIN
    DECLARE v_donation_id INT;
    DECLARE v_request_id INT;
    DECLARE v_allocated_qty DECIMAL(10,2);
    DECLARE v_alloc_status VARCHAR(50);
    DECLARE v_don_rem_qty DECIMAL(10,2);
    DECLARE v_don_total_qty DECIMAL(10,2);
    DECLARE v_req_fulfilled DECIMAL(10,2);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status_message = 'ERROR: Failed to cancel allocation. Transaction rolled back.';
    END;

    START TRANSACTION;

    SELECT donation_id, request_id, allocated_quantity, status
    INTO v_donation_id, v_request_id, v_allocated_qty, v_alloc_status
    FROM donation_allocations
    WHERE allocation_id = p_allocation_id
    FOR UPDATE;

    IF v_donation_id IS NULL THEN
        ROLLBACK;
        SET p_status_message = 'ERROR: Allocation record not found.';
        LEAVE proc_block;
    END IF;

    IF v_alloc_status != 'PENDING_PICKUP' THEN
        ROLLBACK;
        SET p_status_message = 'ERROR: Only allocations in PENDING_PICKUP status can be cancelled.';
        LEAVE proc_block;
    END IF;

    -- Update allocation status
    UPDATE donation_allocations
    SET status = 'CANCELLED'
    WHERE allocation_id = p_allocation_id;

    -- Return quantity to donation
    SELECT quantity, remaining_quantity INTO v_don_total_qty, v_don_rem_qty
    FROM food_donations WHERE donation_id = v_donation_id FOR UPDATE;

    UPDATE food_donations
    SET remaining_quantity = LEAST(v_don_total_qty, v_don_rem_qty + v_allocated_qty),
        status = CASE 
            WHEN (v_don_rem_qty + v_allocated_qty) >= v_don_total_qty THEN 'AVAILABLE'
            ELSE 'PARTIALLY_ALLOCATED'
        END
    WHERE donation_id = v_donation_id;

    -- Revert request fulfilled quantity
    SELECT quantity_fulfilled INTO v_req_fulfilled
    FROM food_requests WHERE request_id = v_request_id FOR UPDATE;

    UPDATE food_requests
    SET quantity_fulfilled = GREATEST(0, v_req_fulfilled - v_allocated_qty),
        status = CASE 
            WHEN (v_req_fulfilled - v_allocated_qty) <= 0 THEN 'PENDING'
            ELSE 'PARTIALLY_FULFILLED'
        END
    WHERE request_id = v_request_id;

    -- Audit log
    INSERT INTO donation_audit (donation_id, changed_by, old_quantity, new_quantity, old_status, new_status, action_type, changed_at)
    VALUES (v_donation_id, CONCAT('User:', p_actor_id, ' via cancel_allocation'), v_don_rem_qty, v_don_rem_qty + v_allocated_qty, 'FULLY_ALLOCATED', 'AVAILABLE', 'CANCEL_ALLOC', NOW());

    -- Outbox event
    INSERT INTO outbox_events (aggregate_type, aggregate_id, event_type, payload, status, created_at)
    VALUES ('ALLOCATION', p_allocation_id, 'ALLOCATION_CANCELLED', JSON_OBJECT(
        'allocation_id', p_allocation_id,
        'donation_id', v_donation_id,
        'returned_quantity', v_allocated_qty,
        'actor_id', p_actor_id
    ), 'PENDING', NOW());

    COMMIT;
    SET p_status_message = 'SUCCESS: Allocation cancelled and inventory returned.';
END proc_block$$

-- ----------------------------------------------------------------------------
-- PROCEDURE 3: assign_volunteer
-- Creates a pickup dispatch job for an assigned volunteer.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS assign_volunteer$$

CREATE PROCEDURE assign_volunteer(
    IN p_donation_id INT,
    IN p_volunteer_id INT,
    IN p_scheduled_time DATETIME,
    OUT p_pickup_id INT,
    OUT p_status_message VARCHAR(255)
)
proc_block: BEGIN
    DECLARE v_exists INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_pickup_id = 0;
        SET p_status_message = 'ERROR: Failed to assign volunteer.';
    END;

    START TRANSACTION;

    SELECT COUNT(*) INTO v_exists FROM volunteers WHERE volunteer_id = p_volunteer_id;
    IF v_exists = 0 THEN
        ROLLBACK;
        SET p_pickup_id = 0;
        SET p_status_message = 'ERROR: Volunteer does not exist.';
        LEAVE proc_block;
    END IF;

    INSERT INTO pickups (donation_id, volunteer_id, scheduled_time, pickup_status, created_at)
    VALUES (p_donation_id, p_volunteer_id, p_scheduled_time, 'ASSIGNED', NOW());

    SET p_pickup_id = LAST_INSERT_ID();

    -- Write outbox event
    INSERT INTO outbox_events (aggregate_type, aggregate_id, event_type, payload, status, created_at)
    VALUES ('PICKUP', p_pickup_id, 'PICKUP_ASSIGNED', JSON_OBJECT(
        'pickup_id', p_pickup_id,
        'donation_id', p_donation_id,
        'volunteer_id', p_volunteer_id,
        'scheduled_time', p_scheduled_time
    ), 'PENDING', NOW());

    COMMIT;
    SET p_status_message = 'SUCCESS: Volunteer successfully assigned to pickup.';
END proc_block$$

-- ----------------------------------------------------------------------------
-- PROCEDURE 4: update_delivery_status
-- Transitions a delivery to DELIVERED or FAILED and captures recipient signature.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS update_delivery_status$$

CREATE PROCEDURE update_delivery_status(
    IN p_delivery_id INT,
    IN p_new_status VARCHAR(50),
    IN p_delivered_quantity DECIMAL(10,2),
    IN p_recipient_signature VARCHAR(120),
    OUT p_status_message VARCHAR(255)
)
proc_block: BEGIN
    DECLARE v_alloc_id INT;
    DECLARE v_pickup_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status_message = 'ERROR: Failed to update delivery status.';
    END;

    START TRANSACTION;

    SELECT allocation_id, pickup_id INTO v_alloc_id, v_pickup_id
    FROM deliveries
    WHERE delivery_id = p_delivery_id
    FOR UPDATE;

    IF v_alloc_id IS NULL THEN
        ROLLBACK;
        SET p_status_message = 'ERROR: Delivery record not found.';
        LEAVE proc_block;
    END IF;

    UPDATE deliveries
    SET delivery_status = p_new_status,
        delivered_quantity = p_delivered_quantity,
        recipient_signature = p_recipient_signature,
        delivery_time = CASE WHEN p_new_status = 'DELIVERED' THEN NOW() ELSE delivery_time END
    WHERE delivery_id = p_delivery_id;

    IF p_new_status = 'DELIVERED' THEN
        UPDATE donation_allocations
        SET status = 'DELIVERED'
        WHERE allocation_id = v_alloc_id;
    END IF;

    -- Write outbox event
    INSERT INTO outbox_events (aggregate_type, aggregate_id, event_type, payload, status, created_at)
    VALUES ('DELIVERY', p_delivery_id, CONCAT('DELIVERY_', p_new_status), JSON_OBJECT(
        'delivery_id', p_delivery_id,
        'status', p_new_status,
        'delivered_quantity', p_delivered_quantity,
        'signature', p_recipient_signature
    ), 'PENDING', NOW());

    COMMIT;
    SET p_status_message = 'SUCCESS: Delivery status updated.';
END proc_block$$

DELIMITER ;
