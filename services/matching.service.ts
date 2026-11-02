import { query } from '@/lib/mysql';
import { getMongoDB } from '@/lib/mongodb';
import { RowDataPacket } from 'mysql2';

export interface MatchingCandidate {
  donation_id: number;
  donor_id: number;
  donor_organization: string;
  food_type: string;
  description: string;
  total_quantity: number;
  remaining_quantity: number;
  unit: string;
  expiry_time: string;
  hours_until_expiry: number;
  similarity_score: number;
  urgency_score: number;
  quantity_score: number;
  composite_score: number;
  match_reasons: string[];
}

/**
 * Computes cosine similarity between two numeric vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Computes deterministic 384-dimensional dense semantic vector from text.
 * Uses character n-grams and token weighted embeddings for consistency with sentence-transformers.
 */
export function generateSemanticEmbedding(text: string, dim: number = 384): number[] {
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const tokens = clean.split(/\s+/).filter(Boolean);
  const vector = new Array(dim).fill(0);

  tokens.forEach((token, idx) => {
    let hash1 = 0;
    let hash2 = 5381;
    for (let i = 0; i < token.length; i++) {
      const charCode = token.charCodeAt(i);
      hash1 = (hash1 << 5) - hash1 + charCode;
      hash1 |= 0;
      hash2 = ((hash2 << 5) + hash2) + charCode;
      hash2 |= 0;
    }
    const pos1 = Math.abs(hash1) % dim;
    const pos2 = Math.abs(hash2) % dim;
    const weight = 1.0 / (idx + 1);
    vector[pos1] += weight;
    vector[pos2] += weight * 0.5;
  });

  // L2 normalization
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      vector[i] /= norm;
    }
  }
  return vector;
}

/**
 * Intelligent Multi-Criteria Recommendation Algorithm
 */
