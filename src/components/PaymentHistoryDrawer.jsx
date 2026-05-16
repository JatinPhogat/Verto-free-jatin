import React, { useEffect, useState } from "react";
import supabase from "../lib/supabaseClient";
import { X, CreditCard, Calendar, Edit3, Trash2, RefreshCw } from "lucide-react";

const PaymentHistoryDrawer = ({ invoice, isOpen, onClose, onRefresh }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPaid, setTotalPaid] = useState(0);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPayments = async () => {
    if (!invoice || !isOpen) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payment_history_view")
        .select("*")
        .eq("invoice_id", invoice.dbId)
        .order("payment_date", { ascending: false });

      if (error) throw error;

      setPayments(data || []);
      const total = (data || []).reduce((s, p) => s + Number(p.amount_received || 0), 0);
      setTotalPaid(total);
    } catch (err) {
      console.error("Payment history fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && invoice) {
      setEditingId(null);
      setDeletingId(null);
      fetchPayments();
    }
  }, [invoice, isOpen]);

  if (!isOpen || !invoice) return null;

  const formatCurrency = (val) =>
    `₹ ${Number(val || 0).toLocaleString("en-IN")}`;

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  /* ── Start edit ── */
  const startEdit = (p) => {
    setDeletingId(null);
    setEditingId(p.id);
    setEditAmount(String(p.amount_received || ""));
    setEditDate(p.payment_date?.slice(0, 10) || "");
    setEditRemarks(p.remarks || "");
  };

  /* ── Save edit ── */
  const handleSave = async () => {
    if (!editingId) return;
    if (!editAmount || Number(editAmount) <= 0) {
      showToast("error", "Amount must be greater than 0");
      return;
    }
    setSaving(true);
    try {
      // UPDATE payments_received
      // Triggers fire automatically:
      //   trg_payment_received_update_bank  → updates bank_entry amount/date
      //   trg_recalculate_invoice_update    → recalculates outstanding on invoice
      const { error } = await supabase
        .from("payments_received")
        .update({
          amount_received: Number(editAmount),
          payment_date: editDate,
          remarks: editRemarks,
        })
        .eq("id", editingId);

      if (error) throw error;

      showToast("success", "Payment updated");
      setEditingId(null);
      await fetchPayments();
      if (onRefresh) onRefresh();

    } catch (err) {
      console.error("Save error:", err);
      showToast("error", err.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  /* ── Confirm delete ── */
  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      // DELETE payments_received
      // Triggers fire automatically:
      //   trg_payment_received_delete  → deletes linked bank_entry
      //   trg_recalculate_invoice_delete → recalculates outstanding on invoice
      const { error } = await supabase
        .from("payments_received")
        .delete()
        .eq("id", deletingId);

      if (error) throw error;

      showToast("success", "Payment deleted");
      setDeletingId(null);
      await fetchPayments();
      if (onRefresh) onRefresh();

    } catch (err) {
      console.error("Delete error:", err);
      showToast("error", err.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="flex-1 bg-black/20" onClick={onClose} />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[60] px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Drawer */}
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #022c22, #059669)" }}
        >
          <div>
            <h2 className="text-lg font-bold text-white">Payment History</h2>
            <p className="text-xs text-emerald-300 mt-0.5">
              {invoice.invoice_number || invoice.id} · {invoice.client_name || ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border-b border-slate-100 flex-shrink-0">
          <div className="bg-white rounded-2xl p-4 border border-emerald-100">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
              Total Paid
            </p>
            <p className="text-lg font-bold text-emerald-600">
              {formatCurrency(totalPaid)}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-blue-100">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
              Payments
            </p>
            <p className="text-lg font-bold text-blue-600">{payments.length}</p>
          </div>
        </div>

        {/* Payment list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
            </div>
          )}

          {!loading && payments.length === 0 && (
            <div className="text-center text-slate-400 py-10 text-sm">
              No payments recorded for this invoice
            </div>
          )}

          {!loading &&
            payments.map((p) => {
              const isEdit = editingId === p.id;
              const isDel = deletingId === p.id;

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border transition-all ${
                    isEdit
                      ? "border-emerald-300 bg-emerald-50"
                      : isDel
                      ? "border-rose-300 bg-rose-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {/* Payment row */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">
                          {formatCurrency(p.amount_received)}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {fmtDate(p.payment_date)}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {p.payment_ref}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => isEdit ? setEditingId(null) : startEdit(p)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                          isEdit
                            ? "bg-slate-100 text-slate-500"
                            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        }`}
                        title="Edit"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => isDel ? setDeletingId(null) : setDeletingId(p.id)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                          isDel
                            ? "bg-slate-100 text-slate-500"
                            : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                        }`}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {isEdit && (
                    <div className="px-4 pb-4 border-t border-emerald-200 pt-3">
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">
                            Amount (₹)
                          </label>
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">
                            Payment Date
                          </label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">
                            Remarks
                          </label>
                          <input
                            type="text"
                            value={editRemarks}
                            onChange={(e) => setEditRemarks(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                          {saving && <RefreshCw size={12} className="animate-spin" />}
                          {saving ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline delete confirm */}
                  {isDel && (
                    <div className="px-4 pb-4 border-t border-rose-200 pt-3">
                      <p className="text-xs text-rose-700 font-semibold mb-1">
                        Delete this payment?
                      </p>
                      <p className="text-xs text-rose-500 mb-3">
                        {formatCurrency(p.amount_received)} · {fmtDate(p.payment_date)}
                        — This will update the invoice outstanding amount.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeletingId(null)}
                          className="flex-1 py-2 border border-rose-300 rounded-lg text-sm text-rose-600 hover:bg-rose-100"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteConfirm}
                          disabled={deleting}
                          className="flex-1 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                          {deleting && <RefreshCw size={12} className="animate-spin" />}
                          {deleting ? "Deleting…" : "Yes, Delete"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryDrawer;