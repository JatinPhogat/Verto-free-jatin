import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Edit2, Trash2, X, Save,
  Building2, TrendingUp, AlertCircle, CheckCircle2, Clock
} from "lucide-react";
import supabase from "../../lib/supabaseClient";

const STATUS_OPTIONS = ["Pending", "Partially Paid", "Closed"];

const emptyForm = {
  client_name: "",
  ledger_name: "",
  date: "",
  amount: "",
  interest: "",
  paid_back: "",
  status: "Pending",
  remarks: "",
};

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl p-5 bg-orange-50 flex items-center gap-4 shadow-sm border border-orange-100">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-500">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-orange-900">{value}</p>
      </div>
    </div>
  );
}

export default function ClientAdvanceTracker() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { fetchRecords(); }, []);

  async function fetchRecords() {
    setLoading(true);
    const { data, error } = await supabase
      .from("client_advance_tracker")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setRecords(data || []);
    setLoading(false);
  }

  function openAdd() {
    setEditRecord(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(rec) {
    setEditRecord(rec);
    setForm({
      client_name:  rec.client_name  || "",
      ledger_name:  rec.ledger_name  || "",
      date:         rec.date         || "",
      amount:       rec.amount       || "",
      interest:     rec.interest     || "",
      paid_back:    rec.paid_back    || "",
      status:       rec.status       || "Pending",
      remarks:      rec.remarks      || "",
    });
    setShowModal(true);
  }

  // Pending Due = Amount + Interest - Paid Back
  function calcPendingDue(amount, interest, paidBack) {
    return Math.max(
      0,
      (parseFloat(amount)   || 0) +
      (parseFloat(interest) || 0) -
      (parseFloat(paidBack) || 0)
    );
  }

  async function handleSave() {
    if (!form.client_name || !form.amount) return;
    setSaving(true);

    const pending_due = calcPendingDue(form.amount, form.interest, form.paid_back);

    const payload = {
      client_name:  form.client_name,
      ledger_name:  form.ledger_name,
      date:         form.date || null,
      amount:       parseFloat(form.amount)   || 0,
      interest:     parseFloat(form.interest) || 0,
      paid_back:    parseFloat(form.paid_back) || 0,
      pending_due,
      status:       form.status,
      remarks:      form.remarks,
    };

    if (editRecord) {
      await supabase.from("client_advance_tracker").update(payload).eq("id", editRecord.id);
    } else {
      await supabase.from("client_advance_tracker").insert([payload]);
    }
    setSaving(false);
    setShowModal(false);
    fetchRecords();
  }

  async function handleDelete(id) {
    await supabase.from("client_advance_tracker").delete().eq("id", id);
    setDeleteId(null);
    fetchRecords();
  }

  const filtered = records.filter((r) => {
    const matchSearch =
      r.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.ledger_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalAdvanced = records.reduce((s, r) => s + (parseFloat(r.amount)      || 0), 0);
  const totalPending  = records.reduce((s, r) => s + (parseFloat(r.pending_due) || 0), 0);
  const openCount     = records.filter((r) => r.status !== "Closed").length;
  const closedCount   = records.filter((r) => r.status === "Closed").length;

  const fmt = (n) =>
    `₹${parseFloat(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

  // Live pending due for modal
  const livePending = calcPendingDue(form.amount, form.interest, form.paid_back);

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Advanced"    value={fmt(totalAdvanced)} icon={TrendingUp}   />
        <StatCard label="Total Pending Due" value={fmt(totalPending)}  icon={AlertCircle}  />
        <StatCard label="Open Cases"        value={openCount}          icon={Clock}        />
        <StatCard label="Closed Cases"      value={closedCount}        icon={CheckCircle2} />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-3 flex-wrap flex-1">
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
              <input
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-orange-50/40"
                placeholder="Search client or ledger…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2.5 text-sm border border-orange-200 rounded-xl bg-orange-50/40 text-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#7c2d12] to-[#ea580c] text-white rounded-xl text-sm font-semibold shadow hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> Add Client Advance
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-[#7c2d12] to-[#ea580c]">
                {["Client Name", "Ledger", "Date", "Amount (LA)", "Interest", "Paid Back", "Pending Due", "Status", "Remarks", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-white font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-16 text-orange-400">Loading records…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-16 text-gray-400">No records found</td></tr>
              ) : (
                filtered.map((r, i) => {
                  const pendingDue = calcPendingDue(r.amount, r.interest, r.paid_back);
                  return (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-orange-50 hover:bg-orange-50/30 transition-colors"
                    >
                      <td className="px-4 py-3.5 font-semibold text-orange-900">{r.client_name}</td>
                      <td className="px-4 py-3.5 text-gray-600">{r.ledger_name}</td>
                      <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">{r.date}</td>
                      <td className="px-4 py-3.5 font-mono text-orange-800 font-semibold">{fmt(r.amount)}</td>
                      <td className="px-4 py-3.5 font-mono text-orange-600 font-semibold">{fmt(r.interest)}</td>
                      <td className="px-4 py-3.5 font-mono text-green-700 font-semibold">{fmt(r.paid_back)}</td>
                      <td className="px-4 py-3.5 font-mono text-red-600 font-bold">{fmt(pendingDue)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          r.status === "Closed"         ? "bg-green-100 text-green-700" :
                          r.status === "Partially Paid" ? "bg-yellow-100 text-yellow-700" :
                                                          "bg-red-100 text-red-600"
                        }`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 max-w-[140px] truncate">{r.remarks}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-700 transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteId(r.id)} className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-[#7c2d12] to-[#ea580c] px-6 py-4 flex items-center justify-between">
                <h2 className="text-white font-bold text-lg">
                  {editRecord ? "Edit Client Advance" : "Add Client Advance"}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-white/70 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 grid grid-cols-2 gap-4">
                {/* Client Name */}
                <div>
                  <label className="block text-xs font-semibold text-orange-800 mb-1.5 uppercase tracking-wide">Client Name *</label>
                  <input type="text" className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.client_name} onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))} placeholder="Client name" />
                </div>

                {/* Ledger Name */}
                <div>
                  <label className="block text-xs font-semibold text-orange-800 mb-1.5 uppercase tracking-wide">Ledger Name</label>
                  <input type="text" className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.ledger_name} onChange={(e) => setForm((f) => ({ ...f, ledger_name: e.target.value }))} placeholder="Ledger" />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-orange-800 mb-1.5 uppercase tracking-wide">Date of Loan / Advance</label>
                  <input type="date" className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-orange-800 mb-1.5 uppercase tracking-wide">Amount (LA) *</label>
                  <input type="number" className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
                </div>

                {/* Interest — manual */}
                <div>
                  <label className="block text-xs font-semibold text-orange-800 mb-1.5 uppercase tracking-wide">Interest (Manual)</label>
                  <input type="number" className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.interest} onChange={(e) => setForm((f) => ({ ...f, interest: e.target.value }))} placeholder="0.00" />
                </div>

                {/* Paid Back */}
                <div>
                  <label className="block text-xs font-semibold text-orange-800 mb-1.5 uppercase tracking-wide">Paid Back</label>
                  <input type="number" className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.paid_back} onChange={(e) => setForm((f) => ({ ...f, paid_back: e.target.value }))} placeholder="0.00" />
                </div>

                {/* Pending Due — AUTO */}
                <div>
                  <label className="block text-xs font-semibold text-orange-800 mb-1.5 uppercase tracking-wide">Pending Due (Auto)</label>
                  <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm font-bold text-red-600">
                    {fmt(livePending)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">= Amount + Interest − Paid Back</p>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-orange-800 mb-1.5 uppercase tracking-wide">Status</label>
                  <select className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                    {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>

                {/* Remarks */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-orange-800 mb-1.5 uppercase tracking-wide">Remarks</label>
                  <textarea className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    rows={2} value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} placeholder="Optional notes…" />
                </div>
              </div>

              <div className="px-6 pb-6 flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-gradient-to-r from-[#7c2d12] to-[#ea580c] text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow disabled:opacity-60">
                  <Save className="w-4 h-4" /> {saving ? "Saving…" : editRecord ? "Update" : "Save"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Record?</h3>
              <p className="text-gray-500 text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeleteId(null)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold">Cancel</button>
                <button onClick={() => handleDelete(deleteId)} className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}