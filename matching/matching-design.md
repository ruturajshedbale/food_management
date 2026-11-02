# Intelligent Food Matching Architecture
## Semantic Embeddings & Multi-Criteria Constraint Filtering

### 1. Mathematical Formulation & Matching Objective
Food surplus redistribution requires dynamic compatibility beyond exact keyword matching. For example, a restaurant surplus tagged *"Fresh vegetable biryani with spiced lentils and salad"* should match a community shelter requisition for *"Cooked vegetarian warm lunch portions"*, despite having zero overlapping words.

The intelligent matching engine computes a composite **Recommendation Score $S \in [0, 100]$**:

$$S = w_s \cdot S_{\text{semantic}} + w_e \cdot S_{\text{urgency}} + w_q \cdot S_{\text{quantity}} + w_p \cdot S_{\text{priority}}$$

Where:
- $S_{\text{semantic}} = \cos(\vec{u}_{\text{donation}}, \vec{v}_{\text{request}}) = \frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\|_2 \|\vec{v}\|_2} \in [-1, 1]$
- $S_{\text{urgency}}$: Expiry window score ($1 - \frac{\text{Hours until expiry}}{\text{Max safe shelf life window}}$).
- $S_{\text{quantity}}$: Fulfillment capability ratio $\min\left(1.0, \frac{Q_{\text{donation\_remaining}}}{Q_{\text{request\_outstanding}}}\right)$.
- $S_{\text{priority}}$: Multiplier according to priority tier (`URGENT` = 1.0, `HIGH` = 0.85, `MEDIUM` = 0.70, `LOW` = 0.50).
- Normalization weights: $w_s = 0.40, w_e = 0.30, w_q = 0.15, w_p = 0.15$ ($\sum w = 1.0$).

---

### 2. Dual-Layer Filtering Pipeline

1. **Layer 1: Hard Constraints in Relational MySQL**
   - Donation `status IN ('AVAILABLE', 'PARTIALLY_ALLOCATED')`.
   - `food_donations.remaining_quantity > 0`.
   - `food_donations.expiry_time > NOW()`.
   - `food_requests.status IN ('PENDING', 'PARTIALLY_FULFILLED')`.

2. **Layer 2: High-Dimensional Semantic Similarity**
   - 384-dimensional dense vectors generated via `all-MiniLM-L6-v2` or Gemini Embeddings (`text-embedding-004`).
   - Vectors stored in MongoDB `matching_logs` collection.
   - Cosine similarity calculated in application memory for instantaneous scoring.

3. **Layer 3: ACID Allocation Execution**
   - User or admin confirms recommendation $\rightarrow$ MySQL stored procedure `allocate_food` executes inside an atomic transaction with row locking (`SELECT ... FOR UPDATE`), preventing race conditions.
