-- ============================================================================
-- SMART FOOD RESCUE & REDISTRIBUTION INTELLIGENCE SYSTEM
-- Script 08: Database Triggers for Automated Auditing & Integrity Assertion
-- ============================================================================

USE food_rescue_db;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- TRIGGER 1: trg_after_donation_insert
-- Automatically records an audit entry and enqueues an outbox event when a new
-- food surplus donation is published.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_after_donation_insert$$

CREATE TRIGGER trg_after_donation_insert
AFTER INSERT ON food_donations
FOR EACH ROW
BEGIN
    -- Record initial audit log
    INSERT INTO donation_audit (
        donation_id,
        changed_by,
        old_quantity,
        new_quantity,
        old_status,
        new_status,
        action_type,
        changed_at
    ) VALUES (
        NEW.donation_id,
        CONCAT('DonorID:', NEW.donor_id),
        NULL,
        NEW.quantity,
        NULL,
        NEW.status,
        'INSERT',
        NOW()
    );

    -- Enqueue Outbox event for MongoDB synchronization
    INSERT INTO outbox_events (
        aggregate_type,
        aggregate_id,
        event_type,
        payload,
        status,
        created_at
    ) VALUES (
        'DONATION',
        NEW.donation_id,
        'DONATION_CREATED',
        JSON_OBJECT(
            'donation_id', NEW.donation_id,
            'donor_id', NEW.donor_id,
            'food_type', NEW.food_type,
            'description', NEW.description,
            'quantity', NEW.quantity,
            'unit', NEW.unit,
            'prepared_time', NEW.prepared_time,
            'expiry_time', NEW.expiry_time,
            'status', NEW.status
        ),
        'PENDING',
        NOW()
    );
END$$

-- ----------------------------------------------------------------------------
-- TRIGGER 2: trg_after_donation_update
-- Logs audit events whenever remaining quantity or status changes.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_after_donation_update$$

CREATE TRIGGER trg_after_donation_update
AFTER UPDATE ON food_donations
FOR EACH ROW
BEGIN
    IF (OLD.remaining_quantity <> NEW.remaining_quantity OR OLD.status <> NEW.status) THEN
        INSERT INTO donation_audit (
            donation_id,
            changed_by,
            old_quantity,
            new_quantity,
            old_status,
            new_status,
            action_type,
            changed_at
        ) VALUES (
            NEW.donation_id,
            'system_trigger',
            OLD.remaining_quantity,
            NEW.remaining_quantity,
            OLD.status,
            NEW.status,
            'UPDATE',
            NOW()
        );
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- TRIGGER 3: trg_before_delivery_insert
-- Enforces that a delivery cannot exceed the allocated quantity.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_before_delivery_insert$$

CREATE TRIGGER trg_before_delivery_insert
BEFORE INSERT ON deliveries
FOR EACH ROW
BEGIN
    DECLARE v_allocated_qty DECIMAL(10,2);
    
    SELECT allocated_quantity INTO v_allocated_qty
    FROM donation_allocations
    WHERE allocation_id = NEW.allocation_id;

    IF v_allocated_qty IS NOT NULL AND NEW.delivered_quantity > v_allocated_qty THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Integrity Error: Delivered quantity cannot exceed the assigned allocation quantity.';
    END IF;
END$$

DELIMITER ;
