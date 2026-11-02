import { query } from '@/lib/mysql';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface RequestInput {
  recipient_id: number;
  food_type: string;
  description: string;
  quantity_required: number;
  unit: string;
  required_by: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export async function createRequest(input: RequestInput): Promise<number> {
  const result = await query<ResultSetHeader>(
    `INSERT INTO food_requests
     (recipient_id, food_type, description, quantity_required, quantity_fulfilled, unit, required_by, priority, status, created_at)
     VALUES (?, ?, ?, ?, 0.00, ?, ?, ?, 'PENDING', NOW())`,
    [
      input.recipient_id,
      input.food_type,
      input.description,
      input.quantity_required,
      input.unit || 'kg',
      input.required_by,
      input.priority || 'MEDIUM',
    ]
  );
  return result.insertId;
}

export async function listRequests(filter?: { recipient_id?: number; status?: string; pending_only?: boolean }) {
  if (filter?.pending_only) {
    return await query(`SELECT * FROM pending_requests_view ORDER BY hours_until_required ASC`);
  }

  let sql = `
    SELECT 
      r.*,
      rc.organization_name AS recipient_organization,
      rc.contact_person AS recipient_contact,
      rc.address AS delivery_address,
      rc.capacity,
      (r.quantity_required - r.quantity_fulfilled) AS quantity_outstanding,
      TIMESTAMPDIFF(HOUR, NOW(), r.required_by) AS hours_until_required
    FROM food_requests r
    JOIN recipients rc ON r.recipient_id = rc.recipient_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filter?.recipient_id) {
    sql += ' AND r.recipient_id = ?';
    params.push(filter.recipient_id);
  }
  if (filter?.status) {
    sql += ' AND r.status = ?';
    params.push(filter.status);
  }

  sql += ' ORDER BY r.created_at DESC';
  return await query(sql, params);
}

export async function getRequestById(id: number) {
  const rows = await query<RowDataPacket[]>(
    `SELECT 
        r.*,
        rc.organization_name AS recipient_organization,
        rc.contact_person AS recipient_contact,
        rc.address AS delivery_address,
        rc.capacity,
        (r.quantity_required - r.quantity_fulfilled) AS quantity_outstanding,
        TIMESTAMPDIFF(HOUR, NOW(), r.required_by) AS hours_until_required
     FROM food_requests r
     JOIN recipients rc ON r.recipient_id = rc.recipient_id
     WHERE r.request_id = ?`,
    [id]
  );
  return rows[0] || null;
}

export async function cancelRequest(id: number, recipientId: number) {
  const res = await query<ResultSetHeader>(
    `UPDATE food_requests 
     SET status = 'CANCELLED' 
     WHERE request_id = ? AND recipient_id = ? AND status = 'PENDING'`,
    [id, recipientId]
  );
  return res.affectedRows > 0;
}
