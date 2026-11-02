# Smart Food Rescue & Redistribution Intelligence System
## System Architecture & Requirements Specification (Phase 1)

### 1. Executive Abstract
The **Smart Food Rescue & Redistribution Intelligence System** is an enterprise-grade academic DBMS and distributed software platform designed to eliminate perishable food wastage and accelerate distribution to food-insecure populations. The architecture bridges four distinct ecosystem stakeholders:
1. **Donors** (restaurants, corporate cafeterias, hotels, banquet halls, supermarkets)
2. **Recipients / Beneficiary NGOs** (homeless shelters, community soup kitchens, orphanages, disaster relief hubs)
3. **Volunteers** (certified rescue dispatchers, refrigerated van/two-wheeler drivers, delivery agents)
4. **Platform Administrators** (audit controllers, quality inspectors, system operators)

The system enforces strict **ACID transactions** in a relational database (**MySQL 8.0+ / MariaDB 10.11 InnoDB**) as the immutable source of truth for business states, user credentials, role permissions, allocations, deliveries, and auditing, complemented by **MongoDB** for high-velocity operational telemetry, activity streams, real-time status transitions, condition logs, and high-dimensional semantic embeddings.

---

### 2. Polyglot Persistence Architecture & Data Ownership

| Architectural Responsibility | Database Engine | Rationale & Mechanism |
| :--- | :--- | :--- |
| **Authoritative Business Ledger** | **MySQL 8.0+ (InnoDB)** | Relational integrity, foreign key cascading constraints, strict CHECK rules, ACID atomic transactions (`START TRANSACTION`, `SELECT ... FOR UPDATE`, `COMMIT`/`ROLLBACK`), stored procedures, triggers, views, and deterministic locking order. |
| **Operational Activity & Event Stream** | **MongoDB (food_rescue_logs)** | High write throughput, schema-agnostic condition telemetry (e.g. food temperature, packaging photos, courier notes), inspection logs, audit log archival, aggregation pipeline analytics. |
| **Reliable Dual-Write Coordination** | **Transactional Outbox Pattern** | MySQL writes the transactional business change and commits an event to the `outbox_events` table in the SAME transaction. An asynchronous event worker ingests from the outbox and idempotently pushes to MongoDB collections (`donation_events`, `pickup_events`, `delivery_events`, `notification_logs`). This guarantees zero split-brain and no lost events. |
| **Semantic Matching & Recommendation** | **Vector Embeddings + Cosine Similarity** | Computes 384-dimensional dense semantic representations of donation surplus items and recipient food requests, indexed in MongoDB and scored using application-level cosine similarity combined with rule-based MySQL constraint filters (expiry window, quantity, distance, dietary criteria). |

---

### 3. Detailed End-to-End System Architecture

```
                  +-------------------------------------------------------------+
                  |                     Client Browser Layer                    |
                  |  Next.js 15 App Router | React 19 | Tailwind CSS | Recharts |
                  +-------------------------------------------------------------+
                                                 |
                                         HTTPS / REST APIs
                                                 |
                                                 v
                  +-------------------------------------------------------------+
                  |               Next.js Server API & Auth Layer               |
                  |  - Session-based HTTP-only Cookie Auth (JWT/HMAC)           |
                  |  - Role-Based Access Control (Admin, Donor, Recip, Vol)     |
                  |  - Zod Request Schema Validation                            |
                  |  - Rate-Limiting & SQL Injection Sanitization               |
                  +-------------------------------------------------------------+
                          |                                     |
                          | (Authoritative Transactions)        | (Event Stream / Embeddings)
                          v                                     v
+--------------------------------------------+    +--------------------------------------------+
|         MySQL 8.0+ / MariaDB Engine        |    |            MongoDB Engine 7.0+             |
| Database: `food_rescue_db`                 |    | Database: `food_rescue_logs`               |
| Engine: InnoDB                             |    | Engine: WiredTiger                         |
|--------------------------------------------|    |--------------------------------------------|
| Tables:                                    |    | Collections:                               |
| - `users` (RBAC accounts, bcrypt hashes)   |    | - `donation_events` (lifecycle logs)       |
| - `donors` (profile, address, tax ID)      |    | - `pickup_events` (dispatch milestones)    |
| - `recipients` (NGO capacity, address)     |    | - `delivery_events` (dropoff signatures)   |
| - `volunteers` (vehicle, availability)     |    | - `food_condition_logs` (temp, hygiene)    |
| - `food_donations` (surplus inventory)     |    | - `notification_logs` (alert history)      |
| - `food_requests` (unmet demand & priority)|    | - `matching_logs` & embeddings cache       |
| - `donation_allocations` (M:N resolve)     |    +--------------------------------------------+
| - `pickups` (logistics scheduling)         |                          ^
| - `deliveries` (custody verification)      |                          | (Async / Idempotent)
| - `feedback` (5-star rating, review)       |                          |
| - `donation_audit` (trigger-driven audit)  |              +------------------------+
| - `outbox_events` (transactional outbox)   | -----------> | Transactional Outbox   |
+--------------------------------------------+              | Event Dispatch Worker  |
                                                            +------------------------+
```

