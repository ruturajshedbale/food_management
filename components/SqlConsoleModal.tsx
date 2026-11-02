'use client';

import React, { useState } from 'react';
import { Database, Play, Eye, X, Clock, Table, CheckCircle2, AlertCircle } from 'lucide-react';

interface SqlConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_QUERIES = [
  {
    name: '1. Available Donations (Expiry Sort)',
    sql: `SELECT donation_id, donor_id, food_type, remaining_quantity, unit, expiry_time, TIMESTAMPDIFF(HOUR, NOW(), expiry_time) AS hours_until_expiry, status FROM food_donations WHERE status IN ('AVAILABLE', 'PARTIALLY_ALLOCATED') AND expiry_time > NOW() ORDER BY hours_until_expiry ASC;`
  },
  {
    name: '2. Total Rescued per Donor',
    sql: `SELECT dn.donor_id, dn.organization_name, dn.donor_type, COUNT(d.donation_id) AS total_lots, SUM(d.quantity) AS total_declared_kg, SUM(d.quantity - d.remaining_quantity) AS allocated_kg, SUM(d.remaining_quantity) AS unallocated_kg FROM donors dn LEFT JOIN food_donations d ON dn.donor_id = d.donor_id GROUP BY dn.donor_id, dn.organization_name, dn.donor_type ORDER BY total_declared_kg DESC;`
  },
  {
    name: '3. High Priority Unmet Requests',
    sql: `SELECT r.request_id, rc.organization_name AS recipient_name, r.food_type, r.quantity_required, (r.quantity_required - r.quantity_fulfilled) AS unmet_quantity, r.priority, r.required_by FROM food_requests r JOIN recipients rc ON r.recipient_id = rc.recipient_id WHERE r.status IN ('PENDING', 'PARTIALLY_FULFILLED') AND r.priority IN ('HIGH', 'URGENT') ORDER BY r.required_by ASC;`
  },
  {
    name: '4. Recipient Fulfillment Percentage',
    sql: `SELECT rc.recipient_id, rc.organization_name, rc.capacity, COUNT(r.request_id) AS total_requests, SUM(r.quantity_required) AS requested_kg, SUM(r.quantity_fulfilled) AS fulfilled_kg, ROUND(SUM(r.quantity_fulfilled)/NULLIF(SUM(r.quantity_required),0)*100, 1) AS fulfillment_pct FROM recipients rc LEFT JOIN food_requests r ON rc.recipient_id = r.recipient_id GROUP BY rc.recipient_id, rc.organization_name, rc.capacity;`
  },
  {
    name: '5. Multi-Hop Logistics Audit Trail',
    sql: `SELECT a.allocation_id, dn.organization_name AS donor_source, rc.organization_name AS recipient_dest, d.food_type, a.allocated_quantity, u.name AS volunteer_name, p.pickup_status, del.delivery_status, del.delivered_quantity, f.rating AS rating FROM donation_allocations a JOIN food_donations d ON a.donation_id = d.donation_id JOIN donors dn ON d.donor_id = dn.donor_id JOIN food_requests r ON a.request_id = r.request_id JOIN recipients rc ON r.recipient_id = rc.recipient_id LEFT JOIN deliveries del ON a.allocation_id = del.allocation_id LEFT JOIN pickups p ON del.pickup_id = p.pickup_id LEFT JOIN volunteers v ON p.volunteer_id = v.volunteer_id LEFT JOIN users u ON v.user_id = u.user_id LEFT JOIN feedback f ON del.delivery_id = f.delivery_id ORDER BY a.allocation_time DESC;`
  },
  {
    name: '6. Window Function: Running Cumulative Volume',
    sql: `SELECT d.donation_id, dn.organization_name, d.food_type, d.quantity, d.created_at, SUM(d.quantity) OVER (PARTITION BY d.donor_id ORDER BY d.created_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_kg FROM food_donations d JOIN donors dn ON d.donor_id = dn.donor_id ORDER BY dn.organization_name, d.created_at ASC;`
  },
  {
    name: '7. View: redistribution_analytics_view',
    sql: `SELECT * FROM redistribution_analytics_view;`
  },
  {
    name: '8. Trigger Audit Ledger',
    sql: `SELECT * FROM donation_audit ORDER BY changed_at DESC LIMIT 15;`
  }
];

export function SqlConsoleModal({ isOpen, onClose }: SqlConsoleModalProps) {
  const [sql, setSql] = useState(PRESET_QUERIES[0].sql);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const runQuery = async (explain = false) => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/db-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql_statement: sql, explain }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Query failed to execute');
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || 'Execution error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Interactive DBMS SQL & EXPLAIN Workbench</h3>
              <p className="text-xs text-slate-400 font-mono">
                food_rescue_db &bull; MySQL 8.0+ / MariaDB 10.11 InnoDB &bull; Live Parameterized Execution
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Preset queries pill selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
              Select Preset Query:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_QUERIES.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setSql(q.sql)}
                  className="px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  {q.name}
                </button>
              ))}
            </div>
          </div>

          {/* SQL Editor Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                SQL Statement (Read-Only: SELECT, EXPLAIN, SHOW, DESCRIBE):
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => runQuery(true)}
                  disabled={running}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 transition-colors disabled:opacity-50"
                >
                  <Eye className="w-3.5 h-3.5" />
                  EXPLAIN Plan
                </button>
                <button
                  onClick={() => runQuery(false)}
                  disabled={running}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30 transition-colors disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {running ? 'Executing...' : 'Run Query'}
                </button>
              </div>
            </div>
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              rows={4}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-xs text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="SELECT * FROM food_donations LIMIT 10;"
            />
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">SQL Error:</span>
                <span className="font-mono">{error}</span>
              </div>
            </div>
          )}

          {/* Result Stats */}
          {result && (
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Query Succeeded
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Execution: <strong className="text-white">{result.execution_time_ms} ms</strong>
              </span>
              <span className="flex items-center gap-1">
                <Table className="w-3.5 h-3.5" />
                Rows: <strong className="text-white">{result.row_count}</strong>
              </span>
            </div>
          )}

          {/* Result Table */}
          {result && Array.isArray(result.data) && (
            <div className="border border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto bg-slate-950">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[11px] sticky top-0 border-b border-slate-800">
                  <tr>
                    {result.columns.map((col: string) => (
                      <th key={col} className="px-3 py-2 font-medium">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {result.data.map((row: any, rIdx: number) => (
                    <tr key={rIdx} className="hover:bg-slate-900/50">
                      {result.columns.map((col: string) => (
                        <td key={col} className="px-3 py-1.5 whitespace-nowrap text-slate-200">
                          {row[col] === null ? <span className="text-slate-600">NULL</span> : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Close Studio
          </button>
        </div>
      </div>
    </div>
  );
}
