# Academic Normalization Analysis (Phase 2)
## Smart Food Rescue & Redistribution Intelligence System

### 1. Objective of Normalization
In relational database design, normalization systematically decomposes relations to minimize data redundancy and eliminate **insertion anomalies**, **update anomalies**, and **deletion anomalies** while preserving functional dependencies and lossless join decomposition.

---

### 2. Normalization Progression

#### 2.1 First Normal Form (1NF)
**Requirements:**
1. All attributes contain only atomic (indivisible) values.
2. No repeating groups or arrays stored in single attributes.
3. Each record is uniquely identifiable by a Primary Key.

**Compliance in `food_rescue_db`:**
- In naive designs, a donation might store a list of allocated recipient requests as a comma-separated string `recipient_ids = "3, 5, 12"`.
- In our design, every attribute is strictly scalar. Quantities are atomic `DECIMAL(10,2)` values.
- M:N interactions are decomposed into the first-class associative table `donation_allocations`, where each row represents exactly one allocation tuple `(allocation_id, donation_id, request_id, allocated_quantity)`.
- Hence, the schema strictly satisfies **1NF**.

#### 2.2 Second Normal Form (2NF)
**Requirements:**
1. The relation is in 1NF.
2. Every non-prime attribute is fully functionally dependent on the entire primary key (no partial functional dependencies on composite keys).

**Compliance in `food_rescue_db`:**
- Consider the associative entity `donation_allocations`. If composite key `(donation_id, request_id)` were used alongside attributes such as `donor_address` or `recipient_capacity`, those would exhibit partial dependency (`donation_id -> donor_address`, which depends only on part of the composite key).
- In our normalized schema, `donation_allocations` holds its own surrogate primary key `allocation_id`, and its non-key attributes (`allocated_quantity`, `allocation_time`, `status`) depend strictly and fully on `allocation_id`.
- Donor details reside exclusively in `donors`, recipient capacity resides exclusively in `recipients`. No partial dependency exists in any table.
- Hence, the schema strictly satisfies **2NF**.

#### 2.3 Third Normal Form (3NF)
**Requirements:**
1. The relation is in 2NF.
2. There are no transitive functional dependencies ($X \rightarrow Y$ where $Y$ is non-prime and $Y \rightarrow Z$).

**Compliance in `food_rescue_db`:**
- Consider `food_donations`:
  - `donation_id -> donor_id`
  - In an unnormalized design, one might include `donor_organization_name` in `food_donations`. That would establish a transitive dependency:
    $$\text{donation\_id} \rightarrow \text{donor\_id} \rightarrow \text{organization\_name}$$
  - An update to the organization name would require updating all past donation rows (Update Anomaly).
  - In our schema, `food_donations` contains only `donor_id` as a foreign key. `organization_name` is stored exclusively in `donors`.
  - Similarly, `users` maintains authentication credentials, while role-specific details are partitioned into `donors`, `recipients`, and `volunteers` with 1:1 foreign keys on `user_id`.
- For every non-trivial functional dependency $X \rightarrow A$, either $X$ is a superkey or $A$ is a prime attribute.
- Hence, the schema strictly satisfies **3NF**.

#### 2.4 Boyce-Codd Normal Form (BCNF)
**Requirements:**
1. The relation is in 3NF.
2. For every functional dependency $X \rightarrow Y$, $X$ must be a superkey (i.e. strictly determines a unique row).

**Evaluation:**
- Look at `feedback`: candidate keys are `{feedback_id}` and `{delivery_id}`.
  - $\text{feedback\_id} \rightarrow \text{delivery\_id, rating, comments, created\_at}$ (superkey)
  - $\text{delivery\_id} \rightarrow \text{feedback\_id, rating, comments, created\_at}$ (superkey, because `delivery_id` is defined UNIQUE)
  - Since both determinants are superkeys, no violation of BCNF exists.
- In `users`, `donors`, `recipients`, and `volunteers`, all determinants are either the primary key or unique alternate keys (`email`, `user_id`).
- Hence, all relations are in **Boyce-Codd Normal Form (BCNF)**.

---

### 3. Summary of Functional Dependencies
- `users`: `user_id` $\rightarrow$ {`name`, `email`, `password_hash`, `phone`, `role`, `status`, `created_at`}; `email` $\rightarrow$ {`user_id`, ...}
- `donors`: `donor_id` $\rightarrow$ {`user_id`, `organization_name`, `contact_person`, `address`, `donor_type`}; `user_id` $\rightarrow$ `donor_id`
- `recipients`: `recipient_id` $\rightarrow$ {`user_id`, `organization_name`, `contact_person`, `address`, `capacity`}; `user_id` $\rightarrow$ `recipient_id`
- `volunteers`: `volunteer_id` $\rightarrow$ {`user_id`, `vehicle_type`, `availability`}; `user_id` $\rightarrow$ `volunteer_id`
- `food_donations`: `donation_id` $\rightarrow$ {`donor_id`, `food_type`, `description`, `quantity`, `remaining_quantity`, `unit`, `prepared_time`, `expiry_time`, `status`, `created_at`}
- `food_requests`: `request_id` $\rightarrow$ {`recipient_id`, `food_type`, `description`, `quantity_required`, `quantity_fulfilled`, `unit`, `required_by`, `priority`, `status`, `created_at`}
- `donation_allocations`: `allocation_id` $\rightarrow$ {`donation_id`, `request_id`, `allocated_quantity`, `allocation_time`, `status`}
- `pickups`: `pickup_id` $\rightarrow$ {`donation_id`, `volunteer_id`, `scheduled_time`, `pickup_time`, `pickup_status`, `created_at`}
- `deliveries`: `delivery_id` $\rightarrow$ {`pickup_id`, `allocation_id`, `delivery_time`, `delivery_status`, `delivered_quantity`, `recipient_signature`, `created_at`}
- `feedback`: `feedback_id` $\rightarrow$ {`delivery_id`, `rating`, `comments`, `created_at`}; `delivery_id` $\rightarrow$ {`feedback_id`, `rating`, `comments`, `created_at`}
- `outbox_events`: `event_id` $\rightarrow$ {`aggregate_type`, `aggregate_id`, `event_type`, `payload`, `status`, `created_at`, `processed_at`}