---

### 4. Functional Requirements

#### 4.1 Donor Subsystem
- **FR-DN-01**: Secure registration and profile management with enterprise classification (Restaurant, Hotel, Caterer, Supermarket, Event Organizer).
- **FR-DN-02**: Surplus food declaration including item categorization, quantity, unit (kg, meals, packages), preparation timestamp, expiration timestamp, storage specifications (ambient, refrigerated, frozen), and dietary classification (Vegetarian, Non-Veg, Vegan, Halal).
- **FR-DN-03**: Live donation lifecycle tracking (`AVAILABLE` -> `PARTIALLY_ALLOCATED` -> `FULLY_ALLOCATED` -> `COMPLETED`).
- **FR-DN-04**: Real-time pickup scheduling visibility and volunteer identity verification.

#### 4.2 Recipient (NGO / Community) Subsystem
- **FR-RC-01**: NGO registration with intake capacity constraints, refrigeration storage capacity, and dietary preferences.
- **FR-RC-02**: Food requisition creation with required-by deadlines, headcount targets, priority tiers (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), and recurring requirements.
- **FR-RC-03**: Intelligent recommendation feed presenting candidate donations ranked by semantic fit, geographical feasibility, remaining shelf-life, and quantity match.
- **FR-RC-04**: Multi-part fulfillment tracking and post-delivery quality inspection feedback.

#### 4.3 Volunteer Logistics Subsystem
- **FR-VL-01**: Driver registration with vehicle fleet specification (Bicycle, Motorcycle, Car, Van, Refrigerated Van).
- **FR-VL-02**: Real-time dispatch feed showing nearby pickup and delivery assignments with one-click Accept/Decline.
- **FR-VL-03**: Pickup verification: record actual collected quantity, condition check (acceptable/damaged), and departure timestamp.
- **FR-VL-04**: Delivery execution: capture recipient contact signature, record delivered quantity, and log delivery milestone.

#### 4.4 Administrator & Audit Subsystem
- **FR-AD-01**: Real-time command dashboard showing ecosystem metrics (food rescued in kg/meals, CO2 emissions averted, active logistics routes, wastage averted rate).
- **FR-AD-02**: Complete audit trails linking donors, volunteers, recipients, allocation transactions, and outbox event logs.
- **FR-AD-03**: Database diagnostics: EXPLAIN ANALYZE query monitoring, index utilization reviews, and dead-letter event monitoring.

---

### 5. Non-Functional & Security Requirements

1. **ACID Guarantees**: All donation allocation and quantity decrement operations must run inside atomic transactions with `FOR UPDATE` pessimistic row locking. Zero negative balances or double-allocations permitted.
2. **Data Consistency**: The transactional outbox pattern guarantees eventual consistency between MySQL and MongoDB within < 500ms without two-phase commit overhead.
3. **Security & Cryptography**: Passwords hashed using `bcrypt` (cost factor 10). Session tokens stored in Secure HTTP-only SameSite cookies. Server-side role authorization enforced on every single endpoint. Parameterized queries used everywhere to eliminate SQL injection.
4. **Performance Targets**: Read queries for dashboards must execute in under 15ms via covering B-Tree indexes. Intelligent matching search evaluates up to 100 candidate items in < 50ms.
