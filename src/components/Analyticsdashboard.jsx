import React, { useState, useEffect, useCallback, useMemo } from "react";
import supabase from "../lib/supabaseClient";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, Tooltip, XAxis, YAxis,
  CartesianGrid, ResponsiveContainer, Legend, LabelList,
} from "recharts";
import {
  TrendingUp, DollarSign, Users, CreditCard,
  FileText, Activity, Filter, RefreshCw,
  ChevronDown, X, ArrowUpRight, ArrowDownRight,
  Wallet, Building2, BarChart2, Search,
} from "lucide-react";

// ─── Palette ──────────────────────────────────────────────────────────────────
const P = {
  blue:    "#3b82f6",
  indigo:  "#6366f1",
  violet:  "#8b5cf6",
  emerald: "#10b981",
  amber:   "#f59e0b",
  rose:    "#f43f5e",
  sky:     "#0ea5e9",
  teal:    "#14b8a6",
  orange:  "#f97316",
  pink:    "#ec4899",
};
const CHART_COLORS = Object.values(P);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => {
  const v = Number(n || 0);
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)}L`;
  if (v >= 1e3) return `₹${(v / 1e3).toFixed(1)}K`;
  return `₹${v.toLocaleString("en-IN")}`;
};
const fmtFull  = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtMonth = (d) => {
  if (!d) return "";
  const s = d.length === 7 ? d + "-01" : d;
  return new Date(s).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
};
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "";

// ─── Determine bank entry direction from entry_type ───────────────────────────
// CRITICAL: flow_type is NULL for payment_received rows.
// Only entry_type reliably tells us direction.
const isBankInflow     = (b) => b.entry_type === "payment_received";
const isSoftwareInflow = (s) =>
  s.flow_type === "inflow" || (s.flow_type == null && Number(s.amount) > 0);

const SOURCE_LABEL = {
  payments_received:        "Payment In",
  os_payouts:               "OS Payout",
  os_payout_bouncebacks:    "Bounce Back",
  employee_expense_payouts: "Salary",
  statutory_payments:       "Statutory",
};

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-xl p-3 text-xs min-w-[140px]">
      {label && <p className="font-bold text-gray-700 mb-2 border-b pb-1">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-3 mt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color || p.fill }} />
            <span className="text-gray-500">{p.name}</span>
          </span>
          <span className="font-semibold text-gray-800">
            {typeof p.value === "number" && p.value > 999 ? fmtFull(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, icon: Icon, color, trend }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + "18" }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      {trend !== undefined && (
        <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
          {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
    <p className="text-xs font-semibold text-gray-500 mt-1">{label}</p>
    {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

// ─── Chart Card ───────────────────────────────────────────────────────────────
const ChartCard = ({ title, subtitle, children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${className}`}>
    <div className="mb-4">
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, color, activeFilters = [], appliesTo = [] }) => {
  const relevant = appliesTo.filter((f) => activeFilters.includes(f));
  const ignored  = activeFilters.filter((f) => !appliesTo.includes(f));
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "18" }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">{title}</h2>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mt-2 ml-10">
        {relevant.map((f) => (
          <span key={f} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />{f}
          </span>
        ))}
        {ignored.map((f) => (
          <span key={f} title={`"${f}" doesn't affect this section`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-50 text-gray-300 border border-gray-100">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />{f} ✕
          </span>
        ))}
        {activeFilters.length === 0 && (
          <span className="text-[10px] text-gray-300 font-medium">Responds to: {appliesTo.join(" · ")}</span>
        )}
      </div>
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const Empty = ({ msg = "No data for selected filters" }) => (
  <div className="flex flex-col items-center justify-center py-10 text-gray-300">
    <BarChart2 className="w-8 h-8 mb-2" />
    <p className="text-xs font-medium">{msg}</p>
  </div>
);

// ─── Filter Select ────────────────────────────────────────────────────────────
const FilterSelect = ({ label, value, onChange, options, placeholder = "All" }) => (
  <div>
    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</label>
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2 pr-8 text-xs font-medium text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 cursor-pointer">
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function AnalyticsDashboard() {

  // ── Raw data ──────────────────────────────────────────────────────────────
  const [invoices,        setInvoices]        = useState([]);
  const [payments,        setPayments]        = useState([]);
  const [osPayouts,       setOsPayouts]       = useState([]);
  const [salaries,        setSalaries]        = useState([]);
  const [team,            setTeam]            = useState([]);
  const [bankEntries,     setBankEntries]     = useState([]);
  const [softwareEntries, setSoftwareEntries] = useState([]);
  const [clients,         setClients]         = useState([]);
  const [departments,     setDepartments]     = useState([]);
  const [entities,        setEntities]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [lastFetched,     setLastFetched]     = useState(null);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    dateFrom: "", dateTo: "", impactMonth: "", department: "",
    client: "", entity: "", invoiceNumber: "", status: "", payHead: "", employee: "",
  });
  const [filtersOpen, setFiltersOpen] = useState(true);
  const setFilter    = (k, v) => setFilters((p) => ({ ...p, [k]: v }));
  const clearFilters = () => setFilters({
    dateFrom: "", dateTo: "", impactMonth: "", department: "",
    client: "", entity: "", invoiceNumber: "", status: "", payHead: "", employee: "",
  });
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: inv },
        { data: pay },
        { data: os },
        { data: sal },
        { data: tm },
        { data: be },
        { data: se },
        { data: cl },
        { data: dm },
        { data: em },
      ] = await Promise.all([
        // Invoices with explicit FK name for client join
        supabase.from("invoices").select(`
          id, invoice_number, invoice_date, impact_month, invoice_value,
          amount_received, receivable_amount, verto_fee, gst, tds,
          net_in_hand, gross_value, co_pf, co_esi, lwf_tax, pt_tax,
          employee_count, pay_head, status, client_id, department_id, entity_id,
          clients_master!invoices_client_id_fkey ( client_name ),
          departments_master ( dept_name ),
          entity_master ( entity_name )
        `),

        // Payments → invoices → clients (nested)
        supabase.from("payments_received").select(`
          id, amount_received, payment_date, invoice_id, remarks,
          invoices (
            invoice_number,
            clients_master!invoices_client_id_fkey ( client_name )
          )
        `),

        // OS Payouts
        supabase.from("os_payouts").select(`
          id, payout_month, amount_paid, employee_count, is_billable,
          pay_head, payment_date, client_id, department_id, entity_id,
          clients_master ( client_name ),
          departments_master ( dept_name ),
          entity_master ( entity_name )
        `),

        // Salary (employee expense payouts)
        supabase.from("employee_expense_payouts").select(`
          id, month_of_pay, date_of_pay, net_payment, pay_head,
          employee_name, emp_code, department_id, entity_id, bank_id,
          departments_master ( dept_name ),
          entity_master ( entity_name )
        `),

        // Internal team
        supabase.from("internal_team").select(
          "id, name, department, designation, location, ctc, status, doj, entity"
        ),

        // Bank entries — entry_type determines inflow (payment_received) vs outflow (everything else)
        supabase.from("bank_entries")
          .select("id, date, amount, flow_type, entry_type, source_table, entity")
          .eq("is_deleted", false)
          .order("date"),

        // Software entries
        supabase.from("software_entries")
          .select("id, date, amount, flow_type, source_table")
          .order("date"),

        supabase.from("clients_master").select("id, client_name"),
        supabase.from("departments_master").select("id, dept_name"),
        supabase.from("entity_master").select("id, entity_name"),
      ]);

      setInvoices(inv        || []);
      setPayments(pay        || []);
      setOsPayouts(os        || []);
      setSalaries(sal        || []);
      setTeam(tm             || []);
      setBankEntries(be      || []);
      setSoftwareEntries(se  || []);
      setClients(cl          || []);
      setDepartments(dm      || []);
      setEntities(em         || []);
      setLastFetched(new Date());
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Flatten nested joins ───────────────────────────────────────────────────
  const flatInvoices = useMemo(() => invoices.map((i) => ({
    ...i,
    client_name: i.clients_master?.client_name  || "Unknown",
    dept_name:   i.departments_master?.dept_name || "Unknown",
    entity_name: i.entity_master?.entity_name   || "Unknown",
  })), [invoices]);

  const flatPayments = useMemo(() => payments.map((p) => ({
    ...p,
    invoice_number: p.invoices?.invoice_number || "",
    client_name:    p.invoices?.clients_master?.client_name || "Unknown",
  })), [payments]);

  const flatOs = useMemo(() => osPayouts.map((o) => ({
    ...o,
    client_name: o.clients_master?.client_name  || "Unknown",
    dept_name:   o.departments_master?.dept_name || "Unknown",
    entity_name: o.entity_master?.entity_name   || "Unknown",
  })), [osPayouts]);

  const flatSalaries = useMemo(() => salaries.map((s) => ({
    ...s,
    dept_name:   s.departments_master?.dept_name || "Unknown",
    entity_name: s.entity_master?.entity_name    || "Unknown",
  })), [salaries]);

  // ── Apply filters ──────────────────────────────────────────────────────────
  const filteredInvoices = useMemo(() => flatInvoices.filter((i) => {
    if (filters.dateFrom     && i.invoice_date < filters.dateFrom)                    return false;
    if (filters.dateTo       && i.invoice_date > filters.dateTo)                      return false;
    if (filters.impactMonth  && i.impact_month?.slice(0, 7) !== filters.impactMonth)  return false;
    if (filters.department   && i.dept_name    !== filters.department)                return false;
    if (filters.client       && i.client_name  !== filters.client)                   return false;
    if (filters.entity       && i.entity_name  !== filters.entity)                   return false;
    if (filters.status       && i.status       !== filters.status)                   return false;
    if (filters.payHead      && i.pay_head     !== filters.payHead)                  return false;
    if (filters.invoiceNumber && !i.invoice_number?.toLowerCase().includes(filters.invoiceNumber.toLowerCase())) return false;
    return true;
  }), [flatInvoices, filters]);

  const filteredPayments = useMemo(() => flatPayments.filter((p) => {
    if (filters.dateFrom      && p.payment_date < filters.dateFrom)  return false;
    if (filters.dateTo        && p.payment_date > filters.dateTo)    return false;
    if (filters.client        && p.client_name  !== filters.client)  return false;
    if (filters.invoiceNumber && !p.invoice_number?.toLowerCase().includes(filters.invoiceNumber.toLowerCase())) return false;
    return true;
  }), [flatPayments, filters]);

  const filteredOs = useMemo(() => flatOs.filter((o) => {
    if (filters.dateFrom   && o.payment_date && o.payment_date < filters.dateFrom) return false;
    if (filters.dateTo     && o.payment_date && o.payment_date > filters.dateTo)   return false;
    if (filters.department && o.dept_name    !== filters.department) return false;
    if (filters.client     && o.client_name  !== filters.client)     return false;
    if (filters.entity     && o.entity_name  !== filters.entity)     return false;
    return true;
  }), [flatOs, filters]);

  const filteredSalaries = useMemo(() => flatSalaries.filter((s) => {
    if (filters.dateFrom   && s.date_of_pay && s.date_of_pay < filters.dateFrom) return false;
    if (filters.dateTo     && s.date_of_pay && s.date_of_pay > filters.dateTo)   return false;
    if (filters.department && s.dept_name   !== filters.department) return false;
    if (filters.entity     && s.entity_name !== filters.entity)     return false;
    if (filters.payHead    && s.pay_head    !== filters.payHead)    return false;
    if (filters.employee   && !s.employee_name?.toLowerCase().includes(filters.employee.toLowerCase())) return false;
    return true;
  }), [flatSalaries, filters]);

  const filteredTeam = useMemo(() => team.filter((t) => {
    if (filters.department && t.department !== filters.department) return false;
    if (filters.employee   && !t.name?.toLowerCase().includes(filters.employee.toLowerCase())) return false;
    return true;
  }), [team, filters]);

  const filteredBank = useMemo(() => bankEntries.filter((b) => {
    if (filters.dateFrom && b.date < filters.dateFrom) return false;
    if (filters.dateTo   && b.date > filters.dateTo)   return false;
    return true;
  }), [bankEntries, filters]);

  const filteredSoftware = useMemo(() => softwareEntries.filter((s) => {
    if (filters.dateFrom && s.date < filters.dateFrom) return false;
    if (filters.dateTo   && s.date > filters.dateTo)   return false;
    return true;
  }), [softwareEntries, filters]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalInvoiceValue = filteredInvoices.reduce((s, i) => s + Number(i.invoice_value     || 0), 0);
    const totalVerto        = filteredInvoices.reduce((s, i) => s + Number(i.verto_fee         || 0), 0);
    const totalOutstanding  = filteredInvoices.reduce((s, i) => s + Number(i.receivable_amount || 0), 0);
    const totalReceived     = filteredPayments.reduce((s, p) => s + Number(p.amount_received   || 0), 0);
    const totalOsPayout     = filteredOs.reduce((s, o)       => s + Number(o.amount_paid       || 0), 0);
    const totalSalary       = filteredSalaries.reduce((s, e) => s + Number(e.net_payment       || 0), 0);
    const activeEmployees   = filteredTeam.filter((t) => t.status === "Active").length;
    const collectionPct     = totalInvoiceValue > 0
      ? ((totalReceived / totalInvoiceValue) * 100).toFixed(1) : "0.0";

    // Bank totals using entry_type for direction
    const bankInflow  = filteredBank.filter(isBankInflow).reduce((s, b)  => s + Math.abs(Number(b.amount || 0)), 0);
    const bankOutflow = filteredBank.filter(b => !isBankInflow(b)).reduce((s, b) => s + Math.abs(Number(b.amount || 0)), 0);
    const bankNet     = bankInflow - bankOutflow;

    return { totalInvoiceValue, totalVerto, totalOutstanding, totalReceived,
             totalOsPayout, totalSalary, activeEmployees, collectionPct,
             bankInflow, bankOutflow, bankNet };
  }, [filteredInvoices, filteredPayments, filteredOs, filteredSalaries, filteredTeam, filteredBank]);

  // ── Chart data ────────────────────────────────────────────────────────────

  // 1. Invoice by month
  const invoiceByMonth = useMemo(() => {
    const map = {};
    filteredInvoices.forEach((i) => {
      const m = i.impact_month?.slice(0, 7) || i.invoice_date?.slice(0, 7);
      if (!m) return;
      if (!map[m]) map[m] = { month: m, invoiceValue: 0, vertoFee: 0, gst: 0, tds: 0, netInHand: 0 };
      map[m].invoiceValue += Number(i.invoice_value || 0);
      map[m].vertoFee     += Number(i.verto_fee     || 0);
      map[m].gst          += Number(i.gst           || 0);
      map[m].tds          += Number(i.tds           || 0);
      map[m].netInHand    += Number(i.net_in_hand   || 0);
    });
    return Object.values(map)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((d) => ({ ...d, month: fmtMonth(d.month) }));
  }, [filteredInvoices]);

  // 2. Invoice status donut
  const invoiceStatus = useMemo(() => {
    const map = {};
    filteredInvoices.forEach((i) => { const s = i.status || "Unknown"; map[s] = (map[s] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredInvoices]);

  // 3. Revenue by client
  const revenueByClient = useMemo(() => {
    const map = {};
    filteredInvoices.forEach((i) => {
      const c = i.client_name;
      if (!map[c]) map[c] = { client: c, "Invoice Value": 0, "Verto Fee": 0, "Received": 0 };
      map[c]["Invoice Value"] += Number(i.invoice_value || 0);
      map[c]["Verto Fee"]     += Number(i.verto_fee     || 0);
    });
    filteredPayments.forEach((p) => {
      const c = p.client_name;
      if (!map[c]) map[c] = { client: c, "Invoice Value": 0, "Verto Fee": 0, "Received": 0 };
      map[c]["Received"] += Number(p.amount_received || 0);
    });
    return Object.values(map).sort((a, b) => b["Invoice Value"] - a["Invoice Value"]);
  }, [filteredInvoices, filteredPayments]);

  // 4. Revenue by dept
  const revenueByDept = useMemo(() => {
    const map = {};
    filteredInvoices.forEach((i) => {
      const d = i.dept_name;
      if (!map[d]) map[d] = { dept: d, invoiceValue: 0, vertoFee: 0 };
      map[d].invoiceValue += Number(i.invoice_value || 0);
      map[d].vertoFee     += Number(i.verto_fee     || 0);
    });
    return Object.values(map).sort((a, b) => b.invoiceValue - a.invoiceValue);
  }, [filteredInvoices]);

  // 5. Pay head donut
  const payHeadInvoice = useMemo(() => {
    const map = {};
    filteredInvoices.forEach((i) => { const ph = i.pay_head || "Other"; map[ph] = (map[ph] || 0) + Number(i.invoice_value || 0); });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredInvoices]);

  // 6. Invoice value / gross / net
  const invoiceBreakdown = useMemo(() =>
    filteredInvoices.map((i) => ({
      invoice:         i.invoice_number,
      "Invoice Value": Number(i.invoice_value || 0),
      "Gross Value":   Number(i.gross_value   || 0),
      "Net in Hand":   Number(i.net_in_hand   || 0),
    }))
  , [filteredInvoices]);

  // 7. Collection per invoice — payments matched by invoice_number
  const collectionPerInvoice = useMemo(() => {
    const rcvByInv = {};
    filteredPayments.forEach((p) => {
      if (p.invoice_number) rcvByInv[p.invoice_number] = (rcvByInv[p.invoice_number] || 0) + Number(p.amount_received || 0);
    });
    return filteredInvoices.map((i) => {
      const received = rcvByInv[i.invoice_number] ?? Number(i.amount_received || 0);
      const pct = Number(i.invoice_value) > 0 ? Math.round((received / Number(i.invoice_value)) * 100) : 0;
      return {
        invoice:           i.invoice_number,
        "Invoice Value":   Number(i.invoice_value || 0),
        "Amount Received": received,
        "Collection %":    Math.min(pct, 100),
      };
    });
  }, [filteredInvoices, filteredPayments]);

  // 8. Outstanding by client
  const outstandingByClient = useMemo(() => {
    const map = {};
    filteredInvoices.forEach((i) => {
      const out = Number(i.receivable_amount || 0);
      if (out <= 0) return;
      map[i.client_name] = (map[i.client_name] || 0) + out;
    });
    return Object.entries(map)
      .map(([client, outstanding]) => ({ client, outstanding }))
      .sort((a, b) => b.outstanding - a.outstanding);
  }, [filteredInvoices]);

  // 9. Payments trend (daily)
  const paymentsTrend = useMemo(() => {
    const map = {};
    filteredPayments.forEach((p) => {
      const d = p.payment_date; if (!d) return;
      if (!map[d]) map[d] = { date: d, received: 0 };
      map[d].received += Number(p.amount_received || 0);
    });
    return Object.values(map)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({ ...d, date: fmtDate(d.date) }));
  }, [filteredPayments]);

  // 10. OS by month
  const osByMonth = useMemo(() => {
    const map = {};
    filteredOs.forEach((o) => {
      const m = o.payout_month?.slice(0, 7); if (!m) return;
      if (!map[m]) map[m] = { month: m, amountPaid: 0, employeeCount: 0 };
      map[m].amountPaid    += Number(o.amount_paid    || 0);
      map[m].employeeCount += Number(o.employee_count || 0);
    });
    return Object.values(map)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((d) => ({ ...d, month: fmtMonth(d.month) }));
  }, [filteredOs]);

  // 11. OS by client
  const osByClient = useMemo(() => {
    const map = {};
    filteredOs.forEach((o) => {
      const c = o.client_name;
      if (!map[c]) map[c] = { client: c, amountPaid: 0, employeeCount: 0 };
      map[c].amountPaid    += Number(o.amount_paid    || 0);
      map[c].employeeCount += Number(o.employee_count || 0);
    });
    return Object.values(map).sort((a, b) => b.amountPaid - a.amountPaid);
  }, [filteredOs]);

  // 12. Billable vs non-billable OS
  const osBillable = useMemo(() => {
    let b = 0, nb = 0;
    filteredOs.forEach((o) => {
      if (o.is_billable) b += Number(o.amount_paid || 0);
      else               nb += Number(o.amount_paid || 0);
    });
    return [{ name: "Billable", value: b }, { name: "Non-Billable", value: nb }].filter((d) => d.value > 0);
  }, [filteredOs]);

  // 13. Salary by month
  const salaryByMonth = useMemo(() => {
    const map = {};
    filteredSalaries.forEach((s) => {
      const m = s.month_of_pay?.slice(0, 7); if (!m) return;
      if (!map[m]) map[m] = { month: m, salary: 0, count: 0 };
      map[m].salary += Number(s.net_payment || 0);
      map[m].count  += 1;
    });
    return Object.values(map)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((d) => ({ ...d, month: fmtMonth(d.month) }));
  }, [filteredSalaries]);

  // 14. Salary by dept
  const salaryByDept = useMemo(() => {
    const map = {};
    filteredSalaries.forEach((s) => {
      const d = s.dept_name;
      if (!map[d]) map[d] = { dept: d, salary: 0, count: 0 };
      map[d].salary += Number(s.net_payment || 0);
      map[d].count  += 1;
    });
    return Object.values(map).sort((a, b) => b.salary - a.salary);
  }, [filteredSalaries]);

  // 15. Salary pay head donut
  const salaryPayHead = useMemo(() => {
    const map = {};
    filteredSalaries.forEach((s) => { const ph = s.pay_head || "Other"; map[ph] = (map[ph] || 0) + Number(s.net_payment || 0); });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredSalaries]);

  // 16. Team by dept (uses short codes: OS, Rec, BD, Accts, Common, Temp)
  const teamByDept = useMemo(() => {
    const map = {};
    filteredTeam.forEach((t) => {
      const d = t.department || "Unknown";
      if (!map[d]) map[d] = { dept: d, count: 0, ctc: 0, active: 0 };
      map[d].count += 1;
      map[d].ctc   += Number(t.ctc || 0);
      if (t.status === "Active") map[d].active += 1;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [filteredTeam]);

  // 17. Team status donut
  const teamStatus = useMemo(() => {
    const map = {};
    filteredTeam.forEach((t) => { const s = t.status || "Unknown"; map[s] = (map[s] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredTeam]);

  // 18. Designations
  const designations = useMemo(() => {
    const map = {};
    filteredTeam.forEach((t) => { if (!t.designation) return; map[t.designation] = (map[t.designation] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name, count]) => ({ name, count }));
  }, [filteredTeam]);

  // 19. Location distribution
  const locationDist = useMemo(() => {
    const map = {};
    filteredTeam.forEach((t) => { if (!t.location) return; map[t.location] = (map[t.location] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name, count]) => ({ name, count }));
  }, [filteredTeam]);

  // 20. CTC histogram
  const ctcHistogram = useMemo(() => {
    const buckets = [
      { label: "< 20K",  min: 0,     max: 20000    },
      { label: "20–30K", min: 20000,  max: 30000    },
      { label: "30–50K", min: 30000,  max: 50000    },
      { label: "50–75K", min: 50000,  max: 75000    },
      { label: "75K+",   min: 75000,  max: Infinity },
    ];
    return buckets.map((b) => ({
      range: b.label,
      count: filteredTeam.filter((t) => { const c = Number(t.ctc || 0); return c >= b.min && c < b.max; }).length,
    }));
  }, [filteredTeam]);

  // 21. Bank cash flow (FIXED: use entry_type not flow_type)
  const bankFlow = useMemo(() => {
    const map = {};
    filteredBank.forEach((b) => {
      const d = b.date; if (!d) return;
      if (!map[d]) map[d] = { date: d, Inflow: 0, Outflow: 0 };
      const amt = Math.abs(Number(b.amount || 0));
      if (isBankInflow(b)) map[d].Inflow  += amt;
      else                 map[d].Outflow += amt;
    });
    return Object.values(map)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({ ...d, date: fmtDate(d.date) }));
  }, [filteredBank]);

  // 22. Software flow
  const softwareFlow = useMemo(() => {
    const map = {};
    filteredSoftware.forEach((s) => {
      const d = s.date; if (!d) return;
      if (!map[d]) map[d] = { date: d, Inflow: 0, Outflow: 0 };
      const amt = Math.abs(Number(s.amount || 0));
      if (isSoftwareInflow(s)) map[d].Inflow  += amt;
      else                     map[d].Outflow += amt;
    });
    return Object.values(map)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({ ...d, date: fmtDate(d.date) }));
  }, [filteredSoftware]);

  // 23. Cash by source (bank + software combined)
  const cashBySource = useMemo(() => {
    const map = {};
    filteredBank.forEach((b) => {
      const src = SOURCE_LABEL[b.source_table] || b.source_table || "Other";
      if (!map[src]) map[src] = { source: src, Inflow: 0, Outflow: 0 };
      const amt = Math.abs(Number(b.amount || 0));
      if (isBankInflow(b)) map[src].Inflow  += amt;
      else                 map[src].Outflow += amt;
    });
    filteredSoftware.forEach((s) => {
      const src = SOURCE_LABEL[s.source_table] || s.source_table || "Software";
      if (!map[src]) map[src] = { source: src, Inflow: 0, Outflow: 0 };
      const amt = Math.abs(Number(s.amount || 0));
      if (isSoftwareInflow(s)) map[src].Inflow  += amt;
      else                     map[src].Outflow += amt;
    });
    return Object.values(map).filter((d) => d.Inflow > 0 || d.Outflow > 0);
  }, [filteredBank, filteredSoftware]);

  // 24. Statutory from invoices
  const statutoryByInvoice = useMemo(() =>
    filteredInvoices
      .filter((i) => Number(i.co_pf || 0) + Number(i.co_esi || 0) + Number(i.lwf_tax || 0) + Number(i.pt_tax || 0) > 0)
      .map((i) => ({
        invoice:   i.invoice_number,
        "Co. PF":  Number(i.co_pf   || 0),
        "Co. ESI": Number(i.co_esi  || 0),
        "LWF":     Number(i.lwf_tax || 0),
        "PT":      Number(i.pt_tax  || 0),
      }))
  , [filteredInvoices]);

  // ── Filter option lists ───────────────────────────────────────────────────
  const clientOptions  = clients.map((c)     => ({ value: c.client_name, label: c.client_name }));
  const entityOptions  = entities.map((e)    => ({ value: e.entity_name, label: e.entity_name }));
  const deptOptions    = departments.map((d) => ({ value: d.dept_name,   label: d.dept_name   }));
  const statusOptions  = [...new Set(invoices.map((i) => i.status).filter(Boolean))].map((s) => ({ value: s, label: s }));
  const payHeadOptions = [...new Set([
    ...invoices.map((i) => i.pay_head),
    ...salaries.map((s) => s.pay_head),
  ].filter(Boolean))].map((p) => ({ value: p, label: p }));
  const impactMonthOptions = [...new Set(invoices.map((i) => i.impact_month?.slice(0, 7)).filter(Boolean))]
    .sort().reverse().map((m) => ({ value: m, label: fmtMonth(m) }));

  const FILTER_LABELS = {
    dateFrom: "Date From", dateTo: "Date To", impactMonth: "Impact Month",
    department: "Department", client: "Client", entity: "Entity",
    invoiceNumber: "Invoice #", status: "Status", payHead: "Pay Head", employee: "Employee",
  };
  const activeFilterLabels = Object.entries(filters).filter(([, v]) => Boolean(v)).map(([k]) => FILTER_LABELS[k] || k);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center animate-pulse">
          <BarChart2 className="w-5 h-5 text-white" />
        </div>
        <p className="text-sm text-gray-400 font-medium">Loading analytics…</p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Analytics Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Admin · Live from Supabase
            {lastFetched && ` · Updated ${lastFetched.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFiltersOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              filtersOpen ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
            }`}>
            <Filter className="w-3.5 h-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-blue-600 text-[10px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button onClick={fetchAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:border-blue-300 transition-all">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      {filtersOpen && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Advanced Filters</span>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-semibold">
                <X className="w-3 h-3" /> Clear all ({activeFilterCount})
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Date From</label>
              <input type="date" value={filters.dateFrom} onChange={(e) => setFilter("dateFrom", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Date To</label>
              <input type="date" value={filters.dateTo} onChange={(e) => setFilter("dateTo", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <FilterSelect label="Impact Month"   value={filters.impactMonth} onChange={(v) => setFilter("impactMonth", v)} options={impactMonthOptions} />
            <FilterSelect label="Department"     value={filters.department}  onChange={(v) => setFilter("department", v)}  options={deptOptions} />
            <FilterSelect label="Client"         value={filters.client}      onChange={(v) => setFilter("client", v)}      options={clientOptions} />
            <FilterSelect label="Entity"         value={filters.entity}      onChange={(v) => setFilter("entity", v)}      options={entityOptions} />
            <FilterSelect label="Invoice Status" value={filters.status}      onChange={(v) => setFilter("status", v)}      options={statusOptions} />
            <FilterSelect label="Pay Head"       value={filters.payHead}     onChange={(v) => setFilter("payHead", v)}     options={payHeadOptions} />
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Invoice #</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                <input type="text" value={filters.invoiceNumber} onChange={(e) => setFilter("invoiceNumber", e.target.value)}
                  placeholder="Search…"
                  className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Employee</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                <input type="text" value={filters.employee} onChange={(e) => setFilter("employee", e.target.value)}
                  placeholder="Search…"
                  className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total Invoice Value" value={fmt(kpis.totalInvoiceValue)} sub={`${filteredInvoices.length} invoice${filteredInvoices.length !== 1 ? "s" : ""}`} icon={FileText} color={P.blue} />
        <KpiCard label="Total Collected"     value={fmt(kpis.totalReceived)}     sub={`${kpis.collectionPct}% collection rate`} icon={DollarSign} color={P.emerald} />
        <KpiCard label="Outstanding"         value={fmt(kpis.totalOutstanding)}  sub={outstandingByClient.length > 0 ? `${outstandingByClient.length} client(s) pending` : "All cleared ✓"} icon={Activity} color={kpis.totalOutstanding > 0 ? P.amber : P.emerald} />
        <KpiCard label="Verto Fee Earned"    value={fmt(kpis.totalVerto)}        sub="Across filtered invoices" icon={TrendingUp} color={P.indigo} />
        <KpiCard label="OS Payout"           value={fmt(kpis.totalOsPayout)}     sub={`${filteredOs.length} payout${filteredOs.length !== 1 ? "s" : ""}`} icon={Wallet} color={P.orange} />
        <KpiCard label="Salary Paid"         value={fmt(kpis.totalSalary)}       sub={`${filteredSalaries.length} entries`} icon={CreditCard} color={P.violet} />
        <KpiCard label="Active Employees"    value={kpis.activeEmployees}        sub="Internal team (filtered)" icon={Users} color={P.teal} />
        <KpiCard label="Bank Net Flow"       value={fmt(kpis.bankNet)}           sub={`In: ${fmt(kpis.bankInflow)} · Out: ${fmt(kpis.bankOutflow)}`} icon={Building2} color={kpis.bankNet >= 0 ? P.emerald : P.rose} />
      </div>

      {/* ══ SECTION 1: REVENUE & INVOICING ══ */}
      <SectionHeader icon={TrendingUp} title="Revenue & Invoicing" color={P.blue}
        activeFilters={activeFilterLabels}
        appliesTo={["Date From", "Date To", "Impact Month", "Department", "Client", "Entity", "Invoice #", "Status", "Pay Head"]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Invoice Value by Month" subtitle="Grouped by impact month">
          {invoiceByMonth.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={invoiceByMonth} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmt} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="invoiceValue" name="Invoice Value" fill={P.blue}   radius={[4, 4, 0, 0]} />
                <Bar dataKey="vertoFee"     name="Verto Fee"     fill={P.indigo} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Invoice Status Distribution" subtitle="Count by status">
          {invoiceStatus.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={invoiceStatus} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={55} outerRadius={90} paddingAngle={3}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                  {invoiceStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Revenue by Client" subtitle="Invoice value, verto fee & amount received per client">
          {revenueByClient.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={Math.max(220, revenueByClient.length * 55)}>
              <BarChart data={revenueByClient} layout="vertical" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={fmt} />
                <YAxis dataKey="client" type="category" tick={{ fontSize: 9 }} width={130} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Invoice Value" fill={P.blue}    radius={[0, 4, 4, 0]} />
                <Bar dataKey="Verto Fee"     fill={P.indigo}  radius={[0, 4, 4, 0]} />
                <Bar dataKey="Received"      fill={P.emerald} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Revenue by Department" subtitle="Invoice value per department">
          {revenueByDept.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueByDept} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dept" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmt} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="invoiceValue" name="Invoice Value" fill={P.indigo} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="invoiceValue" position="top" formatter={fmt} style={{ fontSize: 9, fill: "#6366f1" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Pay Head Distribution" subtitle="Invoice value by pay head">
          {payHeadInvoice.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={payHeadInvoice} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={90} paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {payHeadInvoice.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="GST & TDS by Month" subtitle="Tax components from invoices">
          {invoiceByMonth.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={invoiceByMonth} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmt} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="gst" name="GST" fill={P.amber} radius={[4, 4, 0, 0]} />
                <Bar dataKey="tds" name="TDS" fill={P.rose}  radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {invoiceBreakdown.length > 0 && (
        <ChartCard title="Invoice Value vs Gross vs Net-in-Hand" subtitle="Side-by-side per invoice">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={invoiceBreakdown} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="invoice" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={fmt} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="Invoice Value" fill={P.blue}    radius={[4, 4, 0, 0]} />
              <Bar dataKey="Gross Value"   fill={P.indigo}  radius={[4, 4, 0, 0]} />
              <Bar dataKey="Net in Hand"   fill={P.emerald} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ══ SECTION 2: COLLECTIONS ══ */}
      <SectionHeader icon={DollarSign} title="Collections" color={P.emerald}
        activeFilters={activeFilterLabels}
        appliesTo={["Date From", "Date To", "Invoice #", "Client"]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Invoice Value vs Amount Collected" subtitle="Per invoice comparison">
          {collectionPerInvoice.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={collectionPerInvoice} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="invoice" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmt} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Invoice Value"   fill={P.blue}    radius={[4, 4, 0, 0]} />
                <Bar dataKey="Amount Received" fill={P.emerald} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Collection Rate per Invoice" subtitle="% of invoice value collected">
          {collectionPerInvoice.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={collectionPerInvoice} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="invoice" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Collection %" fill={P.teal} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="Collection %" position="top" formatter={(v) => `${v}%`} style={{ fontSize: 9, fill: "#14b8a6" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Payments Received Trend" subtitle="Daily collection amounts">
          {paymentsTrend.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={paymentsTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="rcvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={P.emerald} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={P.emerald} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmt} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="received" name="Received" stroke={P.emerald} fill="url(#rcvGrad)" strokeWidth={2} dot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Outstanding by Client" subtitle="Remaining receivable per client">
          {outstandingByClient.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-emerald-500">
              <DollarSign className="w-8 h-8 mb-2" />
              <p className="text-xs font-semibold">No outstanding amounts 🎉</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={outstandingByClient} layout="vertical" margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={fmt} />
                <YAxis dataKey="client" type="category" tick={{ fontSize: 9 }} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="outstanding" name="Outstanding" fill={P.amber} radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="outstanding" position="right" formatter={fmt} style={{ fontSize: 9, fill: "#f59e0b" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ══ SECTION 3: OUTFLOWS ══ */}
      <SectionHeader icon={Wallet} title="Outflows — OS Payouts & Salary" color={P.orange}
        activeFilters={activeFilterLabels}
        appliesTo={["Date From", "Date To", "Department", "Client", "Entity", "Pay Head", "Employee"]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredOs.length === 0 ? (
          <ChartCard title="OS Payout by Month" subtitle="No OS payouts for selected filters" className="lg:col-span-2">
            <Empty msg="No OS payout data" />
          </ChartCard>
        ) : (
          <>
            <ChartCard title="OS Payout by Month" subtitle="Amount paid to outsourced staff">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={osByMonth} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={fmt} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amountPaid" name="Amount Paid" fill={P.orange} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Billable vs Non-Billable OS" subtitle="OS payout split">
              {osBillable.length === 0 ? <Empty /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={osBillable} dataKey="value" nameKey="name" cx="50%" cy="50%"
                      innerRadius={55} outerRadius={90} paddingAngle={3}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {osBillable.map((_, i) => <Cell key={i} fill={i === 0 ? P.orange : P.sky} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="OS Payout by Client" subtitle="Amount paid per client">
              <ResponsiveContainer width="100%" height={Math.max(220, osByClient.length * 55)}>
                <BarChart data={osByClient} layout="vertical" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={fmt} />
                  <YAxis dataKey="client" type="category" tick={{ fontSize: 9 }} width={120} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amountPaid" name="Amount Paid" fill={P.orange} radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="amountPaid" position="right" formatter={fmt} style={{ fontSize: 9, fill: "#f97316" }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="OS Employee Count by Month" subtitle="Headcount deployed">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={osByMonth} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="employeeCount" name="Employee Count" stroke={P.amber} strokeWidth={2} dot={{ r: 5, fill: P.amber }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </>
        )}

        <ChartCard title="Salary Paid by Month" subtitle="Internal team net salary outflow">
          {salaryByMonth.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={salaryByMonth} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmt} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="salary" name="Net Salary" fill={P.violet} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="count" position="top" formatter={(v) => `${v} emp`} style={{ fontSize: 9, fill: "#8b5cf6" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Salary by Department" subtitle="Net salary per department">
          {salaryByDept.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={Math.max(220, salaryByDept.length * 45)}>
              <BarChart data={salaryByDept} layout="vertical" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={fmt} />
                <YAxis dataKey="dept" type="category" tick={{ fontSize: 9 }} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="salary" name="Net Salary" fill={P.violet} radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="salary" position="right" formatter={fmt} style={{ fontSize: 9, fill: "#8b5cf6" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Salary Pay Head Split" subtitle="Distribution by pay head type">
          {salaryPayHead.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={salaryPayHead} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={55} outerRadius={90} paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {salaryPayHead.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ══ SECTION 4: INTERNAL TEAM ══ */}
      <SectionHeader icon={Users} title="Internal Team — Headcount & Cost" color={P.teal}
        activeFilters={activeFilterLabels}
        appliesTo={["Department", "Employee"]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Employee Count by Department" subtitle="Short dept codes: OS, Rec, BD, Accts, Temp, Common">
          {teamByDept.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={teamByDept} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dept" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Employees" fill={P.teal} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="count" position="top" style={{ fontSize: 10, fill: "#14b8a6", fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Total CTC by Department" subtitle="Monthly salary burden per department">
          {teamByDept.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={teamByDept} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dept" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmt} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="ctc" name="Total CTC" fill={P.indigo} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="ctc" position="top" formatter={fmt} style={{ fontSize: 9, fill: "#6366f1" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Employee Status" subtitle="Active vs inactive breakdown">
          {teamStatus.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={teamStatus} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={55} outerRadius={90} paddingAngle={3}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                  {teamStatus.map((d, i) => <Cell key={i} fill={d.name === "Active" ? P.emerald : P.rose} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Employee Location Distribution" subtitle="Top cities by headcount">
          {locationDist.length === 0 ? <Empty msg="No location data available" /> : (
            <ResponsiveContainer width="100%" height={Math.max(220, locationDist.length * 28)}>
              <BarChart data={locationDist} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Employees" fill={P.sky} radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="count" position="right" style={{ fontSize: 9, fill: "#0ea5e9" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Designation Distribution" subtitle="Top 12 designations by headcount">
          {designations.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={Math.max(220, designations.length * 28)}>
              <BarChart data={designations} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={140} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Count" fill={P.pink} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="CTC Range Distribution" subtitle="Salary bands across internal team">
          {ctcHistogram.every((d) => d.count === 0) ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ctcHistogram} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Employees" radius={[4, 4, 0, 0]}>
                  {ctcHistogram.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  <LabelList dataKey="count" position="top" style={{ fontSize: 10, fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ══ SECTION 5: CASH FLOW ══ */}
      <SectionHeader icon={Activity} title="Cash Flow — Bank & Software" color={P.sky}
        activeFilters={activeFilterLabels}
        appliesTo={["Date From", "Date To"]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Bank Inflow vs Outflow" subtitle="entry_type=payment_received → Inflow · salary/OS/expense → Outflow">
          {bankFlow.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={bankFlow} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="bIn"  x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={P.emerald} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={P.emerald} stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="bOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={P.rose}    stopOpacity={0.2}  />
                    <stop offset="95%" stopColor={P.rose}    stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmt} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="Inflow"  stroke={P.emerald} fill="url(#bIn)"  strokeWidth={2} />
                <Area type="monotone" dataKey="Outflow" stroke={P.rose}    fill="url(#bOut)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Software Balance Flow" subtitle="Software entry inflow vs outflow">
          {softwareFlow.length === 0 ? <Empty msg="No software entry data" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={softwareFlow} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="swIn"  x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={P.sky}   stopOpacity={0.25} />
                    <stop offset="95%" stopColor={P.sky}   stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="swOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={P.amber} stopOpacity={0.2}  />
                    <stop offset="95%" stopColor={P.amber} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmt} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="Inflow"  stroke={P.sky}   fill="url(#swIn)"  strokeWidth={2} />
                <Area type="monotone" dataKey="Outflow" stroke={P.amber} fill="url(#swOut)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Cash Flow by Source Type" subtitle="All bank entries grouped by transaction type" className="lg:col-span-2">
          {cashBySource.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cashBySource} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="source" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmt} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Inflow"  fill={P.emerald} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Outflow" fill={P.rose}    radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ══ SECTION 6: STATUTORY ══ */}
      {statutoryByInvoice.length > 0 && (
        <>
          <SectionHeader icon={FileText} title="Statutory Deductions — from Invoices" color={P.rose}
            activeFilters={activeFilterLabels}
            appliesTo={["Date From", "Date To", "Client", "Department", "Entity", "Invoice #"]} />
          <ChartCard title="PF + ESI + LWF + PT per Invoice" subtitle="Employer statutory cost breakdown (stacked)">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={statutoryByInvoice} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="invoice" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmt} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Co. PF"  stackId="a" fill={P.indigo} />
                <Bar dataKey="Co. ESI" stackId="a" fill={P.sky}    />
                <Bar dataKey="LWF"     stackId="a" fill={P.amber}  />
                <Bar dataKey="PT"      stackId="a" fill={P.rose}   radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}

      <div className="text-center py-4 text-[11px] text-gray-300 font-medium">
        Analytics · Admin Only · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
      </div>
    </div>
  );
}