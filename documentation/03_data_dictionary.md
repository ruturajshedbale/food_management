# Comprehensive Data Dictionary (Phase 2)
## Smart Food Rescue & Redistribution Intelligence System

### Database: `food_rescue_db` | Engine: `InnoDB` | Charset: `utf8mb4` | Collation: `utf8mb4_unicode_ci`

---

### Table 1: `users`
Stores system accounts, credential hashes, and authorization roles.

| Column | Data Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `user_id` | INT | NO | PRIMARY KEY, AUTO_INCREMENT | None | Unique system user identifier |
| `name` | VARCHAR(120) | NO | None | None | Full legal name or representative name |
| `email` | VARCHAR(150) | NO | UNIQUE | None | Authenticated corporate/personal email |
| `password_hash` | VARCHAR(255) | NO | None | None | Bcrypt password hash string |
| `phone` | VARCHAR(30) | YES | None | NULL | Contact phone number (E.164 compliant) |
| `role` | ENUM | NO | CHECK role IN ('ADMIN', 'DONOR', 'RECIPIENT', 'VOLUNTEER') | None | RBAC system role |
| `status` | ENUM | NO | CHECK status IN ('ACTIVE', 'SUSPENDED', 'PENDING') | 'ACTIVE' | Account state |
| `created_at` | TIMESTAMP | NO | None | CURRENT_TIMESTAMP | Account creation timestamp |

---

### Table 2: `donors`
Extended organization profile for food surplus providers.

| Column | Data Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `donor_id` | INT | NO | PRIMARY KEY, AUTO_INCREMENT | None | Unique donor identifier |
| `user_id` | INT | NO | UNIQUE, FK -> `users(user_id)` ON DELETE CASCADE | None | User account reference |
| `organization_name` | VARCHAR(180) | NO | None | None | Business or entity legal title |
| `contact_person` | VARCHAR(120) | NO | None | None | Primary operations coordinator |
| `address` | TEXT | NO | None | None | Pickup location physical address |
| `donor_type` | ENUM | NO | CHECK donor_type IN ('RESTAURANT', 'HOTEL', 'CAFETERIA', 'SUPERMARKET', 'EVENT_ORGANIZER', 'INDIVIDUAL', 'OTHER') | None | Industry category |

---

### Table 3: `recipients`
Extended profile for beneficiary organizations (NGOs, shelters).

| Column | Data Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `recipient_id` | INT | NO | PRIMARY KEY, AUTO_INCREMENT | None | Unique recipient identifier |
| `user_id` | INT | NO | UNIQUE, FK -> `users(user_id)` ON DELETE CASCADE | None | User account reference |
| `organization_name` | VARCHAR(180) | NO | None | None | NGO / Shelter name |
| `contact_person` | VARCHAR(120) | NO | None | None | Receiving officer name |
| `address` | TEXT | NO | None | None | Delivery destination address |
| `capacity` | INT | NO | CHECK (`capacity` > 0) | None | Max daily meals/beneficiaries capacity |

---

### Table 4: `volunteers`
Extended profile for courier and logistics volunteers.

| Column | Data Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `volunteer_id` | INT | NO | PRIMARY KEY, AUTO_INCREMENT | None | Unique volunteer identifier |
| `user_id` | INT | NO | UNIQUE, FK -> `users(user_id)` ON DELETE CASCADE | None | User account reference |
| `vehicle_type` | ENUM | NO | CHECK vehicle_type IN ('BICYCLE', 'MOTORCYCLE', 'CAR', 'VAN', 'REFRIGERATED_VAN', 'WALKING') | None | Logistics transport mode |
| `availability` | ENUM | NO | CHECK availability IN ('AVAILABLE', 'BUSY', 'OFFLINE') | 'AVAILABLE' | Real-time dispatch readiness |

---

### Table 5: `food_donations`
Surplus food declared by donors.

