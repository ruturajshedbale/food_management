import { query } from '@/lib/mysql';
import { processOutboxEvents } from '@/lib/outbox';
import { RowDataPacket } from 'mysql2';

export interface AllocationResult {
  success: boolean;
  allocation_id: number;
  message: string;
}

export async function createAllocation(
  donationId: number,
  requestId: number,
  quantity: number,
  actorId: number
): Promise<AllocationResult> {
  // Execute MySQL stored procedure with pessimistic locking and ACID guarantee
  await query('SET @v_alloc_id = 0, @v_msg = ""');
  await query(
    'CALL allocate_food(?, ?, ?, ?, @v_alloc_id, @v_msg)',
    [donationId, requestId, quantity, actorId]
  );

  interface ProcOutput extends RowDataPacket {
    allocated_id: number;
    allocation_result: string;
  }

  const resultRows = await query<ProcOutput[]>(
    'SELECT @v_alloc_id AS allocated_id, @v_msg AS allocation_result'
  );

  const allocId = Number(resultRows[0]?.allocated_id || 0);
  const msg = resultRows[0]?.allocation_result || '';

  if (allocId > 0) {
    // Process outbox asynchronously to ensure MongoDB stays up-to-date
    processOutboxEvents().catch(err => console.warn('Outbox process err:', err));
    return {
      success: true,
      allocation_id: allocId,
      message: msg,
    };
  } else {
    return {
      success: false,
      allocation_id: 0,
      message: msg || 'Failed to allocate food donation.',
    };
  }
}

export async function cancelAllocation(
  allocationId: number,
  actorId: number
): Promise<{ success: boolean; message: string }> {
  await query('SET @v_msg = ""');
  await query('CALL cancel_allocation(?, ?, @v_msg)', [allocationId, actorId]);

  interface ProcOutput extends RowDataPacket {
    msg: string;
  }
  const rows = await query<ProcOutput[]>('SELECT @v_msg AS msg');
  const msg = rows[0]?.msg || '';

  const success = msg.startsWith('SUCCESS');
  if (success) {
    processOutboxEvents().catch(err => console.warn('Outbox process err:', err));
  }

  return { success, message: msg };
}

export async function listAllocations(filter?: { donor_id?: number; recipient_id?: number; status?: string }) {
  let sql = `
    SELECT 
      a.allocation_id,
      a.donation_id,
      a.request_id,
      a.allocated_quantity,
      a.allocation_time,
      a.status AS allocation_status,
      d.food_type,
      d.unit,
      dn.donor_id,
      dn.organization_name AS donor_organization,
      dn.address AS donor_address,
      rc.recipient_id,
      rc.organization_name AS recipient_organization,
      rc.address AS recipient_address,
      del.delivery_id,
      del.delivery_status,
      del.delivered_quantity,
      p.pickup_id,
      p.pickup_status,
      v.volunteer_id,
      vu.name AS volunteer_name
    FROM donation_allocations a
    JOIN food_donations d ON a.donation_id = d.donation_id
    JOIN donors dn ON d.donor_id = dn.donor_id
    JOIN food_requests r ON a.request_id = r.request_id
    JOIN recipients rc ON r.recipient_id = rc.recipient_id
    LEFT JOIN deliveries del ON a.allocation_id = del.allocation_id
    LEFT JOIN pickups p ON del.pickup_id = p.pickup_id
    LEFT JOIN volunteers v ON p.volunteer_id = v.volunteer_id
    LEFT JOIN users vu ON v.user_id = vu.user_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filter?.donor_id) {
    sql += ' AND dn.donor_id = ?';
    params.push(filter.donor_id);
  }
  if (filter?.recipient_id) {
    sql += ' AND rc.recipient_id = ?';
    params.push(filter.recipient_id);
  }
  if (filter?.status) {
    sql += ' AND a.status = ?';
    params.push(filter.status);
  }

  sql += ' ORDER BY a.allocation_time DESC';
  return await query(sql, params);
}
