import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/mysql';

export async function POST(req: NextRequest) {
  try {
    const { sql_statement, explain } = await req.json();
    if (!sql_statement || typeof sql_statement !== 'string') {
      return NextResponse.json({ error: 'sql_statement is required' }, { status: 400 });
    }

    const trimmed = sql_statement.trim();
    // Safety check: allow SELECT, EXPLAIN, SHOW, DESCRIBE
    const isSafeRead = /^(SELECT|EXPLAIN|SHOW|DESCRIBE|WITH)\b/i.test(trimmed);
    if (!isSafeRead) {
      return NextResponse.json({ error: 'Security restriction: Only SELECT, EXPLAIN, SHOW, and DESCRIBE queries are permitted in the interactive DBMS console.' }, { status: 400 });
    }

    const startTime = performance.now();
    const finalSql = explain ? `EXPLAIN ${trimmed}` : trimmed;
    const result = await query(finalSql);
    const executionMs = Math.round((performance.now() - startTime) * 100) / 100;

    return NextResponse.json({
      success: true,
      execution_time_ms: executionMs,
      row_count: Array.isArray(result) ? result.length : 1,
      columns: Array.isArray(result) && result.length > 0 ? Object.keys(result[0]) : [],
      data: result,
    });
  } catch (err: any) {
    console.error('db-query error:', err);
    return NextResponse.json({ error: err.message || 'SQL execution failed' }, { status: 500 });
  }
}