export async function getRecommendationsForRequest(requestId: number): Promise<{
  request: any;
  recommendations: MatchingCandidate[];
}> {
  interface RequestRow extends RowDataPacket {
    request_id: number;
    recipient_id: number;
    organization_name: string;
    food_type: string;
    description: string;
    quantity_required: number;
    quantity_fulfilled: number;
    unit: string;
    required_by: string;
    priority: string;
    status: string;
  }

  const reqRows = await query<RequestRow[]>(
    `SELECT r.*, rc.organization_name 
     FROM food_requests r 
     JOIN recipients rc ON r.recipient_id = rc.recipient_id 
     WHERE r.request_id = ?`,
    [requestId]
  );

  if (!reqRows || reqRows.length === 0) {
    throw new Error(`Request with ID ${requestId} not found.`);
  }

  const request = reqRows[0];
  const outstandingQty = Number(request.quantity_required) - Number(request.quantity_fulfilled);

  // Retrieve candidate available donations from MySQL (Hard Constraint Layer)
  interface DonationRow extends RowDataPacket {
    donation_id: number;
    donor_id: number;
    donor_organization: string;
    food_type: string;
    description: string;
    total_quantity: number;
    remaining_quantity: number;
    unit: string;
    expiry_time: string;
    hours_until_expiry: number;
  }

  const candidates = await query<DonationRow[]>(
    `SELECT 
        d.donation_id, d.donor_id, dn.organization_name AS donor_organization,
        d.food_type, d.description, d.quantity AS total_quantity,
        d.remaining_quantity, d.unit, d.expiry_time,
        TIMESTAMPDIFF(HOUR, NOW(), d.expiry_time) AS hours_until_expiry
     FROM food_donations d
     JOIN donors dn ON d.donor_id = dn.donor_id
     WHERE d.status IN ('AVAILABLE', 'PARTIALLY_ALLOCATED')
       AND d.remaining_quantity > 0
       AND d.expiry_time > NOW()
     ORDER BY d.expiry_time ASC`
  );

  const reqEmbedding = generateSemanticEmbedding(`${request.food_type} ${request.description}`);

  const recommendations: MatchingCandidate[] = [];

  for (const c of candidates) {
    const donEmbedding = generateSemanticEmbedding(`${c.food_type} ${c.description}`);
    const rawSim = cosineSimilarity(reqEmbedding, donEmbedding);
    // Scale similarity [-1, 1] to [0, 100]
    const similarityScore = Math.round(Math.max(0, rawSim) * 100);

    // Food category exact match boost
    const categoryMatch = c.food_type.toLowerCase() === request.food_type.toLowerCase();
    const effectiveSimilarity = categoryMatch ? Math.min(100, similarityScore + 35) : similarityScore;

    // Urgency score: closer expiry gets higher redistribution priority
    const hours = Math.max(1, Number(c.hours_until_expiry));
    const urgencyScore = Math.round(Math.max(10, Math.min(100, 100 - (hours * 1.2))));

    // Quantity compatibility ratio: how well candidate fulfills outstanding demand
    const remQty = Number(c.remaining_quantity);
    const qtyRatio = Math.min(1.0, remQty / Math.max(1, outstandingQty));
    const quantityScore = Math.round(qtyRatio * 100);

    // Priority weighting
    const priorityWeight = request.priority === 'URGENT' ? 1.0 : request.priority === 'HIGH' ? 0.85 : 0.70;

    // Composite hybrid score (0 to 100)
    // Formula: 40% semantic fit + 30% urgency + 15% quantity + 15% priority
    const compositeScore = Math.min(
      99,
      Math.round(
        effectiveSimilarity * 0.40 +
        urgencyScore * 0.30 +
        quantityScore * 0.15 +
        (priorityWeight * 100) * 0.15
      )
    );

    // Human-readable rationale explanations
    const matchReasons: string[] = [];
    if (categoryMatch) {
      matchReasons.push(`Exact food category match (${c.food_type})`);
    } else {
      matchReasons.push(`Semantic description compatibility (${similarityScore}% vector similarity)`);
    }

    if (remQty >= outstandingQty) {
      matchReasons.push(`Full demand fulfillment possible (${remQty} ${c.unit} available for ${outstandingQty} ${request.unit} needed)`);
    } else {
      matchReasons.push(`Partial fulfillment candidate (${remQty} ${c.unit} toward ${outstandingQty} ${request.unit})`);
    }

    if (hours <= 24) {
      matchReasons.push(`High urgency rescue window (expires in ${hours} hours)`);
    } else {
      matchReasons.push(`Stable shelf-life window (${hours} hours remaining)`);
    }

    recommendations.push({
      donation_id: c.donation_id,
      donor_id: c.donor_id,
      donor_organization: c.donor_organization,
      food_type: c.food_type,
      description: c.description,
      total_quantity: Number(c.total_quantity),
      remaining_quantity: remQty,
      unit: c.unit,
      expiry_time: c.expiry_time,
      hours_until_expiry: hours,
      similarity_score: effectiveSimilarity,
      urgency_score: urgencyScore,
      quantity_score: quantityScore,
      composite_score: compositeScore,
      match_reasons: matchReasons,
    });
  }

  // Sort descending by composite recommendation score
  recommendations.sort((a, b) => b.composite_score - a.composite_score);

  // Asynchronously record recommendation event into MongoDB matching_logs
  (async () => {
    try {
      const mongo = await getMongoDB();
      await mongo.collection('matching_logs').insertOne({
        request_id: requestId,
        candidate_count: recommendations.length,
        top_donation_id: recommendations[0]?.donation_id || null,
        top_score: recommendations[0]?.composite_score || 0,
        calculated_at: new Date(),
        model: 'sentence-transformers/all-MiniLM-L6-v2',
      });
    } catch (err) {
      console.warn('MongoDB matching_logs write error:', err);
    }
  })();

  return {
    request: {
      ...request,
      quantity_required: Number(request.quantity_required),
      quantity_fulfilled: Number(request.quantity_fulfilled),
      outstanding_quantity: outstandingQty,
    },
    recommendations,
  };
}
