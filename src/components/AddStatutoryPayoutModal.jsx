import React, { useState, useEffect } from "react";
import supabase from "../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ArrowRight, AlertCircle, FileCheck, Eye,
  ChevronLeft, Trash2, Loader2, CheckCircle2,
} from "lucide-react";

// ─── Inline View Panel ─────────────────────────────────────────────────────────
const StatutoryRecordsPanel = ({ onClose }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRecords = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("statutory_payout_view")
      .select("*")
      .order("created_at", { ascending: false });
    setRecords(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleDelete = async (id) => {
    setConfirmId(null);
    setDeletingId(id);
    try {
      const { error } = await supabase.rpc(
        "delete_statutory_payment_complete",
        { p_id: id }
      );
      if (error) throw error;
      window.refreshDashboard?.();
      showToast("Deleted & ERP synced");
      await fetchRecords();
    } catch (err) {
      showToast("Delete failed: " + err.message, "error");
    } finally {
      setDeletingId(null);
    }
  };

  const statusColor = (s) => ({
    paid: "bg-emerald-100 text-emerald-700",
    partial: "bg-amber-100 text-amber-700",
    pending: "bg-rose-100 text-rose-700",
  }[s] || "bg-gray-100 text-gray-600");

  const totalPaid = records.reduce((s, r) => s + Number(r.total_paid || 0), 0);

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.25 }}
      className="absolute inset-0 bg-white z-10 flex flex-col rounded-2xl overflow-hidden"
    >
      {/* Panel Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-700 px-5 py-4 text-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="flex items-center gap-1 text-cyan-100 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-xs font-semibold">Back</span>
          </button>
          <div className="w-px h-4 bg-white/30" />
          <div>
            <h3 className="text-sm font-bold">Statutory Payout Records</h3>
            <p className="text-cyan-200 text-xs">{records.length} records · ₹ {totalPaid.toLocaleString("en-IN")} paid</p>
          </div>
        </div>
        <button onClick={onClose} className="text-cyan-100 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Records */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileCheck className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No statutory payout records yet</p>
          </div>
        ) : (
          records.map((row) => (
            <div
              key={row.id}
              className={`bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm transition-opacity ${deletingId === row.id ? "opacity-40 pointer-events-none" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm">{row.type}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor(row.calculated_status)}`}>
                      {row.calculated_status?.toUpperCase()}
                    </span>
                    {row.penalty && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">+ Penalty</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {row.entity} ·{" "}
                    {row.month ? new Date(row.month).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}
                    {row.bank_name && <span className="text-blue-500"> · {row.bank_name}</span>}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-gray-500">Due: <span className="font-semibold text-gray-800">₹ {Number(row.total_due || 0).toLocaleString("en-IN")}</span></span>
                    <span className="text-xs text-emerald-600">Paid: <span className="font-semibold">₹ {Number(row.total_paid || 0).toLocaleString("en-IN")}</span></span>
                    {Number(row.pending_due) > 0 && (
                      <span className="text-xs text-rose-600">Pending: <span className="font-semibold">₹ {Number(row.pending_due).toLocaleString("en-IN")}</span></span>
                    )}
                    {row.delay_days > 0 && (
                      <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded">{row.delay_days}d late</span>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <div className="flex-shrink-0">
                  {deletingId === row.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  ) : confirmId === row.id ? (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleDelete(row.id)} className="px-2.5 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-colors">Confirm</button>
                      <button onClick={() => setConfirmId(null)} className="px-2 py-1 border border-gray-200 text-gray-500 text-xs rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(row.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold border border-rose-100 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`absolute bottom-4 left-4 right-4 flex items-center gap-2 px-4 py-3 rounded-xl text-white text-xs font-semibold shadow-lg ${toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main Modal ────────────────────────────────────────────────────────────────
const AddStatutoryPayoutModal = ({ isOpen, onClose, entities = [], banks = [] }) => {
  const [formData, setFormData] = useState({
    entity: "", bank_id: "", statutoryPayoutType: "GST",
    forTheMonth: "", totalDue: "", totalPaid: "", pendingDue: "",
    anyInterestPenalties: "No", penaltyAmount: "", penaltyPercentage: "",
    remarks: "", ops: "100", temp: "", recruitment: "", projects: "", others: "",
  });

  const [errors, setErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);  // ← inline panel state

  const statutoryTypes = [
    { value: "GST", label: "GST" }, { value: "TDS", label: "TDS" },
    { value: "EPF", label: "EPF" }, { value: "ESI", label: "ESI" },
    { value: "LWF", label: "LWF" }, { value: "PF", label: "PF" },
    { value: "Income Tax", label: "Income Tax" }, { value: "Others", label: "Others" },
  ];

  const fetchAutoDue = async (entity, month, type) => {
    if (!entity || !month) return;
    const formattedMonth = `${month}-01`;
    const { data: dueData } = await supabase.rpc("get_statutory_due", {
      selected_entity: entity,
      selected_month: formattedMonth,
      selected_type: type,
    });
    const totalDue = Number(dueData?.[0]?.total_due || 0);
    setFormData((prev) => ({ ...prev, totalDue: totalDue > 0 ? totalDue.toFixed(2) : "0.00" }));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => {
      let updated = { ...prev, [field]: value };

      if (field === "totalPaid") {
        const remaining = parseFloat(prev.totalDue) || 0;
        const entered = parseFloat(value) || 0;
        if (entered > remaining) {
          return { ...prev, totalPaid: remaining.toString() };
        }
        updated.totalPaid = value;
      }

      if (
        (field === "entity" || field === "forTheMonth" || field === "statutoryPayoutType") &&
        updated.entity && updated.forTheMonth && updated.statutoryPayoutType
      ) {
        fetchAutoDue(updated.entity, updated.forTheMonth, updated.statutoryPayoutType);
      }

      return updated;
    });

    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  useEffect(() => {
    const totalDue = parseFloat(formData.totalDue) || 0;
    const totalPaid = parseFloat(formData.totalPaid) || 0;
    const pendingDue = totalDue - totalPaid;
    setFormData((prev) => ({ ...prev, pendingDue: pendingDue >= 0 ? pendingDue.toFixed(2) : "0.00" }));
  }, [formData.totalDue, formData.totalPaid]);

  const calculateTotalPercentage = () => {
    return ["ops", "temp", "recruitment", "projects", "others"]
      .reduce((s, k) => s + (parseFloat(formData[k]) || 0), 0);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.entity) newErrors.entity = "Entity is required";
    if (!formData.bank_id) newErrors.bank_id = "Bank is required";
    if (!formData.statutoryPayoutType) newErrors.statutoryPayoutType = "Type is required";
    if (!formData.forTheMonth.trim()) newErrors.forTheMonth = "Month is required";
    if (!formData.totalDue) newErrors.totalDue = "Total due is required";
    if (!formData.totalPaid) newErrors.totalPaid = "Total paid is required";
    if (formData.anyInterestPenalties === "Yes") {
      if (!formData.penaltyAmount) newErrors.penaltyAmount = "Penalty amount is required";
      if (!formData.penaltyPercentage) newErrors.penaltyPercentage = "Penalty percentage is required";
      if (Math.abs(calculateTotalPercentage() - 100) > 0.01)
        newErrors.costHeadBreakdown = "Cost head breakdown must total 100%";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowErrors(true);
    if (!validateForm()) return;

    const paying = Number(formData.totalPaid || 0);
    const remaining = Number(formData.totalDue || 0);
    if (paying > remaining) { alert("❌ Cannot pay more than remaining due"); return; }

    setLoading(true);
    try {
      const payload = {
        entity: formData.entity,
        bank_id: formData.bank_id,
        month: `${formData.forTheMonth}-01`,
        type: formData.statutoryPayoutType,
        total_due: Number(formData.totalDue),
        total_paid: Number(formData.totalPaid),
        pending_due: Number(formData.pendingDue),
        penalty: formData.anyInterestPenalties === "Yes",
        penalty_amount: Number(formData.penaltyAmount || 0),
        remarks: formData.remarks,
        projection_status: "actual",
        payment_status: Number(formData.pendingDue) <= 0 ? "paid" : "partial",
      };

      // Insert into statutory_payments
      // Triggers auto-create bank_entries + software_entries
      const { error } = await supabase.from("statutory_payments").insert([payload]);
      if (error) throw error;

      window.refreshDashboard?.();
      alert("✅ Statutory Payment Saved");
      resetForm();
      onClose();
    } catch (err) {
      alert("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      entity: "", bank_id: "", statutoryPayoutType: "GST",
      forTheMonth: "", totalDue: "", totalPaid: "", pendingDue: "",
      anyInterestPenalties: "No", penaltyAmount: "", penaltyPercentage: "",
      remarks: "", ops: "100", temp: "", recruitment: "", projects: "", others: "",
    });
    setErrors({});
    setShowErrors(false);
    setViewOpen(false);
    setLoading(false);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const ErrorMessage = ({ error }) => {
    if (!showErrors || !error) return null;
    return (
      <div className="flex items-center mt-1 text-xs text-rose-600">
        <AlertCircle className="w-3 h-3 mr-1" />{error}
      </div>
    );
  };

  const totalPercentage = calculateTotalPercentage();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative"
          >
            {/* ── Inline View Panel ── */}
            <AnimatePresence>
              {viewOpen && <StatutoryRecordsPanel onClose={() => setViewOpen(false)} />}
            </AnimatePresence>

            {/* ── Header ── */}
            <div className="bg-gradient-to-r from-cyan-600 to-blue-700 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">+ ADD STATUTORY PAYOUT</h2>
                  <p className="text-cyan-100 text-sm mt-1">Record statutory compliance payments</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* VIEW button — opens inline panel, no page reload */}
                  <button
                    type="button"
                    onClick={() => setViewOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-semibold border border-white/30 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Records
                  </button>
                  <button onClick={handleClose} className="text-cyan-100 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Form ── */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Statutory Details */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 flex items-center">
                    <FileCheck className="w-4 h-4 mr-2" />Statutory Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Entity <span className="text-rose-600">*</span></label>
                      <select value={formData.entity} onChange={(e) => handleChange("entity", e.target.value)}
                        className={`w-full bg-white border text-gray-900 px-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${showErrors && errors.entity ? "border-rose-500" : "border-gray-300"}`}>
                        <option value="">Select Entity</option>
                        {entities.map((entity, idx) => <option key={idx} value={entity}>{entity}</option>)}
                      </select>
                      <ErrorMessage error={errors.entity} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Statutory Type <span className="text-rose-600">*</span></label>
                      <select value={formData.statutoryPayoutType} onChange={(e) => handleChange("statutoryPayoutType", e.target.value)}
                        className={`w-full bg-white border text-gray-900 px-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${showErrors && errors.statutoryPayoutType ? "border-rose-500" : "border-gray-300"}`}>
                        {statutoryTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                      </select>
                      <ErrorMessage error={errors.statutoryPayoutType} />
                      <p className="text-xs text-gray-500 mt-1">GST/TDS/EPF/ESI/LWF/PF/Income Tax/Others</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">For The Month <span className="text-rose-600">*</span></label>
                      <input type="month" value={formData.forTheMonth} onChange={(e) => handleChange("forTheMonth", e.target.value)}
                        className={`w-full bg-white border text-gray-900 px-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${showErrors && errors.forTheMonth ? "border-rose-500" : "border-gray-300"}`} />
                      <ErrorMessage error={errors.forTheMonth} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Bank <span className="text-rose-600">*</span></label>
                      <select value={formData.bank_id} onChange={(e) => handleChange("bank_id", e.target.value)}
                        className={`w-full bg-white border text-gray-900 px-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${showErrors && errors.bank_id ? "border-rose-500" : "border-gray-300"}`}>
                        <option value="">Select Bank</option>
                        {banks.map((bank) => <option key={bank.id} value={bank.id}>{bank.bank_name}</option>)}
                      </select>
                      <ErrorMessage error={errors.bank_id} />
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider mb-4">Payment Information</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Total Due <span className="text-rose-600">*</span></label>
                      <input type="text" value={formData.totalDue} onChange={(e) => handleChange("totalDue", e.target.value)}
                        className={`w-full bg-white border text-gray-900 px-4 py-2.5 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${showErrors && errors.totalDue ? "border-rose-500" : "border-gray-300"}`}
                        placeholder="₹ 0" />
                      <ErrorMessage error={errors.totalDue} />
                      <p className="text-xs text-gray-500 mt-1">Auto Collate</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Total Paid <span className="text-rose-600">*</span></label>
                      <input type="text" value={formData.totalPaid} onChange={(e) => handleChange("totalPaid", e.target.value)}
                        className={`w-full bg-white border text-gray-900 px-4 py-2.5 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${showErrors && errors.totalPaid ? "border-rose-500" : "border-gray-300"}`}
                        placeholder="₹ 0" />
                      <ErrorMessage error={errors.totalPaid} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Pending Due</label>
                      <input type="text" value={formData.pendingDue} readOnly
                        className="w-full bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-mono font-bold" />
                      <p className="text-xs text-rose-600 mt-1">Auto-calculated</p>
                    </div>
                  </div>
                </div>

                {/* Penalties */}
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-4">Interest / Penalties</h3>
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Any Interest / Penalties</label>
                    <div className="flex space-x-3">
                      <button type="button" onClick={() => handleChange("anyInterestPenalties", "Yes")}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${formData.anyInterestPenalties === "Yes" ? "bg-amber-600 text-white shadow-md" : "bg-white text-gray-600 border border-gray-300"}`}>Yes</button>
                      <button type="button" onClick={() => handleChange("anyInterestPenalties", "No")}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${formData.anyInterestPenalties === "No" ? "bg-emerald-600 text-white shadow-md" : "bg-white text-gray-600 border border-gray-300"}`}>No</button>
                    </div>
                  </div>

                  {formData.anyInterestPenalties === "Yes" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Amount of Penalty <span className="text-rose-600">*</span></label>
                          <input type="number" value={formData.penaltyAmount} onChange={(e) => handleChange("penaltyAmount", e.target.value)}
                            className={`w-full bg-white border text-gray-900 px-4 py-2.5 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 ${showErrors && errors.penaltyAmount ? "border-rose-500" : "border-gray-300"}`}
                            placeholder="₹ 0" />
                          <ErrorMessage error={errors.penaltyAmount} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Penalty % <span className="text-rose-600">*</span></label>
                          <input type="number" value={formData.penaltyPercentage} onChange={(e) => handleChange("penaltyPercentage", e.target.value)}
                            className={`w-full bg-white border text-gray-900 px-4 py-2.5 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 ${showErrors && errors.penaltyPercentage ? "border-rose-500" : "border-gray-300"}`}
                            placeholder="0 %" />
                          <ErrorMessage error={errors.penaltyPercentage} />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-amber-300">
                        <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-3">Cost Head Break Up for Penalties</h4>
                        <div className="grid grid-cols-5 gap-3">
                          {["ops", "temp", "recruitment", "projects", "others"].map((key) => (
                            <div key={key}>
                              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">{key}</label>
                              <input type="number" value={formData[key]} onChange={(e) => handleChange(key, e.target.value)}
                                className="w-full bg-white border border-gray-300 text-gray-900 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                placeholder="0" />
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 p-3 bg-white rounded-lg border-2 border-amber-300">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">Total</span>
                            <span className={`text-lg font-bold ${Math.abs(totalPercentage - 100) < 0.01 ? "text-emerald-600" : "text-rose-600"}`}>
                              {totalPercentage.toFixed(2)}%
                            </span>
                          </div>
                          {showErrors && errors.costHeadBreakdown && <ErrorMessage error={errors.costHeadBreakdown} />}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Remarks */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Remarks</label>
                  <textarea value={formData.remarks} onChange={(e) => handleChange("remarks", e.target.value)} rows={3}
                    className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2.5 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-sm"
                    placeholder="Additional remarks..." />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4">
                  <button type="button" onClick={handleClose} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">Cancel</button>
                  <button type="submit" disabled={loading}
                    className="px-8 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium shadow-lg shadow-cyan-500/30 flex items-center space-x-2">
                    <span>{loading ? "Saving..." : "Save Statutory Payout"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddStatutoryPayoutModal;