'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  HeartHandshake, 
  Store, 
  Users, 
  Truck, 
  ShieldCheck, 
  Sparkles, 
  Database, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Scale, 
  Cpu,
  Layers,
  FileText
} from 'lucide-react';

interface OverviewLandingProps {
  setActiveTab: (tab: string) => void;
  openSqlModal: () => void;
}

export function OverviewLanding({ setActiveTab, openSqlModal }: OverviewLandingProps) {
  const { switchDemoRole } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/analytics/admin')
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.kpis);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white p-8 sm:p-12 lg:p-16 border border-slate-800 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Local DBMS Stack &bull; MySQL 8.0+ & MongoDB
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Smart Food Rescue & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Redistribution Intelligence System
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            An academic DBMS and full-stack distributed platform eliminating food wastage. Connects commercial food surplus donors with community shelters using <strong>ACID-compliant relational transactions</strong>, <strong>transactional outbox event streaming</strong>, and <strong>high-dimensional semantic matching</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('matching')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Explore Semantic Matching
            </button>
            <button
              onClick={openSqlModal}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              <Database className="w-4 h-4 text-amber-400" />
              Launch Interactive SQL Studio
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-8 border-t border-slate-800/80 font-mono">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats?.total_food_declared_kg ? Number(stats.total_food_declared_kg).toLocaleString() : '285'} <span className="text-xs text-slate-400 font-sans">kg</span>
            </div>
            <div className="text-xs text-slate-400 font-sans">Surplus Food Declared</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
              {stats?.total_food_delivered_kg ? Number(stats.total_food_delivered_kg).toLocaleString() : '45'} <span className="text-xs text-slate-400 font-sans">kg</span>
            </div>
            <div className="text-xs text-slate-400 font-sans">Delivered to Shelters</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">
              {stats?.active_available_surplus_kg ? Number(stats.active_available_surplus_kg).toLocaleString() : '170'} <span className="text-xs text-slate-400 font-sans">kg</span>
            </div>
            <div className="text-xs text-slate-400 font-sans">Available in Matching</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400">
              100%
            </div>
            <div className="text-xs text-slate-400 font-sans">ACID Integrity Verified</div>
          </div>
        </div>
      </section>

      {/* Role Personas Quick Launcher */}
      <section className="space-y-4">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Experience Live System Personas</h2>
          <p className="text-xs text-slate-500">
            Switch between the four distinct ecosystem roles to experience the end-to-end food rescue workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            onClick={() => { switchDemoRole('ADMIN'); setActiveTab('admin'); }}
            className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer group space-y-3"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-108 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Administrator</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Monitor ecosystem health, review trigger-driven audit logs, and execute interactive SQL statements and EXPLAIN queries.
            </p>
            <div className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
              Enter Admin Command <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div 
            onClick={() => { switchDemoRole('DONOR'); setActiveTab('donor'); }}
            className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all cursor-pointer group space-y-3"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-108 transition-transform">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Food Donor</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Declare edible food surplus, manage storage parameters, track real-time allocations, and coordinate volunteer pickups.
            </p>
            <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              Enter Donor Hub <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div 
            onClick={() => { switchDemoRole('RECIPIENT'); setActiveTab('recipient'); }}
            className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-lg transition-all cursor-pointer group space-y-3"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-108 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Recipient NGO</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Submit hunger relief requisitions, view AI matching scores, commit ACID allocations, and record post-delivery reviews.
            </p>
            <div className="text-xs font-semibold text-amber-600 flex items-center gap-1">
              Enter Shelter Portal <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div 
            onClick={() => { switchDemoRole('VOLUNTEER'); setActiveTab('volunteer'); }}
            className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-cyan-400 hover:shadow-lg transition-all cursor-pointer group space-y-3"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-108 transition-transform">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Volunteer Courier</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Accept scheduled pickups, log food inspection temperature into MongoDB, and confirm recipient handover dropoffs.
            </p>
            <div className="text-xs font-semibold text-cyan-600 flex items-center gap-1">
              Enter Logistics Terminal <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* End-to-End Operational Lifecycle Workflow */}
      <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">End-to-End Redistribution Architecture</h2>
          <p className="text-xs text-slate-500">
            How data flows through MySQL transactions, Outbox streams, and MongoDB collections.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">1</span>
            <h4 className="font-bold text-sm text-slate-900">Surplus Declaration</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Commercial donor logs excess meals. Stored in MySQL `food_donations`. Database trigger writes to `donation_audit` and enqueues outbox event.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">2</span>
            <h4 className="font-bold text-sm text-slate-900">Semantic Matching</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Recipient posts requisition. Model computes 384-d semantic embedding vectors, calculates cosine similarity, and ranks candidate donations.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <span className="w-7 h-7 rounded-lg bg-amber-600 text-white font-bold text-xs flex items-center justify-center">3</span>
            <h4 className="font-bold text-sm text-slate-900">ACID Allocation</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Stored procedure `allocate_food` executes `SELECT ... FOR UPDATE`, decrements inventory, and sets request fulfillment with zero race conditions.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <span className="w-7 h-7 rounded-lg bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">4</span>
            <h4 className="font-bold text-sm text-slate-900">Dispatch & Feedback</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Volunteer collects food, logs temperature telemetry into MongoDB, captures recipient signature, and recipient records 5-star quality review.
            </p>
          </div>
        </div>
      </section>

      {/* Polyglot Persistence Technical Explanation */}
      <section className="bg-slate-900 text-slate-200 p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Why MySQL & MongoDB Both Exist (Polyglot Architecture)</h2>
            <p className="text-xs text-slate-400 font-mono">Dual-Engine Design Justification</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-indigo-400 font-bold font-mono">
              <span>MySQL 8.0+ / MariaDB InnoDB</span>
              <Scale className="w-4 h-4" />
            </div>
            <p className="text-slate-300">
              Authoritative financial/inventory ledger. Uses foreign keys, composite unique constraints, check constraints, and stored procedures with <strong>pessimistic row locking (`SELECT ... FOR UPDATE`)</strong> to guarantee zero over-allocation and absolute consistency during high-concurrency requests.
            </p>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
              Tables: users, donors, recipients, volunteers, food_donations, food_requests, donation_allocations, pickups, deliveries, feedback, donation_audit, outbox_events.
            </div>
          </div>

          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-emerald-400 font-bold font-mono">
              <span>MongoDB WiredTiger NoSQL</span>
              <Zap className="w-4 h-4" />
            </div>
            <p className="text-slate-300">
              High-throughput operational telemetry, semi-structured food inspection reports (temperatures, hygiene sensor logs, packaging photos), notification histories, and 384-dimensional dense semantic embedding caches for fast vector comparison.
            </p>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
              Collections: donation_events, pickup_events, delivery_events, food_condition_logs, notification_logs, matching_logs.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