| Column | Data Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `donation_id` | INT | NO | PRIMARY KEY, AUTO_INCREMENT | None | Unique donation identifier |
| `donor_id` | INT | NO | FK -> `donors(donor_id)` ON DELETE RESTRICT | None | Donating organization |
| `food_type` | VARCHAR(100) | NO | None | None | Category (Prepared Meals, Produce, Bakery, Dairy) |
| `description` | TEXT | NO | None | None | Detailed inventory & allergens |
| `quantity` | DECIMAL(10,2) | NO | CHECK (`quantity` > 0) | None | Total initial declared quantity |
| `remaining_quantity` | DECIMAL(10,2) | NO | CHECK (`remaining_quantity` >= 0 AND `remaining_quantity` <= `quantity`) | None | Quantity still unallocated |
| `unit` | VARCHAR(30) | NO | None | 'kg' | Unit of measurement (kg, meals, boxes) |
| `prepared_time` | DATETIME | NO | None | None | Cooking/packaging time |
| `expiry_time` | DATETIME | NO | CHECK (`expiry_time` > `prepared_time`) | None | Safety expiration timestamp |
| `status` | ENUM | NO | CHECK status IN ('AVAILABLE', 'PARTIALLY_ALLOCATED', 'FULLY_ALLOCATED', 'COMPLETED', 'EXPIRED', 'CANCELLED') | 'AVAILABLE' | Inventory lifecycle state |
| `created_at` | TIMESTAMP | NO | None | CURRENT_TIMESTAMP | Record creation timestamp |

---

### Table 6: `food_requests`
Demands submitted by recipient NGOs.

