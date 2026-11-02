import { query } from '@/lib/mysql';
import { processOutboxEvents } from '@/lib/outbox';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface DonationInput {
  donor_id: number;
  food_type: string;
  description: string;
  quantity: number;
  unit: string;
  prepared_time: string;
  expiry_time: string;
}

export async function createDonation(input: DonationInput): Promise<number> {
  const result = await query<ResultSetHeader>(
    `INSERT INTO food_donations 
     (donor_id, food_type, description, quantity, remaining_quantity, unit, prepared_time, expiry_time, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE', NOW())`,
    [
      input.donor_id,
      input.food_type,
      input.description,
      input.quantity,
      input.quantity,
      input.unit || 'kg',
      input.prepared_time,
      input.expiry_time,
    ]
  );

  const donationId = result.insertId;
  // Trigger trg_after_donation_insert automatically adds audit and outbox entry
  processOutboxEvents().catch(err => console.warn('Outbox sync error:', err));
  return donationId;
}

export async function listDonations(filter?: { donor_id?: number; status?: string; available_only?: boolean }) {
  if (filter?.available_only) {
    return await query(`SELECT * FROM available_donations_view ORDER BY expiry_time ASC`);
  }

  let sql = `
    SELECT 
      d.*,
      dn.organization_name AS donor_organization,
      dn.contact_person AS donor_contact,
      dn.address AS donor_address,
      dn.donor_type,
      TIMESTAMPDIFF(HOUR, NOW(), d.expiry_time) AS hours_until_expiry
    FROM food_donations d
    JOIN donors dn ON d.donor_id = dn.donor_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filter?.donor_id) {
    sql += ' AND d.donor_id = ?';
    params.push(filter.donor_id);
  }
  if (filter?.status) {
    sql += ' AND d.status = ?';
    params.push(filter.status);
  }

  sql += ' ORDER BY d.created_at DESC';
  return await query(sql, params);
}

export async function getDonationById(id: number) {
  const rows = await query<RowDataPacket[]>(
    `SELECT 
        d.*,
        dn.organization_name AS donor_organization,
        dn.contact_person AS donor_contact,
        dn.address AS donor_address,
        dn.donor_type,
        TIMESTAMPDIFF(HOUR, NOW(), d.expiry_time) AS hours_until_expiry
     FROM food_donations d
     JOIN donors dn ON d.donor_id = dn.donor_id
     WHERE d.donation_id = ?`,
    [id]
  );
  return rows[0] || null;
}

export async function updateDonation(id: number, donorId: number, fields: { description?: string; expiry_time?: string }) {
  const updates: string[] = [];
  const params: any[] = [];

  if (fields.description) {
    updates.push('description = ?');
    params.push(fields.description);
  }
  if (fields.expiry_time) {
    updates.push('expiry_time = ?');
    params.push(fields.expiry_time);
  }

  if (updates.length === 0) return false;

  params.push(id, donorId);
  const res = await query<ResultSetHeader>(
    `UPDATE food_donations SET ${updates.join(', ')} WHERE donation_id = ? AND donor_id = ?`,
    params
  );
  return res.affectedRows > 0;
}

export async function cancelDonation(id: number, donorId: number) {
  const res = await query<ResultSetHeader>(
    `UPDATE food_donations 
     SET status = 'CANCELLED' 
     WHERE donation_id = ? AND donor_id = ? AND status = 'AVAILABLE'`,
    [id, donorId]
  );
  return res.affectedRows > 0;
}
