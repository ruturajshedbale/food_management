'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  Store, 
  PlusCircle, 
  Package, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  RefreshCw
} from 'lucide-react';

export function DonorDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [foodType, setFoodType] = useState('Prepared Meals');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(25);
  const [unit, setUnit] = useState('kg');
  const [preparedTime, setPreparedTime] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [expiryTime, setExpiryTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 24);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });

  const fetchDonorData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/analytics/donors?donor_id=${user?.profile_id || 1}`);
      const json = await res.json();
      if (json.success) {
        setAnalytics(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonorData();
  }, [user]);

  const handleCreateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_type: foodType,
          description,
          quantity: Number(quantity),
          unit,
          prepared_time: preparedTime,
          expiry_time: expiryTime,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setMessage({ type: 'error', text: json.error || 'Failed to publish food donation' });
      } else {
        setMessage({ type: 'success', text: 'Food surplus declared successfully and entered into matching index!' });
        setDescription('');
        fetchDonorData();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network error' });
    } finally {
      setSubmitting(false);
    }
  };

  const summary = analytics?.summary || {};
  const history = analytics?.history || [];
  const pickups = analytics?.pickups || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {user?.organization_name || 'Donor Operations Hub'}
            </h1>
            <p className="text-xs text-slate-500">
              Publish surplus food inventory, track allocations, and monitor volunteer pickups in real time.
            </p>
          </div>
        </div>

        <button
          onClick={fetchDonorData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">Total Declared Volume</div>
          <div className="text-2xl font-bold text-slate-900">
            {Number(summary.total_quantity_declared_kg || 0).toLocaleString()} <span className="text-xs text-slate-500 font-normal">kg</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{summary.total_lots_donated || 0} total lots published</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">Allocated to Shelters</div>
          <div className="text-2xl font-bold text-emerald-600">
            {Number(summary.total_quantity_allocated_kg || 0).toLocaleString()} <span className="text-xs text-slate-500 font-normal">kg</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Matched & rescued</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">Current Unallocated Stock</div>
          <div className="text-2xl font-bold text-amber-600">
            {Number(summary.current_available_kg || 0).toLocaleString()} <span className="text-xs text-slate-500 font-normal">kg</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Available for new requests</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">Completed Dispatches</div>
          <div className="text-2xl font-bold text-indigo-600">
            {summary.completed_lots || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Full delivery confirmed</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Declare Surplus Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-base text-slate-900">Declare Food Surplus</h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Record surplus items. The intelligent recommendation engine will automatically match nearby hungry shelters.
          </p>

          {message && (
            <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
              message.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleCreateDonation} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Food Category</label>
              <select
                value={foodType}
                onChange={(e) => setFoodType(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Prepared Meals">Prepared Meals (Hot/Cooked)</option>
                <option value="Vegetarian Meals">Vegetarian / Vegan Meals</option>
                <option value="Bakery">Bakery & Breads</option>
                <option value="Fresh Produce">Fresh Produce (Fruits & Vegetables)</option>
                <option value="Dairy Products">Dairy Products</option>
                <option value="Canned & Pantry">Canned & Pantry Goods</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Description & Allergens</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                placeholder="e.g. 50 trays of roasted chicken breast with rosemary vegetables, sealed in thermal hotel containers."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Quantity</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="kg">kg</option>
                  <option value="meals">meals</option>
                  <option value="boxes">boxes</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Prepared Timestamp</label>
              <input
                type="datetime-local"
                value={preparedTime}
                onChange={(e) => setPreparedTime(e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Expiry Deadline (Safety Window)</label>
              <input
                type="datetime-local"
                value={expiryTime}
                onChange={(e) => setExpiryTime(e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Publishing & Auditing...' : 'Publish Surplus Declaration'}
            </button>
          </form>
        </div>

        {/* Donation History Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                Donation Lots & Inventory Status
              </h2>
              <span className="text-xs text-slate-400 font-mono">Live Relational Data</span>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-400 font-mono text-[10px] uppercase">
                  <tr>
                    <th className="px-3 py-2.5">Lot ID</th>
                    <th className="px-3 py-2.5">Category</th>
                    <th className="px-3 py-2.5">Declared</th>
                    <th className="px-3 py-2.5">Remaining</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400">
                        No food surplus declarations recorded yet.
                      </td>
                    </tr>
                  ) : (
                    history.map((d: any) => (
                      <tr key={d.donation_id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-bold text-slate-900">#{d.donation_id}</td>
                        <td className="px-3 py-2 text-slate-700 font-medium font-sans">{d.food_type}</td>
                        <td className="px-3 py-2">{d.quantity} {d.unit}</td>
                        <td className="px-3 py-2 font-bold text-emerald-600">{d.remaining_quantity} {d.unit}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            d.status === 'PARTIALLY_ALLOCATED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            d.status === 'FULLY_ALLOCATED' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            d.status === 'COMPLETED' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[10px] text-slate-400">
                          {new Date(d.expiry_time).toLocaleDateString()} {new Date(d.expiry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Volunteer Pickup Dispatches */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-cyan-600" />
              Scheduled Volunteer Pickups
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pickups.length === 0 ? (
                <div className="col-span-2 text-center py-6 text-xs text-slate-400">
                  No pickups scheduled yet. Once an allocation is confirmed, volunteer dispatches will display here.
                </div>
              ) : (
                pickups.map((p: any) => (
                  <div key={p.pickup_id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Pickup #{p.pickup_id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800">
                        {p.pickup_status}
                      </span>
                    </div>
                    <div className="text-slate-600">
                      <strong>Food:</strong> {p.food_type} ({p.quantity} kg)
                    </div>
                    <div className="text-slate-600">
                      <strong>Volunteer Courier:</strong> {p.volunteer_name} ({p.volunteer_phone})
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Scheduled: {new Date(p.scheduled_time).toLocaleString()}
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