| Column | Data Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `request_id` | INT | NO | PRIMARY KEY, AUTO_INCREMENT | None | Unique requisition identifier |
| `recipient_id` | INT | NO | FK -> `recipients(recipient_id)` ON DELETE RESTRICT | None | Requesting NGO |
| `food_type` | VARCHAR(100) | NO | None | None | Needed food category |
| `description` | TEXT | NO | None | None | Specific requisition guidelines |
| `quantity_required`| DECIMAL(10,2) | NO | CHECK (`quantity_required` > 0) | None | Target requirement |
| `quantity_fulfilled`| DECIMAL(10,2)| NO | CHECK (`quantity_fulfilled` >= 0 AND `quantity_fulfilled` <= `quantity_required`) | 0.00 | Sum of confirmed allocations |
| `unit` | VARCHAR(30) | NO | None | 'kg' | Measurement unit |
| `required_by` | DATETIME | NO | None | None | Deadline for delivery |
| `priority` | ENUM | NO | CHECK priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT') | 'MEDIUM' | Triage urgency |
| `status` | ENUM | NO | CHECK status IN ('PENDING', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED', 'EXPIRED') | 'PENDING' | Fulfillment state |
| `created_at` | TIMESTAMP | NO | None | CURRENT_TIMESTAMP | Request creation timestamp |

---

### Table 7: `donation_allocations`
Associative table resolving M:N relationship between donations and requests.

| Column | Data Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `allocation_id` | INT | NO | PRIMARY KEY, AUTO_INCREMENT | None | Unique allocation identifier |
| `donation_id` | INT | NO | FK -> `food_donations(donation_id)` ON DELETE RESTRICT | None | Source donation |
| `request_id` | INT | NO | FK -> `food_requests(request_id)` ON DELETE RESTRICT | None | Target recipient request |
| `allocated_quantity`| DECIMAL(10,2)| NO | CHECK (`allocated_quantity` > 0) | None | Amount earmarked |
| `allocation_time` | TIMESTAMP | NO | None | CURRENT_TIMESTAMP | Atomic reservation timestamp |
| `status` | ENUM | NO | CHECK status IN ('PENDING_PICKUP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED') | 'PENDING_PICKUP' | Allocation progress |

---

### Table 8: `pickups`
Scheduled logistics collection jobs assigned to volunteers.

| Column | Data Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `pickup_id` | INT | NO | PRIMARY KEY, AUTO_INCREMENT | None | Unique pickup job identifier |
| `donation_id` | INT | NO | FK -> `food_donations(donation_id)` ON DELETE RESTRICT | None | Donation being collected |
| `volunteer_id` | INT | NO | FK -> `volunteers(volunteer_id)` ON DELETE RESTRICT | None | Assigned logistics volunteer |
| `scheduled_time` | DATETIME | NO | None | None | Planned arrival at donor premises |
| `pickup_time` | DATETIME | YES | None | NULL | Actual handoff timestamp |
| `pickup_status` | ENUM | NO | CHECK pickup_status IN ('ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'CANCELLED') | 'ASSIGNED' | Dispatch state |
| `created_at` | TIMESTAMP | NO | None | CURRENT_TIMESTAMP | Creation timestamp |

---

### Table 9: `deliveries`
Custody transfer to final recipient organization.

| Column | Data Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `delivery_id` | INT | NO | PRIMARY KEY, AUTO_INCREMENT | None | Unique delivery leg identifier |
| `pickup_id` | INT | NO | FK -> `pickups(pickup_id)` ON DELETE RESTRICT | None | Originating pickup job |
| `allocation_id` | INT | NO | FK -> `donation_allocations(allocation_id)` ON DELETE RESTRICT | None | Associated allocation |
| `delivery_time` | DATETIME | YES | None | NULL | Receipt confirmation timestamp |
| `delivery_status` | ENUM | NO | CHECK delivery_status IN ('PENDING', 'IN_TRANSIT', 'DELIVERED', 'FAILED') | 'PENDING' | Delivery state |
| `delivered_quantity`| DECIMAL(10,2)| NO | CHECK (`delivered_quantity` >= 0) | None | Actual verified quantity handed over |
| `recipient_signature`| VARCHAR(120)| YES | None | NULL | Name/code of receiving officer |
| `created_at` | TIMESTAMP | NO | None | CURRENT_TIMESTAMP | Dispatch record creation |

---

### Table 10: `feedback`
Post-delivery quality rating and verification.

| Column | Data Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `feedback_id` | INT | NO | PRIMARY KEY, AUTO_INCREMENT | None | Unique review ID |
| `delivery_id` | INT | NO | UNIQUE, FK -> `deliveries(delivery_id)` ON DELETE CASCADE | None | One feedback per delivery |
| `rating` | TINYINT | NO | CHECK (`rating` BETWEEN 1 AND 5) | None | 1-5 star assessment |
| `comments` | TEXT | YES | None | NULL | Observations on food hygiene & timeliness |
| `created_at` | TIMESTAMP | NO | None | CURRENT_TIMESTAMP | Submission timestamp |

---

### Table 11: `donation_audit`
Immutable trigger-driven audit log tracking every inventory quantity and status transition.

| Column | Data Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `audit_id` | INT | NO | PRIMARY KEY, AUTO_INCREMENT | None | Unique audit event ID |
| `donation_id` | INT | NO | None | None | Reference donation ID |
| `changed_by` | VARCHAR(100) | NO | None | None | Actor username or process |
| `old_quantity` | DECIMAL(10,2) | YES | None | NULL | Previous remaining quantity |
| `new_quantity` | DECIMAL(10,2) | YES | None | NULL | Updated remaining quantity |
| `old_status` | VARCHAR(50) | YES | None | NULL | Previous lifecycle status |
| `new_status` | VARCHAR(50) | YES | None | NULL | Updated lifecycle status |
| `action_type` | VARCHAR(30) | NO | None | None | INSERT, UPDATE, or DELETE |
| `changed_at` | TIMESTAMP | NO | None | CURRENT_TIMESTAMP | Audit timestamp |

---

### Table 12: `outbox_events`
Transactional outbox table for atomic event propagation to MongoDB.

| Column | Data Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `event_id` | BIGINT | NO | PRIMARY KEY, AUTO_INCREMENT | None | Unique sequential outbox event |
| `aggregate_type` | VARCHAR(50) | NO | None | None | DONATION, REQUEST, ALLOCATION, PICKUP, DELIVERY |
| `aggregate_id` | INT | NO | None | None | Key identifier of entity |
| `event_type` | VARCHAR(80) | NO | None | None | Specific domain event name |
| `payload` | JSON | NO | None | None | Structured event payload |
| `status` | ENUM | NO | CHECK status IN ('PENDING', 'PUBLISHED', 'FAILED') | 'PENDING' | Dispatch status to MongoDB |
| `created_at` | TIMESTAMP | NO | None | CURRENT_TIMESTAMP | Outbox insertion time |
| `processed_at` | DATETIME | YES | None | NULL | Time delivered to MongoDB |
