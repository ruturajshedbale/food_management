# Smart Food Rescue & Redistribution Intelligence System
## Production-Grade Academic DBMS & Distributed Full-Stack Platform

A centralized, enterprise-grade food rescue and redistribution platform connecting surplus food providers (hotels, restaurants, cafeterias, supermarkets) with beneficiary community organizations (shelters, soup kitchens, orphanages) via certified volunteer courier dispatch.

---

### Key Architectural Highlights
- **Authoritative Relational Database (MySQL 8.0+ / MariaDB 10.11 InnoDB)**:
  - Enforces strict BCNF normalization across 12 relational tables.
  - ACID atomic transactions with pessimistic row-level locking (`SELECT ... FOR UPDATE`) in stored procedure `allocate_food`, completely preventing race conditions and over-allocation.
  - Foreign key cascades, check constraints, composite unique constraints.
  - 5 high-performance analytical views (`redistribution_analytics_view`, `available_donations_view`, `pending_requests_view`, `donation_summary_view`, `volunteer_performance_view`).
  - Triggers for automated audit logging (`donation_audit`) and delivery quantity validation.
  - Covering B-Tree indexes with verified `EXPLAIN` query execution plans.
- **NoSQL Telemetry Database (MongoDB 7.0+ WiredTiger)**:
  - High write throughput for semi-structured food inspection reports (temperatures, hygiene, seal integrity).
  - Outbox event log persistence (`donation_events`, `pickup_events`, `delivery_events`, `notification_logs`).
  - 384-dimensional dense semantic vector cache in `matching_logs`.
- **Reliable Dual-Write Outbox Pattern**:
  - MySQL atomic transaction commits business state and writes an outbox row into `outbox_events`.
  - Asynchronous event dispatcher idempotently pushes events into MongoDB collections with guaranteed zero split-brain and no lost updates.
- **Intelligent Semantic Matching Engine**:
  - 384-dimensional dense embeddings with cosine similarity.
  - Multi-criteria hybrid recommendation formula: 40% semantic fit + 30% expiry urgency + 15% quantity match ratio + 15% request priority tier.

---

### Local Environment Setup & Execution

#### 1. System Requirements & Database Engines
Ensure Node.js v20+, MySQL 8.0+ (or MariaDB 10.11+), and MongoDB are available.

```bash
# Start MySQL / MariaDB service
service mariadb start
# or: sudo systemctl start mysql

# Configure Database User and Permissions
mysql -u root -e "CREATE USER IF NOT EXISTS 'food_user'@'%' IDENTIFIED BY 'food_rescue_secure_pass_2026'; GRANT ALL PRIVILEGES ON *.* TO 'food_user'@'%' WITH GRANT OPTION; FLUSH PRIVILEGES;"
```

#### 2. Initialize MySQL Database & Tables
Execute the complete sequence of SQL scripts:

```bash
# 1. Database Creation
mysql -u root < database/01_create_database.sql

# 2. DDL Table Creation (12 Tables)
mysql -u root < database/02_create_tables.sql

# 3. Integrity Constraints Verification
mysql -u root < database/03_constraints.sql

# 4. Realistic Seed Data
mysql -u root < database/04_seed_data.sql

# 5. Database Views
mysql -u root < database/06_views.sql

# 6. ACID Stored Procedures
mysql -u root < database/07_procedures.sql

# 7. Triggers for Automated Auditing
mysql -u root < database/08_triggers.sql

# 8. Covering Indexes & Query Plan
mysql -u root < database/09_indexes.sql

# 9. Automated Boundary & Test Verification
mysql -u root < database/10_test_cases.sql
```

#### 3. Initialize MongoDB Collections & Indexes
```bash
node mongodb/collections.js
node mongodb/indexes.js
```

#### 4. Run Automated Unit & Integration Tests
```bash
npx tsx --test tests/food_rescue_system.test.ts
```

#### 5. Launch the Local Web Application
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

### Pre-Configured Demo Accounts (Password: `Password123!`)

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **ADMIN** | System Administrator | `admin@foodrescue.org` | `Password123!` |
| **DONOR** | Grand Metropolitan Hotel | `chef.marcus@grandmetro.com` | `Password123!` |
| **RECIPIENT** | Hope Harbor Community Kitchen | `director@hopeharbor.org` | `Password123!` |
| **VOLUNTEER** | David Miller (Van Logistics) | `david.courier@rescuevolunteers.net` | `Password123!` |

*Tip: You can switch between roles with 1-click using the role switcher buttons in the top navigation bar!*

---

### Project Structure
```
├── database/
│   ├── 01_create_database.sql       # Database creation & collation (utf8mb4)
│   ├── 02_create_tables.sql         # 12 Normalized InnoDB tables (BCNF)
│   ├── 03_constraints.sql           # Foreign keys and check constraints
│   ├── 04_seed_data.sql             # Realistic multi-role sample data
│   ├── 05_queries.sql               # 20 Analytical DBMS queries (joins, window functions)
│   ├── 06_views.sql                 # 5 High-performance views
│   ├── 07_procedures.sql            # ACID Stored Procedures (allocate_food, etc.)
│   ├── 08_triggers.sql              # Triggers for donation auditing & outbox sync
│   ├── 09_indexes.sql               # B-Tree covering indexes with EXPLAIN plans
│   └── 10_test_cases.sql            # Automated SQL boundary & rollback verification
├── mongodb/
│   ├── collections.js               # MongoDB collection bootstrapper
│   ├── indexes.js                   # Compound & single-field index creator
│   └── aggregations.js              # Multi-stage aggregation pipelines
├── matching/
│   ├── embedding-service.py         # Python vector generator (all-MiniLM-L6-v2)
│   └── matching-design.md           # Multi-criteria recommendation math formulation
├── documentation/
│   ├── 01_architecture_and_requirements.md
│   ├── 02_er_diagram_and_relational_schema.md
│   ├── 03_data_dictionary.md
│   └── 04_normalization_analysis.md
├── tests/
│   └── food_rescue_system.test.ts   # Node.js automated test suite
├── app/                             # Next.js 15 App Router pages & API routes
├── components/                      # Dashboards (Admin, Donor, Recipient, Volunteer, Matching, SQL Studio)
├── lib/                             # Database clients (mysql2 pool, mongodb driver, auth, outbox)
└── services/                        # Business logic & recommendation engine
```
