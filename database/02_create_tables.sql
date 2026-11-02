-- ============================================================================
-- SMART FOOD RESCUE & REDISTRIBUTION INTELLIGENCE SYSTEM
-- Script 02: Table Definitions (DDL)
-- Engine: InnoDB (Full ACID Support, Row-level Locking, Foreign Keys)
-- ============================================================================

USE food_rescue_db;

-- 1. USERS TABLE: Core authentication & RBAC records
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NULL,
    role ENUM('ADMIN', 'DONOR', 'RECIPIENT', 'VOLUNTEER') NOT NULL,
    status ENUM('ACTIVE', 'SUSPENDED', 'PENDING') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. DONORS TABLE: Extended organization profile for donors
CREATE TABLE IF NOT EXISTS donors (
    donor_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    organization_name VARCHAR(180) NOT NULL,
    contact_person VARCHAR(120) NOT NULL,
    address TEXT NOT NULL,
    donor_type ENUM('RESTAURANT', 'HOTEL', 'CAFETERIA', 'SUPERMARKET', 'EVENT_ORGANIZER', 'INDIVIDUAL', 'OTHER') NOT NULL,
    CONSTRAINT uq_donors_user_id UNIQUE (user_id),
    CONSTRAINT fk_donors_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. RECIPIENTS TABLE: Extended profile for recipient NGOs / community shelters
CREATE TABLE IF NOT EXISTS recipients (
    recipient_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    organization_name VARCHAR(180) NOT NULL,
    contact_person VARCHAR(120) NOT NULL,
    address TEXT NOT NULL,
    capacity INT NOT NULL,
    CONSTRAINT uq_recipients_user_id UNIQUE (user_id),
    CONSTRAINT fk_recipients_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_recipient_capacity CHECK (capacity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. VOLUNTEERS TABLE: Extended profile for logistics volunteers
CREATE TABLE IF NOT EXISTS volunteers (
    volunteer_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    vehicle_type ENUM('BICYCLE', 'MOTORCYCLE', 'CAR', 'VAN', 'REFRIGERATED_VAN', 'WALKING') NOT NULL,
    availability ENUM('AVAILABLE', 'BUSY', 'OFFLINE') NOT NULL DEFAULT 'AVAILABLE',
    CONSTRAINT uq_volunteers_user_id UNIQUE (user_id),
    CONSTRAINT fk_volunteers_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. FOOD_DONATIONS TABLE: Declarations of surplus food by donors
CREATE TABLE IF NOT EXISTS food_donations (
    donation_id INT AUTO_INCREMENT PRIMARY KEY,
    donor_id INT NOT NULL,
    food_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    remaining_quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(30) NOT NULL DEFAULT 'kg',
    prepared_time DATETIME NOT NULL,
    expiry_time DATETIME NOT NULL,
    status ENUM('AVAILABLE', 'PARTIALLY_ALLOCATED', 'FULLY_ALLOCATED', 'COMPLETED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_donations_donor FOREIGN KEY (donor_id) REFERENCES donors(donor_id) ON DELETE RESTRICT,
    CONSTRAINT chk_donation_quantity CHECK (quantity > 0),
    CONSTRAINT chk_donation_remaining CHECK (remaining_quantity >= 0 AND remaining_quantity <= quantity),
    CONSTRAINT chk_donation_expiry CHECK (expiry_time > prepared_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. FOOD_REQUESTS TABLE: Requisitions declared by recipient NGOs
CREATE TABLE IF NOT EXISTS food_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_id INT NOT NULL,
    food_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    quantity_required DECIMAL(10,2) NOT NULL,
    quantity_fulfilled DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(30) NOT NULL DEFAULT 'kg',
    required_by DATETIME NOT NULL,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    status ENUM('PENDING', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_requests_recipient FOREIGN KEY (recipient_id) REFERENCES recipients(recipient_id) ON DELETE RESTRICT,
    CONSTRAINT chk_request_qty_required CHECK (quantity_required > 0),
    CONSTRAINT chk_request_qty_fulfilled CHECK (quantity_fulfilled >= 0 AND quantity_fulfilled <= quantity_required)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. DONATION_ALLOCATIONS TABLE: Associative M:N table linking donations and requests
CREATE TABLE IF NOT EXISTS donation_allocations (
    allocation_id INT AUTO_INCREMENT PRIMARY KEY,
    donation_id INT NOT NULL,
    request_id INT NOT NULL,
    allocated_quantity DECIMAL(10,2) NOT NULL,
    allocation_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING_PICKUP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING_PICKUP',
    CONSTRAINT fk_alloc_donation FOREIGN KEY (donation_id) REFERENCES food_donations(donation_id) ON DELETE RESTRICT,
    CONSTRAINT fk_alloc_request FOREIGN KEY (request_id) REFERENCES food_requests(request_id) ON DELETE RESTRICT,
    CONSTRAINT chk_alloc_quantity CHECK (allocated_quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. PICKUPS TABLE: Transport jobs assigned to volunteers
CREATE TABLE IF NOT EXISTS pickups (
    pickup_id INT AUTO_INCREMENT PRIMARY KEY,
    donation_id INT NOT NULL,
    volunteer_id INT NOT NULL,
    scheduled_time DATETIME NOT NULL,
    pickup_time DATETIME NULL,
    pickup_status ENUM('ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'CANCELLED') NOT NULL DEFAULT 'ASSIGNED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pickups_donation FOREIGN KEY (donation_id) REFERENCES food_donations(donation_id) ON DELETE RESTRICT,
    CONSTRAINT fk_pickups_volunteer FOREIGN KEY (volunteer_id) REFERENCES volunteers(volunteer_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. DELIVERIES TABLE: Delivery dropoffs from pickup to final recipient allocation
CREATE TABLE IF NOT EXISTS deliveries (
    delivery_id INT AUTO_INCREMENT PRIMARY KEY,
    pickup_id INT NOT NULL,
    allocation_id INT NOT NULL,
    delivery_time DATETIME NULL,
    delivery_status ENUM('PENDING', 'IN_TRANSIT', 'DELIVERED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    delivered_quantity DECIMAL(10,2) NOT NULL,
    recipient_signature VARCHAR(120) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_deliveries_pickup FOREIGN KEY (pickup_id) REFERENCES pickups(pickup_id) ON DELETE RESTRICT,
    CONSTRAINT fk_deliveries_allocation FOREIGN KEY (allocation_id) REFERENCES donation_allocations(allocation_id) ON DELETE RESTRICT,
    CONSTRAINT chk_delivery_quantity CHECK (delivered_quantity >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. FEEDBACK TABLE: Post-delivery reviews by recipients
CREATE TABLE IF NOT EXISTS feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    delivery_id INT NOT NULL,
    rating TINYINT NOT NULL,
    comments TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_feedback_delivery UNIQUE (delivery_id),
    CONSTRAINT fk_feedback_delivery FOREIGN KEY (delivery_id) REFERENCES deliveries(delivery_id) ON DELETE CASCADE,
    CONSTRAINT chk_feedback_rating CHECK (rating >= 1 AND rating <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. DONATION_AUDIT TABLE: Trigger-populated audit ledger
CREATE TABLE IF NOT EXISTS donation_audit (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    donation_id INT NOT NULL,
    changed_by VARCHAR(100) NOT NULL,
    old_quantity DECIMAL(10,2) NULL,
    new_quantity DECIMAL(10,2) NULL,
    old_status VARCHAR(50) NULL,
    new_status VARCHAR(50) NULL,
    action_type VARCHAR(30) NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. OUTBOX_EVENTS TABLE: Transactional Outbox pattern for reliable async MongoDB sync
CREATE TABLE IF NOT EXISTS outbox_events (
    event_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    aggregate_type VARCHAR(50) NOT NULL,
    aggregate_id INT NOT NULL,
    event_type VARCHAR(80) NOT NULL,
    payload JSON NOT NULL,
    status ENUM('PENDING', 'PUBLISHED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
