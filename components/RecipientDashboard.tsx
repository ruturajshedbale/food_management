'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  Users, 
  PlusCircle, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Truck, 
  Star,
  RefreshCw,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export function RecipientDashboard({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedReqId, setSelectedReqId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackDeliveryId, setFeedbackDeliveryId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Request Form State
  const [foodType, setFoodType] = useState('Prepared Meals');
  const [description, setDescription] = useState('');
  const [quantityRequired, setQuantityRequired] = useState(30);
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('HIGH');
  const [requiredBy, setRequiredBy] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 12);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const recipientId = user?.profile_id || 1;
      const res = await fetch(`/api/analytics/recipients?recipient_id=${recipientId}`);
      const json = await res.json();
      if (json.success) {
        setAnalytics(json);
      }

      const reqRes = await fetch(`/api/requests?recipient_id=${recipientId}`);
      const reqJson = await reqRes.json();
      if (reqJson.success) {
        setRequests(reqJson.requests || []);
        if (reqJson.requests?.length > 0 && !selectedReqId) {
          const firstPending = reqJson.requests.find((r: any) => r.status === 'PENDING' || r.status === 'PARTIALLY_FULFILLED');
          if (firstPending) {
            setSelectedReqId(firstPending.request_id);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Fetch recommendations whenever selectedReqId changes
  useEffect(() => {
    if (!selectedReqId) return;
    const fetchMatches = async () => {
      try {
        const res = await fetch(`/api/matches/${selectedReqId}`);
        const json = await res.json();
        if (json.success) {
          setRecommendations(json.recommendations || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMatches();
  }, [selectedReqId]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_type: foodType,
          description,
          quantity_required: Number(quantityRequired),
          unit: 'kg',
          required_by: requiredBy,
          priority,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setMessage({ type: 'error', text: json.error || 'Failed to create request' });
      } else {
        setMessage({ type: 'success', text: 'Food requisition registered! Matching engine activated.' });
        setDescription('');
        fetchData();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAllocate = async (donationId: number, reqId: number, qty: number) => {
    try {
      setSubmitting(true);
      const res = await fetch('/api/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donation_id: donationId,
          request_id: reqId,
          allocated_quantity: qty,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error || 'Failed to execute allocation');
      } else {
        alert(json.message || 'Allocation confirmed!');
        fetchData();
        if (selectedReqId) {
          const mRes = await fetch(`/api/matches/${selectedReqId}`);
          const mJson = await mRes.json();
          if (mJson.success) setRecommendations(mJson.recommendations || []);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackDeliveryId) return;
    setFeedbackSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_id: feedbackDeliveryId,
          rating,
          comments,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error || 'Failed to submit feedback');
      } else {
        alert('Thank you! Quality feedback recorded in relational feedback ledger.');
        setFeedbackDeliveryId(null);
        setComments('');
        fetchData();
      }
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const stats = analytics?.stats || {};
  const activeAllocations = analytics?.activeAllocations || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {user?.organization_name || 'Recipient Community Portal'}
            </h1>
            <p className="text-xs text-slate-500">
              Submit food requisitions, review semantic matches, and track verified dispatches to your kitchen.
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">Total Requested Demand</div>
          <div className="text-2xl font-bold text-slate-900">
            {Number(stats.total_required_kg || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{stats.total_requests || 0} requisitions logged</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">Fulfilled Food Received</div>
          <div className="text-2xl font-bold text-emerald-600">
            {Number(stats.total_fulfilled_kg || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Meals served</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">Unmet Outstanding Demand</div>
          <div className="text-2xl font-bold text-amber-600">
            {Number(stats.total_outstanding_kg || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span>
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">Awaiting surplus donations</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">Active Pending Requests</div>
          <div className="text-2xl font-bold text-indigo-600">
            {stats.pending_requests_count || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Open in matching engine</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Request Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold text-base text-slate-900">Post Food Requisition</h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Specify food needed, required quantity, and delivery deadline.
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

          <form onSubmit={handleCreateRequest} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Required Food Category</label>
              <select
                value={foodType}
                onChange={(e) => setFoodType(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500"
              >
                <option value="Prepared Meals">Prepared Meals (Hot/Cooked)</option>
                <option value="Vegetarian Meals">Vegetarian / Vegan Meals</option>
                <option value="Bakery">Bakery & Breads</option>
                <option value="Fresh Produce">Fresh Produce (Fruits & Greens)</option>
                <option value="Dairy Products">Dairy Products</option>
                <option value="Canned & Pantry">Canned & Pantry Staples</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Requisition Details</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                placeholder="e.g. Dinner program needs hot meals for 80 shelter residents before 6:30 PM."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Required Quantity (kg)</label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={quantityRequired}
                  onChange={(e) => setQuantityRequired(Number(e.target.value))}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Priority Tier</label>
                <select
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 font-bold"
                >
                  <option value="URGENT">URGENT (Immediate)</option>
                  <option value="HIGH">HIGH Priority</option>
                  <option value="MEDIUM">MEDIUM Priority</option>
                  <option value="LOW">LOW Priority</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Delivery Needed By</label>
              <input
                type="datetime-local"
                value={requiredBy}
                onChange={(e) => setRequiredBy(e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-900/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Registering Requisition...' : 'Submit Food Requisition'}
            </button>
          </form>
        </div>

        {/* Right Section: Pending Requests & Recommended Matches */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Requisitions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Active Requisitions (Select to View AI Matches)
              </h2>
              <span className="text-xs text-slate-400 font-mono">Live Database Rows</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {requests.map((r: any) => {
                const isSelected = selectedReqId === r.request_id;
                const outstanding = Number(r.quantity_required) - Number(r.quantity_fulfilled);
                return (
                  <div
                    key={r.request_id}
                    onClick={() => setSelectedReqId(r.request_id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-slate-900">Request #{r.request_id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.priority === 'URGENT' ? 'bg-rose-100 text-rose-700' :
                        r.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {r.priority}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800">{r.food_type}</div>
                    <div className="text-xs text-slate-500 line-clamp-1">{r.description}</div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Unmet: <strong className="text-amber-700">{outstanding} kg</strong></span>
                      <span className={`font-semibold ${r.status === 'FULFILLED' ? 'text-emerald-600' : 'text-slate-600'}`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Recommended Matches for Selected Request */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-base text-slate-900">
                  Recommended Matches for Request #{selectedReqId || 'None Selected'}
                </h2>
              </div>
              <button
                onClick={() => setActiveTab('matching')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Advanced Matching Studio <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recommendations.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No active matching surplus donations found for this request at this time.
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec: any) => (
                  <div
                    key={rec.donation_id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          {rec.donor_organization}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                          {rec.composite_score}% Match Score
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {rec.remaining_quantity} {rec.unit} Available
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 font-medium">{rec.food_type}</div>
                      <div className="text-xs text-slate-500">{rec.description}</div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {rec.match_reasons.map((reason: string, rIdx: number) => (
                          <span key={rIdx} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                            &bull; {reason}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <button
                        onClick={() => {
                          const currentReq = requests.find((r: any) => r.request_id === selectedReqId);
                          const needed = currentReq ? (Number(currentReq.quantity_required) - Number(currentReq.quantity_fulfilled)) : 10;
                          const allocateQty = Math.min(needed, rec.remaining_quantity);
                          handleAllocate(rec.donation_id, selectedReqId!, allocateQty);
                        }}
                        disabled={submitting}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/20 transition-all disabled:opacity-50"
                      >
                        Allocate Food
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Incoming Deliveries & Quality Feedback */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              Incoming Deliveries & Review Verification
            </h2>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-400 font-mono text-[10px] uppercase">
                  <tr>
                    <th className="px-3 py-2.5">Delivery ID</th>
                    <th className="px-3 py-2.5">Food Type</th>
                    <th className="px-3 py-2.5">Donor</th>
                    <th className="px-3 py-2.5">Qty</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {activeAllocations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400">
                        No delivery assignments active.
                      </td>
                    </tr>
                  ) : (
                    activeAllocations.map((a: any) => (
                      <tr key={a.allocation_id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-bold text-slate-900">#{a.delivery_id || a.allocation_id}</td>
                        <td className="px-3 py-2 font-sans font-medium text-slate-800">{a.food_type}</td>
                        <td className="px-3 py-2 font-sans">{a.donor_organization}</td>
                        <td className="px-3 py-2 font-bold text-emerald-600">{a.allocated_quantity} {a.unit}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.delivery_status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700' :
                            a.delivery_status === 'IN_TRANSIT' ? 'bg-cyan-50 text-cyan-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {a.delivery_status || a.allocation_status}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {a.delivery_status === 'DELIVERED' && a.delivery_id && (
                            <button
                              onClick={() => setFeedbackDeliveryId(a.delivery_id)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-800 hover:bg-amber-500/30 flex items-center gap-1"
                            >
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              Rate Delivery
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Submission Modal */}
      {feedbackDeliveryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900">
              Submit Delivery Quality Review (Delivery #{feedbackDeliveryId})
            </h3>
            <p className="text-xs text-slate-500">
              Your feedback is recorded directly into the relational feedback ledger with a UNIQUE delivery constraint.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Rating (1 to 5 Stars)</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-700 ml-2">{rating} / 5 Stars</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Comments / Hygiene Assessment</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                placeholder="Food arrived hot, properly packaged in thermal containers, served all families."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFeedbackDeliveryId(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitFeedback}
                disabled={feedbackSubmitting}
                className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-lg shadow disabled:opacity-50"
              >
                {feedbackSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
