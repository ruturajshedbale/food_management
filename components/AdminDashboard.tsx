'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Package, 
  ClipboardList, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Database,
  History,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export function AdminDashboard({ openSqlModal }: { openSqlModal: () => void }) {
  const [data, setData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics/admin');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }

      // Fetch MongoDB event stream
      const evRes = await fetch('/api/events');
      const evJson = await evRes.json();
      if (evJson.success) {
        setEvents(evJson.events || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSyncOutbox = async () => {
    setSyncing(true);
    try {
      await fetch('/api/events');
      await fetchAdminData();
    } finally {
      setSyncing(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span>Loading Admin Command Dashboard...</span>
      </div>
    );
  }

  const kpis = data?.kpis || {};

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Administrator Command & Audit Center</h1>
              <p className="text-xs text-slate-500">
                Authoritative MySQL Relational Ledger &bull; Outbox Stream &bull; MongoDB Activity Logs
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncOutbox}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            Sync Outbox to MongoDB
          </button>
          <button
            onClick={openSqlModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            Launch SQL Studio
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Total Food Declared</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {Number(kpis.total_food_declared_kg || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {kpis.total_donation_lots || 0} donation lots
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Food Delivered</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {Number(kpis.total_food_delivered_kg || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            100% verified dropoffs
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Active Available Surplus</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {Number(kpis.active_available_surplus_kg || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Ready for intelligent matching
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Active Pending Requests</span>
            <ClipboardList className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600">
            {kpis.active_pending_requests || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Community shelters awaiting food
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Redistribution Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            Monthly Food Redistribution Velocity (kg Delivered)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthlyRedistribution || []}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="total_kg" fill="#10b981" radius={[6, 6, 0, 0]} name="Delivered kg" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-600" />
            Food Category Redistribution Share
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.categoryDistribution || []}
                  dataKey="total_kg"
                  nameKey="food_type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(data?.categoryDistribution || []).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Dual Ledger View: MySQL Audit Trail vs MongoDB Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MySQL Trigger Audit Trail */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-amber-600" />
              MySQL Trigger Audit Ledger (donation_audit)
            </h3>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              Immutable ACID
            </span>
          </div>
          <div className="overflow-x-auto max-h-72 overflow-y-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-mono text-[10px] uppercase sticky top-0">
                <tr>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Old Qty</th>
                  <th className="px-3 py-2">New Qty</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {(data?.auditTrail || []).map((a: any) => (
                  <tr key={a.audit_id} className="hover:bg-slate-50">
                    <td className="px-3 py-1.5 font-bold text-slate-800">#{a.donation_id}</td>
                    <td className="px-3 py-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 font-semibold">
                        {a.action_type}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">{a.old_quantity ?? '-'}</td>
                    <td className="px-3 py-1.5 text-emerald-600 font-bold">{a.new_quantity ?? '-'}</td>
                    <td className="px-3 py-1.5 text-[10px]">{a.new_status}</td>
                    <td className="px-3 py-1.5 text-slate-400 text-[10px]">{a.changed_at?.slice(11, 19)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MongoDB Event Stream */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              MongoDB Outbox Stream (donation_events)
            </h3>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              WiredTiger NoSQL
            </span>
          </div>
          <div className="overflow-x-auto max-h-72 overflow-y-auto border border-slate-100 rounded-xl">
            <div className="p-2 space-y-2">
              {events.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No MongoDB events recorded yet. Trigger an action to see real-time events.
                </div>
              ) : (
                events.map((ev: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-700 font-bold">{ev.event_type}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">
                      {JSON.stringify(ev.payload || {})}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
