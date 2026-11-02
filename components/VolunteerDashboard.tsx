'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  Truck, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Package, 
  Star, 
  Thermometer, 
  RefreshCw,
  Navigation
} from 'lucide-react';

export function VolunteerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [conditionModalOpen, setConditionModalOpen] = useState(false);
  const [activeDonationId, setActiveDonationId] = useState<number | null>(null);
  const [temp, setTemp] = useState(4.0);
  const [packagingIntact, setPackagingIntact] = useState(true);
  const [conditionNotes, setConditionNotes] = useState('');

  const fetchVolunteerData = async () => {
    try {
      setLoading(true);
      const volunteerId = user?.profile_id || 1;
      const res = await fetch(`/api/analytics/volunteers?volunteer_id=${volunteerId}`);
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
    fetchVolunteerData();
  }, [user]);

  const handleUpdatePickup = async (pickupId: number, status: 'ACCEPTED' | 'PICKED_UP') => {
    try {
      const res = await fetch(`/api/pickups/${pickupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        alert(`Pickup status updated to ${status}`);
        fetchVolunteerData();
      } else {
        alert(json.error || 'Failed to update pickup');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCompleteDelivery = async (deliveryId: number, qty: number) => {
    const signature = prompt('Enter recipient signature or authorized name:', 'Sister Maria Teresa');
    if (!signature) return;

    try {
      const res = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_status: 'DELIVERED',
          delivered_quantity: qty,
          recipient_signature: signature,
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert('Delivery confirmed! Relational delivery record updated and outbox event queued.');
        fetchVolunteerData();
      } else {
        alert(json.error || 'Failed to complete delivery');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLogCondition = async () => {
    if (!activeDonationId) return;
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donation_id: activeDonationId,
          temperature_celsius: temp,
          packaging_intact: packagingIntact,
          hygiene_notes: conditionNotes,
          inspector_name: user?.name || 'Volunteer Courier',
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert('Food condition telemetry successfully logged into MongoDB collection!');
        setConditionModalOpen(false);
        setConditionNotes('');
      } else {
        alert(json.error || 'Failed to log condition');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const scorecard = data?.scorecard || {};
  const pendingPickups = data?.pendingPickups || [];
  const activeDeliveries = data?.activeDeliveries || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-50 text-cyan-700 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {user?.name || 'Volunteer Logistics Terminal'}
            </h1>
            <p className="text-xs text-slate-500">
              Active Vehicle: <strong className="text-slate-800">{user?.vehicle_type || 'VAN'}</strong> &bull; Status: <span className="text-emerald-600 font-bold">AVAILABLE</span>
            </p>
          </div>
        </div>

        <button
          onClick={fetchVolunteerData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Route
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">Assigned Pickups</div>
          <div className="text-2xl font-bold text-slate-900">
            {scorecard.total_assigned_pickups || pendingPickups.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Scheduled collection routes</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">Delivered Food Volume</div>
          <div className="text-2xl font-bold text-emerald-600">
            {Number(scorecard.total_kg_delivered || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Rescued and delivered</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">Verified Deliveries</div>
          <div className="text-2xl font-bold text-cyan-600">
            {scorecard.verified_deliveries || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Recipient-signed dropoffs</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">Quality Assessment Rating</div>
          <div className="text-2xl font-bold text-amber-500 flex items-center gap-1">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            {scorecard.average_recipient_rating || '5.0'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Based on shelter reviews</div>
        </div>
      </div>

      {/* Dispatch Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Pickups Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-600" />
              Assigned Pickups (Collection Jobs)
            </h2>
            <span className="text-xs text-slate-400 font-mono">pickups table</span>
          </div>

          <div className="space-y-3">
            {pendingPickups.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No active pickup assignments at the moment.
              </div>
            ) : (
              pendingPickups.map((p: any) => (
                <div key={p.pickup_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-900">Pickup #{p.pickup_id}</span>
                      <div className="text-xs font-semibold text-slate-800">{p.donor_organization}</div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800">
                      {p.pickup_status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{p.pickup_address}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>Item: <strong className="text-slate-800">{p.food_type}</strong></span>
                    <span>Scheduled: {new Date(p.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    {p.pickup_status === 'ASSIGNED' && (
                      <button
                        onClick={() => handleUpdatePickup(p.pickup_id, 'ACCEPTED')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                      >
                        Accept Job
                      </button>
                    )}
                    {p.pickup_status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleUpdatePickup(p.pickup_id, 'PICKED_UP')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                      >
                        Mark Picked Up
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setActiveDonationId(p.donation_id);
                        setConditionModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center gap-1 transition-colors"
                    >
                      <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                      Log Condition (MongoDB)
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Deliveries Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-indigo-600" />
              Active Delivery Dropoffs
            </h2>
            <span className="text-xs text-slate-400 font-mono">deliveries table</span>
          </div>

          <div className="space-y-3">
            {activeDeliveries.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No active delivery dropoffs currently pending for your vehicle.
              </div>
            ) : (
              activeDeliveries.map((del: any) => (
                <div key={del.delivery_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-900">Delivery #{del.delivery_id}</span>
                      <div className="text-xs font-semibold text-slate-800">{del.recipient_organization}</div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      {del.delivery_status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{del.delivery_address} (Contact: {del.recipient_contact})</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>Delivering: <strong className="text-slate-800">{del.food_type}</strong></span>
                    <span className="text-emerald-600 font-bold">{del.allocated_quantity} {del.unit}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <button
                      onClick={() => handleCompleteDelivery(del.delivery_id, del.allocated_quantity)}
                      className="w-full py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all"
                    >
                      Confirm Dropoff & Capture Signature
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MongoDB Condition Telemetry Modal */}
      {conditionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-amber-600" />
              Log Food Condition Telemetry (MongoDB)
            </h3>
            <p className="text-xs text-slate-500">
              Stores flexible inspection metadata (temperature, seal integrity) into MongoDB collection <code className="font-mono text-emerald-700">food_condition_logs</code>.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Storage Temperature: <strong className="text-emerald-700">{temp} °C</strong>
              </label>
              <input
                type="range"
                min="-20"
                max="25"
                step="0.5"
                value={temp}
                onChange={(e) => setTemp(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Frozen (-20°C)</span>
                <span>Safe Cold (4°C)</span>
                <span>Ambient (20°C)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="chk-seal"
                checked={packagingIntact}
                onChange={(e) => setPackagingIntact(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="chk-seal" className="text-xs font-semibold text-slate-700">
                Packaging is sealed, undamaged, and hygienic
              </label>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Inspection Observations</label>
              <textarea
                value={conditionNotes}
                onChange={(e) => setConditionNotes(e.target.value)}
                rows={3}
                placeholder="Inspected in walk-in chiller, all food containers double-wrapped with temperature seals intact."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConditionModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogCondition}
                className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-lg shadow"
              >
                Save to MongoDB
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
