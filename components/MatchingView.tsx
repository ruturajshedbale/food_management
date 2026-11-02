'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  CheckCircle2, 
  Clock, 
  Package, 
  ArrowRight, 
  ShieldCheck,
  RefreshCw,
  Info
} from 'lucide-react';

export function MatchingView() {
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedReqId, setSelectedReqId] = useState<number | null>(null);
  const [matchingData, setMatchingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [allocating, setAllocating] = useState(false);

  // Load all open requests
  const fetchOpenRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/requests?pending=true');
      const json = await res.json();
      if (json.success && json.requests?.length > 0) {
        setRequests(json.requests);
        setSelectedReqId(json.requests[0].request_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenRequests();
  }, []);

  // Compute matches for selected request
  useEffect(() => {
    if (!selectedReqId) return;
    const fetchMatches = async () => {
      try {
        setCalculating(true);
        const res = await fetch(`/api/matches/${selectedReqId}`);
        const json = await res.json();
        if (json.success) {
          setMatchingData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCalculating(false);
      }
    };
    fetchMatches();
  }, [selectedReqId]);

  const handleExecuteAllocation = async (donationId: number, qty: number) => {
    if (!selectedReqId) return;
    try {
      setAllocating(true);
      const res = await fetch('/api/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donation_id: donationId,
          request_id: selectedReqId,
          allocated_quantity: qty,
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message || 'Allocation successfully executed and committed in MySQL InnoDB!');
        // Refresh
        const mRes = await fetch(`/api/matches/${selectedReqId}`);
        const mJson = await mRes.json();
        if (mJson.success) setMatchingData(mJson);
        fetchOpenRequests();
      } else {
        alert(json.error || 'Allocation failed');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAllocating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-xl shadow-md shadow-indigo-900/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Intelligent Semantic Food Matching & Recommendation Engine
            </h1>
            <p className="text-xs text-slate-500">
              384-dimensional dense sentence embeddings &bull; Multi-criteria composite ranking &bull; ACID-safe allocation
            </p>
          </div>
        </div>

        <button
          onClick={fetchOpenRequests}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Reload Demand
        </button>
      </div>

      {/* Requisition Selector Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <label className="text-xs font-semibold text-slate-700 block uppercase tracking-wider">
          Select Target Food Requisition to Match:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {requests.map((r: any) => {
            const isSelected = selectedReqId === r.request_id;
            const unmet = Number(r.quantity_required) - Number(r.quantity_fulfilled);
            return (
              <button
                key={r.request_id}
                onClick={() => setSelectedReqId(r.request_id)}
                className={`text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900">Request #{r.request_id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    r.priority === 'URGENT' ? 'bg-rose-100 text-rose-700' :
                    r.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {r.priority}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-800 truncate">{r.recipient_organization}</div>
                <div className="text-[11px] text-slate-500 font-medium">{r.food_type} ({unmet} {r.unit} unmet)</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Target Request Details Card */}
      {matchingData?.request && (
        <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-lg border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-400" />
              <h2 className="font-bold text-sm text-white">
                Active Requisition Analysis: #{matchingData.request.request_id} ({matchingData.request.organization_name})
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Priority: {matchingData.request.priority}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block">Category & Specifications:</span>
              <strong className="text-white text-sm font-sans">{matchingData.request.food_type}</strong>
              <p className="text-slate-300 text-xs mt-1 font-sans">{matchingData.request.description}</p>
            </div>
            <div>
              <span className="text-slate-400 block">Quantity Status:</span>
              <span className="text-white">Required: {matchingData.request.quantity_required} {matchingData.request.unit}</span>
              <span className="text-emerald-400 block">Fulfilled: {matchingData.request.quantity_fulfilled} {matchingData.request.unit}</span>
              <span className="text-amber-400 font-bold block">Outstanding Unmet: {matchingData.request.outstanding_quantity} {matchingData.request.unit}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Delivery Deadline:</span>
              <span className="text-white">{new Date(matchingData.request.required_by).toLocaleString()}</span>
              <span className="text-slate-400 block text-[11px] mt-1">Status: {matchingData.request.status}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            Ranked Candidate Donations (Scored by Hybrid Recommendation Metric)
          </h2>
          <span className="text-xs text-slate-500">
            {matchingData?.recommendations?.length || 0} eligible candidates found
          </span>
        </div>

        {calculating ? (
          <div className="flex items-center justify-center p-12 text-slate-500 gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Generating 384-d semantic embeddings and ranking candidates...</span>
          </div>
        ) : matchingData?.recommendations?.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
            No compatible surplus food donations currently available for this requisition.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {matchingData?.recommendations?.map((rec: any, idx: number) => {
              const unmet = matchingData.request.outstanding_quantity;
              const allocateQty = Math.min(unmet, rec.remaining_quantity);

              return (
                <div
                  key={rec.donation_id}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-6"
                >
                  {/* Left Column: Info & Pill Scores */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-bold">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-sm text-slate-900">
                        {rec.donor_organization}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {rec.composite_score}% Hybrid Match Score
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {rec.remaining_quantity} {rec.unit} Available
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Expires in {rec.hours_until_expiry}h
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-800">{rec.food_type}</div>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{rec.description}</p>
                    </div>

                    {/* Explanatory Reasons Breakdown */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-indigo-600" />
                        Recommendation Rationale:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-600">
                        {rec.match_reasons.map((reason: string, rIdx: number) => (
                          <div key={rIdx} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Allocation Action */}
                  <div className="md:text-right shrink-0 space-y-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                    <div className="text-xs text-slate-500">
                      Recommended Allocation:
                      <div className="text-lg font-bold text-slate-900">
                        {allocateQty} {rec.unit}
                      </div>
                    </div>

                    <button
                      onClick={() => handleExecuteAllocation(rec.donation_id, allocateQty)}
                      disabled={allocating || allocateQty <= 0}
                      className="w-full md:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <span>Commit ACID Allocation</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <span className="block text-[10px] text-slate-400 font-mono">
                      Stored Procedure `allocate_food`
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
