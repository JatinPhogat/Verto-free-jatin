import React, { useEffect, useState } from "react";
import supabase from "../lib/supabaseClient";
import Card from "./ui/Card";
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  CreditCard,
  FileX,
  ArrowLeftRight,
} from "lucide-react";

// ─── TYPE CONFIG ───────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  "Payment Received": {
    icon: TrendingDown,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    badge: "bg-emerald-100 text-emerald-700",
    sign: "-",
  },
  "Bounce Back": {
    icon: RefreshCw,
    color: "text-rose-600",
    bg: "bg-rose-100",
    badge: "bg-rose-100 text-rose-700",
    sign: "+",
  },
  "Credit Note / Bad Debt": {
    icon: FileX,
    color: "text-amber-600",
    bg: "bg-amber-100",
    badge: "bg-amber-100 text-amber-700",
    sign: "-",
  },
  "Billable Expense": {
    icon: TrendingUp,
    color: "text-indigo-600",
    bg: "bg-indigo-100",
    badge: "bg-indigo-100 text-indigo-700",
    sign: "+",
  },
  "Payment Made": {
    icon: CreditCard,
    color: "text-gray-500",
    bg: "bg-gray-100",
    badge: "bg-gray-100 text-gray-600",
    sign: "—",
  },
};

const LedgerPage = () => {
  const [ledger, setLedger] = useState([]);
  const [opening, setOpening] = useState(0);
  const [invoice, setInvoice] = useState(null);
  const [outstanding, setOutstanding] = useState(0);
  const [loading, setLoading] = useState(false);

  // ── Get invoice from global state ──
  useEffect(() => {
    setInvoice(window.ledgerInvoice || null);
  }, []);

  useEffect(() => {
    if (!invoice?.dbId) return;
    fetchLedger();
  }, [invoice]);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      // 1. Base invoice
      const { data: inv, error: invErr } = await supabase
        .from("invoices")
        .select("id, invoice_value, receivable_amount, invoice_number")
        .eq("id", invoice.dbId)
        .single();

      if (invErr || !inv) {
        console.error("Invoice fetch error:", invErr);
        return;
      }

      // Opening balance = original invoice value (what client owes)
      setOpening(inv.invoice_value);

      // 2. Fetch all transaction types in parallel
      const [
        { data: payments },
        { data: paymentsMade },
        { data: bounces },
        { data: cns },
      ] = await Promise.all([
        supabase
          .from("payments_received")
          .select("*")
          .eq("invoice_id", invoice.dbId)
          .order("payment_date", { ascending: true }),

        supabase
          .from("payments_made")
          .select("*")
          .eq("invoice_id", invoice.dbId)
          .order("payment_date", { ascending: true }),

        supabase
          .from("bounce_back")
          .select("*")
          .eq("invoice_id", invoice.dbId)
          .order("bounce_date", { ascending: true }),

        supabase
          .from("credit_note_bad_debt")
          .select("*")
          .eq("invoice_id", invoice.dbId)
          .order("issue_date", { ascending: true }),
      ]);

      let rows = [];

      // ── Payment Received → reduces outstanding ──
      payments?.forEach((p) =>
        rows.push({
          type: "Payment Received",
          // Negative = reduces balance
          amount: -Number(p.amount_received || 0),
          date: p.payment_date,
          ref: p.payment_ref,
          remarks: null,
        })
      );

      // ── Payment Made ──
      // Non-billable → does NOT affect invoice outstanding (amount = 0)
      // Billable     → adds to outstanding (client owes more)
      paymentsMade?.forEach((p) =>
        rows.push({
          type: p.is_billable ? "Billable Expense" : "Payment Made",
          // ✅ Billable adds transfer_amount to outstanding; non-billable = 0 effect
          amount: p.is_billable
            ? +Number(p.transfer_amount || p.amount || 0)
            : 0,
          date: p.payment_date,
          ref: null,
          remarks: p.payment_description || p.expense_remarks || p.remarks,
          expenseHead: p.pay_head,
          isBillable: p.is_billable,
          // Show the actual amount paid for display even if no balance effect
          displayAmount: Number(p.transfer_amount || p.amount || 0),
        })
      );

      // ── Bounce Back → reverses a payment, increases outstanding ──
      bounces?.forEach((b) =>
        rows.push({
          type: "Bounce Back",
          amount: +Number(b.amount || 0),
          date: b.bounce_date || b.created_at,
          ref: b.payment_ref,
          remarks: b.remarks,
        })
      );

      // ── Credit Note / Bad Debt → reduces outstanding ──
      cns?.forEach((c) =>
        rows.push({
          type: "Credit Note / Bad Debt",
          amount: -Number(c.amount || 0),
          date: c.issue_date || c.created_at,
          ref: null,
          remarks: c.remarks,
        })
      );

      // Sort all by date ascending
      rows.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Running balance starting from invoice_value
      let balance = inv.invoice_value;
      const finalLedger = rows.map((r) => {
        balance += r.amount;
        return { ...r, balance };
      });

      setLedger(finalLedger);
      setOutstanding(balance); // final running balance
    } catch (err) {
      console.error("Ledger error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (val) => `₹ ${Number(val || 0).toLocaleString("en-IN")}`;

  const fmtDate = (d) => {
    if (!d) return "—";
    const date = new Date(d);
    return isNaN(date)
      ? d
      : date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  };

  if (!invoice) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.setActiveTab?.("dashboard")}
            className="p-2 rounded-xl hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Ledger View</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Invoice: <span className="font-semibold">{invoice.id}</span>
            </p>
          </div>
        </div>

        <button
          onClick={fetchLedger}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">
            Opening Balance
          </p>
          <p className="text-2xl font-bold text-blue-700">{fmt(opening)}</p>
          <p className="text-xs text-blue-400 mt-1">Invoice value (original)</p>
        </div>

        <div
          className={`rounded-2xl p-4 border ${
            outstanding <= 0
              ? "bg-emerald-50 border-emerald-100"
              : "bg-purple-50 border-purple-100"
          }`}
        >
          <p
            className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
              outstanding <= 0 ? "text-emerald-600" : "text-purple-600"
            }`}
          >
            Final Outstanding
          </p>
          <p
            className={`text-2xl font-bold ${
              outstanding <= 0 ? "text-emerald-700" : "text-purple-700"
            }`}
          >
            {fmt(Math.max(outstanding, 0))}
          </p>
          <p
            className={`text-xs mt-1 ${
              outstanding <= 0 ? "text-emerald-400" : "text-purple-400"
            }`}
          >
            {outstanding <= 0 ? "✅ Fully paid" : "Amount still owed"}
          </p>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
          <span
            key={type}
            className={`text-xs px-2 py-1 rounded-full font-medium ${cfg.badge}`}
          >
            {cfg.sign !== "—" ? cfg.sign : ""} {type}
          </span>
        ))}
      </div>

      {/* ── Ledger Rows ── */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 opacity-40" />
          <p>Loading ledger...</p>
        </div>
      ) : ledger.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-2xl">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No transactions found</p>
          <p className="text-sm mt-1">
            Payments and adjustments will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ledger.map((row, i) => {
            const cfg = TYPE_CONFIG[row.type] || TYPE_CONFIG["Payment Made"];
            const Icon = cfg.icon;
            const isNoEffect = row.amount === 0;

            return (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Icon */}
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${cfg.bg}`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}
                      >
                        {row.type}
                      </span>
                      {row.isBillable && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                          Billable
                        </span>
                      )}
                    </div>

                    {/* Amount effect on balance */}
                    {isNoEffect ? (
                      <div className="space-y-1">
                        {/* 🔥 BIG BANK AMOUNT */}
                        <p className="text-xl font-bold text-rose-600">
                          - {fmt(row.displayAmount)}
                        </p>

                        {/* 🔥 STATUS */}
                        <p className="text-sm text-gray-500 italic">
                          No effect on outstanding
                        </p>

                        {/* 🔥 BANK TAG */}
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-50 border border-rose-100">
                          <ArrowLeftRight className="w-3 h-3 text-rose-500" />

                          <span className="text-xs font-medium text-rose-600">
                            Bank Deduction
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p
                        className={`text-base font-bold ${
                          row.amount < 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {row.amount > 0 ? "+" : ""}
                        {fmt(Math.abs(row.amount))}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {fmtDate(row.date)}
                      </span>
                      {row.ref && (
                        <span className="text-xs text-gray-400 font-mono">
                          {row.ref}
                        </span>
                      )}
                      {row.expenseHead && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {row.expenseHead}
                        </span>
                      )}
                    </div>

                    {row.remarks && (
                      <p className="text-xs text-gray-500 mt-1.5 truncate">
                        💬 {row.remarks}
                      </p>
                    )}
                  </div>

                  {/* Running Balance */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400 mb-0.5">Balance</p>
                    <p
                      className={`font-bold text-base ${
                        row.balance <= 0 ? "text-emerald-600" : "text-gray-900"
                      }`}
                    >
                      {fmt(Math.max(row.balance, 0))}
                    </p>
                    {row.balance < 0 && (
                      <p className="text-xs text-emerald-500 mt-0.5">
                        Overpaid
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Footer Summary ── */}
      {ledger.length > 0 && (
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Received</p>
              <p className="font-bold text-emerald-600">
                {fmt(
                  ledger
                    .filter((r) => r.type === "Payment Received")
                    .reduce((s, r) => s + Math.abs(r.amount), 0)
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Bounced</p>
              <p className="font-bold text-rose-600">
                {fmt(
                  ledger
                    .filter((r) => r.type === "Bounce Back")
                    .reduce((s, r) => s + r.amount, 0)
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Credit Notes</p>
              <p className="font-bold text-amber-600">
                {fmt(
                  ledger
                    .filter((r) => r.type === "Credit Note / Bad Debt")
                    .reduce((s, r) => s + Math.abs(r.amount), 0)
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerPage;
