'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  Users, 
  Truck, 
  RefreshCw,
  PieChart as PieIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid 
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export function AnalyticsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics/admin');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
        <span>Computing live DBMS redistribution metrics...</span>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const donors = data?.donorLeaderboard || [];
  const volunteers = data?.volunteerScorecard || [];
  const categories = data?.categoryDistribution || [];
  const monthly = data?.monthlyRedistribution || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Food Redistribution Intelligence & Impact Analytics
            </h1>
            <p className="text-xs text-slate-500">
              Aggregated from views `redistribution_analytics_view`, `donation_summary_view`, and `volunteer_performance_view`.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Metrics
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">Total Food Declared</div>
          <div className="text-2xl font-bold text-slate-900">
            {Number(kpis.total_food_declared_kg || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across all registered donors</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">Delivered to Beneficiaries</div>
          <div className="text-2xl font-bold text-emerald-600">
            {Number(kpis.total_food_delivered_kg || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Zero waste redistribution</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">CO₂ Emissions Averted</div>
          <div className="text-2xl font-bold text-teal-600">
            {(Number(kpis.total_food_delivered_kg || 0) * 2.5).toFixed(0)} <span className="text-xs font-normal text-slate-500">kg CO₂e</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Environmental impact</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">Average Community Rating</div>
          <div className="text-2xl font-bold text-amber-500">
            {kpis.platform_satisfaction_rating || '5.0'} / 5.0
          </div>
          <div className="text-[11px] text-slate-400 mt-1">From verified recipient reviews</div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Redistribution Trend */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Monthly Food Rescued & Delivered (kg)
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="total_kg" fill="#10b981" radius={[6, 6, 0, 0]} name="Volume (kg)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-indigo-600" />
            Food Category Redistribution Share (%)
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="total_kg"
                  nameKey="food_type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categories.map((_: any, index: number) => (
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

      {/* Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donor Ranking */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            Donor Contribution Leaderboard
          </h2>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-mono text-[10px] uppercase">
                <tr>
                  <th className="px-3 py-2.5">Rank</th>
                  <th className="px-3 py-2.5">Organization</th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5">Lots</th>
                  <th className="px-3 py-2.5">Declared (kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {donors.map((d: any, idx: number) => (
                  <tr key={d.donor_id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-bold text-slate-900">#{idx + 1}</td>
                    <td className="px-3 py-2 font-sans font-semibold text-slate-800">{d.organization_name}</td>
                    <td className="px-3 py-2 font-sans text-slate-500">{d.donor_type}</td>
                    <td className="px-3 py-2">{d.total_lots_donated}</td>
                    <td className="px-3 py-2 font-bold text-emerald-600">{d.total_quantity_declared_kg} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Volunteer Performance */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-cyan-600" />
            Volunteer Dispatch Velocity & Rating Scorecard
          </h2>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-mono text-[10px] uppercase">
                <tr>
                  <th className="px-3 py-2.5">Volunteer</th>
                  <th className="px-3 py-2.5">Vehicle</th>
                  <th className="px-3 py-2.5">Pickups</th>
                  <th className="px-3 py-2.5">Delivered</th>
                  <th className="px-3 py-2.5">Avg Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {volunteers.map((v: any) => (
                  <tr key={v.volunteer_id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-sans font-semibold text-slate-800">{v.volunteer_name}</td>
                    <td className="px-3 py-2 font-sans text-slate-500">{v.vehicle_type}</td>
                    <td className="px-3 py-2">{v.successful_pickups} / {v.total_assigned_pickups}</td>
                    <td className="px-3 py-2 font-bold text-cyan-600">{v.total_kg_delivered} kg</td>
                    <td className="px-3 py-2 font-bold text-amber-500">{v.average_recipient_rating || '5.0'} ★</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
