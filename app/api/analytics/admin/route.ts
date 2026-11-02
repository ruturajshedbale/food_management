import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    // 1. Overall ecosystem KPI metrics from redistribution_analytics_view
    const kpiRows = await query<RowDataPacket[]>('SELECT * FROM redistribution_analytics_view');
    const kpis = kpiRows[0] || {};

    // 2. Food category distribution
    const categoryRows = await query<RowDataPacket[]>(
      `SELECT 
          d.food_type, 
          COUNT(d.donation_id) AS count, 
          SUM(d.quantity) AS total_kg,
          ROUND(SUM(d.quantity) / (SELECT SUM(quantity) FROM food_donations) * 100, 1) AS percentage
       FROM food_donations d
       GROUP BY d.food_type
       ORDER BY total_kg DESC`
    );

    // 3. Monthly redistribution history
    const monthlyRows = await query<RowDataPacket[]>(
      `SELECT 
          DATE_FORMAT(del.delivery_time, '%b %Y') AS month,
          COUNT(del.delivery_id) AS deliveries,
          COALESCE(SUM(del.delivered_quantity), 0) AS total_kg
       FROM deliveries del
       WHERE del.delivery_status = 'DELIVERED'
       GROUP BY DATE_FORMAT(del.delivery_time, '%b %Y'), DATE_FORMAT(del.delivery_time, '%Y-%m')
       ORDER BY DATE_FORMAT(del.delivery_time, '%Y-%m') ASC`
    );

    // 4. Recent audit activity trail
    const auditRows = await query<RowDataPacket[]>(
      `SELECT a.*, d.food_type
       FROM donation_audit a
       LEFT JOIN food_donations d ON a.donation_id = d.donation_id
       ORDER BY a.changed_at DESC
       LIMIT 10`
    );

    // 5. Donor leaderboard
    const donorLeaderboard = await query<RowDataPacket[]>(
      `SELECT * FROM donation_summary_view ORDER BY total_quantity_declared_kg DESC LIMIT 5`
    );

    // 6. Volunteer performance scorecard
    const volunteerScorecard = await query<RowDataPacket[]>(
      `SELECT * FROM volunteer_performance_view ORDER BY total_kg_delivered DESC LIMIT 5`
    );

    return NextResponse.json({
      success: true,
      kpis,
      categoryDistribution: categoryRows,
      monthlyRedistribution: monthlyRows,
      auditTrail: auditRows,
      donorLeaderboard,
      volunteerScorecard,
    });
  } catch (err: any) {
    console.error('Admin analytics error:', err);
    return NextResponse.json({ error: 'Failed to retrieve admin analytics' }, { status: 500 });
  }
}
