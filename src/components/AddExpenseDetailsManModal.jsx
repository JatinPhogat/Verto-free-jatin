import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import supabase from "../lib/supabaseClient";
import * as XLSX from "xlsx";
import {
  X,
  Plus,
  Users,
  FileText,
  DollarSign,
  ChevronDown,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Building2,
  Search,
} from "lucide-react";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const Select = ({ value, onChange, options, placeholder, error, disabled }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full border rounded-lg px-3 py-2.5 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 transition
        ${
          error
            ? "border-red-400 bg-red-50 focus:ring-red-300"
            : "border-gray-200 bg-white focus:ring-indigo-400"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        text-gray-800`}
    >
      <option value="" className="text-gray-400">
        {placeholder || "Select..."}
      </option>
      {options.map((opt) =>
        typeof opt === "string" ? (
          <option key={opt} value={opt} className="text-gray-800">
            {opt}
          </option>
        ) : (
          <option key={opt.value} value={opt.value} className="text-gray-800">
            {opt.label}
          </option>
        )
      )}
    </select>
    <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
    {error && (
      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    )}
  </div>
);

// ─── FIXED: Searchable Dropdown (focus stays, typing continues) ───
const SearchableSelect = ({
  value,
  onChange,
  options,
  placeholder,
  error,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value || "");
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setSearch(value || "");
    }
  }, [value, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) => {
    const label = typeof opt === "string" ? opt : opt.label;
    return label?.toLowerCase().includes(search.toLowerCase());
  });

  const sortedOptions = [...filteredOptions].sort((a, b) => {
    const keyword = search.toLowerCase();
    const aLabel = (typeof a === "string" ? a : a.label)?.toLowerCase() || "";
    const bLabel = (typeof b === "string" ? b : b.label)?.toLowerCase() || "";

    const aStarts = aLabel.startsWith(keyword);
    const bStarts = bLabel.startsWith(keyword);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    if (aLabel.length !== bLabel.length) return aLabel.length - bLabel.length;
    return aLabel.localeCompare(bLabel);
  });

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            const val = e.target.value;
            setSearch(val);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (search.length > 0) {
              setIsOpen(true);
            }
          }}
          onClick={() => {
            if (search.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder || "Type to search..."}
          disabled={disabled}
          className={`w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition
            ${
              error
                ? "border-red-400 bg-red-50 focus:ring-red-300"
                : "border-gray-200 bg-white focus:ring-indigo-400"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            text-gray-800 placeholder-gray-400`}
        />
      </div>

      {isOpen && sortedOptions.length > 0 && search.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-52 overflow-y-auto">
          {sortedOptions.map((opt, idx) => {
            const label = typeof opt === "string" ? opt : opt.label;
            const val = typeof opt === "string" ? opt : opt.value;
            return (
              <button
                key={idx}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSearch(label);
                  onChange(val);
                  setTimeout(() => {
                    setIsOpen(false);
                  }, 100);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition text-sm border-b border-gray-100 last:border-0"
              >
                <p className="font-medium text-gray-900">{label}</p>
              </button>
            );
          })}
        </div>
      )}

      {isOpen && search.length > 0 && sortedOptions.length === 0 && (
        <div className="absolute z-20 top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 p-3">
          <p className="text-xs text-gray-400">
            No match found. You can type manually.
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
};

const Input = ({
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  readOnly,
  hint,
}) => (
  <div>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition
        ${
          error
            ? "border-red-400 bg-red-50 focus:ring-red-300"
            : "border-gray-200 focus:ring-indigo-400"
        }
        ${
          readOnly
            ? "bg-gray-100 text-gray-600 cursor-not-allowed"
            : "bg-white text-gray-800"
        }
        placeholder-gray-400`}
    />
    {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
    {error && (
      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    )}
  </div>
);

const FieldLabel = ({ children }) => (
  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1.5">
    {children}
  </label>
);

const SectionHeader = ({ icon: Icon, title, color = "indigo" }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className={`w-1 h-5 bg-${color}-500 rounded-full`} />
    <h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wider flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4" />}
      {title}
    </h4>
  </div>
);

// ─── DEPT / PAY HEAD OPTIONS ──────────────────────────────────────────────────
const DEPT_OPTIONS = [
  "Common",
  "OS",
  "Temp",
  "Rec",
  "BD",
  "Accts",
  "HR",
  "Admin",
  "IT",
  "Legal",
  "Projects",
  "Others",
];
const INTERNAL_PAY_HEADS = [
  "Fixed Salary",
  "Variable",
  "Reimbursement",
  "Arrear Bonus",
  "Others",
  "Loan-Advance",
];
const OS_PAY_HEADS = [
  "Vendor Payment",
  "Consultant Charges",
  "Recruitment Payout",
  "Contract Staffing",
  "Freelancer Payment",
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const AddExpenseDetailsManModal = ({ isOpen, onClose, onSaved }) => {
  const [selectedOption, setSelectedOption] = useState(null); // 'internal' | 'os'
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Master data ──
  const [entities, setEntities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [clients, setClients] = useState([]);
  const [banks, setBanks] = useState([]);
  const [payHeads, setPayHeads] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // ── Internal Employee form ──
  const [intForm, setIntForm] = useState({
    entity: "",
    department: "",
    empCode: "",
    name: "",
    designation: "",
    paymentHeader: "",
    paymentAmount: "",
    incomeTax: "",
    paymentDescription: "",
    monthOfPay: "",
    dateOfPay: "",
    bankId: "",
    remarks: "",
  });

  // ── OS Payout form ──
  const [osForm, setOsForm] = useState({
    invoiceAvailable: "No",
    invoiceId: "",
    noOfEmployees: "",
    amountPaid: "",
    incomeTaxOs: "",
    datePaid: "",
    bankIdOs: "",
    payHeadOs: "",
    paymentDetailsOs: "",
    isBillable: false,
    osEntity: "",
    osDepartment: "",
    osClient: "",
    ledgerName: "",
    paymentDetails: "",
    payoutMonth: "",
    osNoOfEmployees: "",
    osAmountPaid: "",
    osIncomeTax: "",
    osDatePaid: "",
    osBankId: "",
    osPayHead: "",
    osIsBillable: false,
  });

  // ── Fetch masters ──
  useEffect(() => {
    if (!isOpen) return;
    fetchMasters();
  }, [isOpen]);

  const fetchMasters = async () => {
    const [e, d, c, b, ph, des, emp, inv] = await Promise.all([
      supabase
        .from("entity_master")
        .select("id, entity_name")
        .order("entity_name"),
      supabase
        .from("departments_master")
        .select("id, dept_code, dept_name")
        .order("dept_name"),
      supabase
        .from("clients_master")
        .select("id, client_name, ledger_name")
        .order("client_name"),
      supabase
        .from("bank_master")
        .select("id, bank_name, account_number")
        .order("bank_name"),
      supabase.from("pay_head_master").select("*").eq("is_active", true),
      supabase
        .from("designation_master")
        .select("id, designation_name")
        .order("designation_name"),
      supabase
        .from("employee_master")
        .select(
          "*, designation_master(designation_name), entity_master(entity_name), departments_master(dept_name), bank_master(bank_name)"
        )
        .order("employee_name"),
      supabase
        .from("invoices")
        .select("id, invoice_number, client_id, clients_master(client_name)")
        .order("invoice_number", { ascending: false }),
    ]);
    if (!e.error) setEntities(e.data || []);
    if (!d.error) setDepartments(d.data || []);
    if (!c.error) setClients(c.data || []);
    if (!b.error) setBanks(b.data || []);
    if (!ph.error) setPayHeads(ph.data || []);
    if (!des.error) setDesignations(des.data || []);
    if (!emp.error) setEmployees(emp.data || []);
    if (!inv.error) setInvoices(inv.data || []);
  };

  // ── Auto-fill employee details when empCode changes ──
  useEffect(() => {
    if (!intForm.empCode) return;
    const emp = employees.find((e) => e.emp_code === intForm.empCode);
    if (!emp) return;
    setIntForm((prev) => ({
      ...prev,
      name: emp.employee_name || "",
      designation: emp.designation_master?.designation_name || "",
      department: emp.departments_master?.dept_name || "",
      bankId: emp.bank_id || "",
    }));
  }, [intForm.empCode, employees]);

  // ── Reset on close ──
  useEffect(() => {
    if (!isOpen) {
      setSelectedOption(null);
      setSaved(false);
      setErrors({});
      setIntForm({
        entity: "",
        department: "",
        empCode: "",
        name: "",
        designation: "",
        paymentHeader: "",
        paymentAmount: "",
        incomeTax: "",
        paymentDescription: "",
        monthOfPay: "",
        dateOfPay: "",
        bankId: "",
        remarks: "",
      });
      setOsForm({
        invoiceAvailable: "No",
        invoiceId: "",
        noOfEmployees: "",
        amountPaid: "",
        incomeTaxOs: "",
        datePaid: "",
        bankIdOs: "",
        payHeadOs: "",
        paymentDetailsOs: "",
        isBillable: false,
        osEntity: "",
        osDepartment: "",
        osClient: "",
        ledgerName: "",
        paymentDetails: "",
        payoutMonth: "",
        osNoOfEmployees: "",
        osAmountPaid: "",
        osIncomeTax: "",
        osDatePaid: "",
        osBankId: "",
        osPayHead: "",
        osIsBillable: false,
      });
    }
  }, [isOpen]);

  const setInt = (field, value) => {
    setIntForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const setOs = (field, value) => {
    setOsForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // ── Validation ──
  const validateInternal = () => {
    const e = {};
    if (!intForm.entity) e.entity = "Required";
    if (!intForm.department) e.department = "Required";
    if (!intForm.empCode) e.empCode = "Required";
    if (!intForm.name) e.name = "Required";
    if (!intForm.paymentHeader) e.paymentHeader = "Required";
    if (!intForm.paymentAmount || parseFloat(intForm.paymentAmount) <= 0)
      e.paymentAmount = "Must be > 0";
    if (!intForm.dateOfPay) e.dateOfPay = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateOS = () => {
    const e = {};
    if (osForm.invoiceAvailable === "Yes") {
      if (!osForm.invoiceId) e.invoiceId = "Select an invoice";
      if (!osForm.amountPaid || parseFloat(osForm.amountPaid) <= 0)
        e.amountPaid = "Must be > 0";
      if (!osForm.datePaid) e.datePaid = "Required";
      if (!osForm.bankIdOs) e.bankIdOs = "Select bank";
    } else {
      if (!osForm.osEntity) e.osEntity = "Required";
      if (!osForm.osDepartment) e.osDepartment = "Required";
      if (!osForm.osClient) e.osClient = "Required";
      if (!osForm.paymentDetails) e.paymentDetails = "Required";
      if (!osForm.payoutMonth) e.payoutMonth = "Required";
      if (!osForm.osAmountPaid || parseFloat(osForm.osAmountPaid) <= 0)
        e.osAmountPaid = "Must be > 0";
      if (!osForm.osDatePaid) e.osDatePaid = "Required";
      if (!osForm.osBankId) e.osBankId = "Select bank";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const netPayment =
    (parseFloat(intForm.paymentAmount) || 0) -
    (parseFloat(intForm.incomeTax) || 0);

  // ── Save Internal ──
  const saveInternal = async () => {
    if (!validateInternal()) return;
    setLoading(true);
    try {
      const payload = {
        entity_id:
          entities.find((e) => e.entity_name === intForm.entity)?.id || null,
        department_id:
          departments.find((d) => d.dept_name === intForm.department)?.id ||
          null,
        emp_code: intForm.empCode,
        employee_name: intForm.name,
        designation: intForm.designation,
        pay_head: intForm.paymentHeader,
        payment_description: intForm.paymentDescription,
        payment_amount: parseFloat(intForm.paymentAmount) || 0,
        income_tax_deducted: parseFloat(intForm.incomeTax) || 0,
        net_payment: Math.max(netPayment, 0),
        month_of_pay: intForm.monthOfPay ? intForm.monthOfPay + "-01" : null,
        date_of_pay: intForm.dateOfPay,
        bank_id: intForm.bankId || null,
        bank_name:
          banks.find((b) => b.id === intForm.bankId)?.bank_name || null,
        remarks: intForm.remarks,
      };

      const { data: savedPayment, error } = await supabase
        .from("employee_expense_payouts")
        .insert([payload])
        .select()
        .single();
      if (error) throw error;

      if ((parseFloat(intForm.incomeTax) || 0) > 0) {
        const { error: taxErr } = await supabase
          .from("statutory_liabilities")
          .insert([
            {
              source_type: "salary",
              source_id: savedPayment.id,
              statutory_type: "TDS",
              entity: intForm.entity,
              amount: parseFloat(intForm.incomeTax),
              status: "pending",
            },
          ]);
        if (taxErr) {
          console.error("Salary TDS error:", taxErr);
        }
      }

      setSaved(true);
      setTimeout(() => {
        onSaved?.();
        onClose();
      }, 1200);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExcelUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      setLoading(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      console.log("Excel Data:", jsonData);

      const finalPayload = [];
      for (const row of jsonData) {
        const entity = entities.find(
          (x) =>
            x.entity_name?.trim().toLowerCase() ===
            row["Entity"]?.trim().toLowerCase()
        );
        const department = departments.find(
          (x) =>
            x.dept_name?.trim().toLowerCase() ===
            row["Department"]?.trim().toLowerCase()
        );
        const bank = banks.find(
          (x) =>
            x.bank_name?.trim().toLowerCase() ===
            row["Bank Name/Acct No"]?.trim().toLowerCase()
        );
        const paymentAmount = parseFloat(row["Payment Amount"]) || 0;
        const tax = parseFloat(row["Income Tax deducted"]) || 0;
        finalPayload.push({
          entity_id: entity?.id || null,
          department_id: department?.id || null,
          emp_code: row["Emp Code"] || "",
          employee_name: row["Name"] || "",
          designation: row["Designation"] || "",
          pay_head: row["Payment Head"] || "",
          payment_description: row["Payment Description"] || "",
          payment_amount: paymentAmount,
          income_tax_deducted: tax,
          net_payment: paymentAmount - tax,
          month_of_pay: row["Month of Pay"]
            ? `${row["Month of Pay"]}-01`
            : null,
          date_of_pay: row["Date of Pay"] || null,
          bank_id: bank?.id || null,
          bank_name: row["Bank Name/Acct No"] || "",
          remarks: "",
        });
      }
      console.log("FINAL PAYLOAD:", finalPayload);
      const { error } = await supabase
        .from("employee_expense_payouts")
        .insert(finalPayload);
      if (error) throw error;
      alert("Excel uploaded successfully!");
      onSaved?.();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Save OS ──
  const saveOS = async () => {
    if (!validateOS()) return;
    setLoading(true);
    try {
      let payload;
      if (osForm.invoiceAvailable === "Yes") {
        const inv = invoices.find((i) => i.id === osForm.invoiceId);
        payload = {
          invoice_id: osForm.invoiceId || null,
          entity_id: null,
          department_id: null,
          client_id: inv?.client_id || null,
          ledger_name: null,
          pay_head: osForm.payHeadOs,
          payment_details: osForm.paymentDetailsOs,
          payout_month: null,
          employee_count: parseInt(osForm.noOfEmployees) || 0,
          amount_paid: parseFloat(osForm.amountPaid) || 0,
          income_tax_deducted: parseFloat(osForm.incomeTaxOs) || 0,
          is_billable: osForm.isBillable,
          payment_date: osForm.datePaid,
          bank_id: osForm.bankIdOs || null,
          bank_name:
            banks.find((b) => b.id === osForm.bankIdOs)?.bank_name || null,
          remarks: "",
        };
      } else {
        const client = clients.find((c) => c.client_name === osForm.osClient);
        payload = {
          invoice_id: null,
          entity_id:
            entities.find((e) => e.entity_name === osForm.osEntity)?.id || null,
          department_id:
            departments.find((d) => d.dept_name === osForm.osDepartment)?.id ||
            null,
          client_id: client?.id || null,
          ledger_name: osForm.ledgerName,
          pay_head: osForm.osPayHead,
          payment_details: osForm.paymentDetails,
          payout_month: osForm.payoutMonth ? osForm.payoutMonth + "-01" : null,
          employee_count: parseInt(osForm.osNoOfEmployees) || 0,
          amount_paid: parseFloat(osForm.osAmountPaid) || 0,
          income_tax_deducted: parseFloat(osForm.osIncomeTax) || 0,
          is_billable: osForm.osIsBillable,
          payment_date: osForm.osDatePaid,
          bank_id: osForm.osBankId || null,
          bank_name:
            banks.find((b) => b.id === osForm.osBankId)?.bank_name || null,
          remarks: "",
        };
      }
      const { error } = await supabase.from("os_payouts").insert([payload]);
      if (error) throw error;
      setSaved(true);
      setTimeout(() => {
        onSaved?.();
        onClose();
      }, 1200);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const internalHeads = payHeads
    .filter((p) => p.payout_type === "INTERNAL")
    .map((p) => p.pay_head_name || p.name);
  const osHeads = payHeads
    .filter((p) => p.payout_type === "OS")
    .map((p) => p.pay_head_name || p.name);
  const intPayHeadOptions =
    internalHeads.length > 0 ? internalHeads : INTERNAL_PAY_HEADS;
  const osPayHeadOptions = osHeads.length > 0 ? osHeads : OS_PAY_HEADS;

  // ─── OPTION SELECTION SCREEN ──────────────────────────────────────────────
  const OptionSelection = () => (
    <div className="p-8">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          Select Expense / Payout Type
        </h3>
        <p className="text-gray-600 text-sm">Choose the category to proceed</p>
      </div>
      <div className="grid grid-cols-2 gap-5">
        {[
          {
            key: "internal",
            icon: Users,
            title: "Internal Employee",
            subtitle: "Salary, Reimbursement, Bonus, Loan",
            color: "blue",
            gradient: "from-blue-500 to-indigo-600",
            bg: "from-blue-50 to-indigo-50",
            border: "border-blue-200 hover:border-blue-400",
          },
          {
            key: "os",
            icon: FileText,
            title: "3rd Party / OS Payout",
            subtitle: "Vendor, Consultant, Contract Staff",
            color: "purple",
            gradient: "from-purple-500 to-pink-600",
            bg: "from-purple-50 to-pink-50",
            border: "border-purple-200 hover:border-purple-400",
          },
        ].map((opt) => (
          <motion.button
            key={opt.key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedOption(opt.key)}
            className={`p-7 bg-gradient-to-br ${opt.bg} border-2 ${opt.border} rounded-2xl transition-all group text-left`}
          >
            <div
              className={`w-14 h-14 bg-gradient-to-br ${opt.gradient} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}
            >
              <opt.icon className="w-7 h-7 text-white" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-1">
              {opt.title}
            </h4>
            <p className="text-sm text-gray-600">{opt.subtitle}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );

  // ─── INTERNAL EMPLOYEE FORM ────────────────────────────────────────────────
  const internalFormJSX = (
    <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
      {/* ── Employee Info ── */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <SectionHeader icon={Users} title="Employee Information" color="blue" />
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <FieldLabel>Entity *</FieldLabel>
            <Select
              value={intForm.entity}
              onChange={(v) => setInt("entity", v)}
              options={entities.map((e) => ({
                value: e.entity_name,
                label: e.entity_name,
              }))}
              placeholder="Select entity"
              error={errors.entity}
            />
          </div>
          <div>
            <FieldLabel>Department *</FieldLabel>
            <Select
              value={intForm.department}
              onChange={(v) => setInt("department", v)}
              options={departments.map((d) => ({
                value: d.dept_name,
                label: d.dept_name,
              }))}
              placeholder="Select dept"
              error={errors.department}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <FieldLabel>Emp Code *</FieldLabel>
            <SearchableSelect
              value={intForm.empCode}
              onChange={(v) => setInt("empCode", v)}
              options={employees.map((e) => ({
                value: e.emp_code,
                label: `${e.emp_code} – ${e.employee_name}`,
              }))}
              placeholder="Type employee code or name..."
              error={errors.empCode}
            />
          </div>
          <div>
            <FieldLabel>Name *</FieldLabel>
            <input
              type="text"
              defaultValue={intForm.name}
              onBlur={(e) => setInt("name", e.target.value)}
              placeholder="Auto-filled from emp code"
              readOnly={!!intForm.empCode}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition
                ${
                  errors.name
                    ? "border-red-400 bg-red-50 focus:ring-red-300"
                    : "border-gray-200 focus:ring-indigo-400"
                }
                ${
                  intForm.empCode
                    ? "bg-gray-100 text-gray-700 cursor-not-allowed"
                    : "bg-white text-gray-800"
                }
                placeholder-gray-400`}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>
          <div>
            <FieldLabel>Designation</FieldLabel>
            <input
              type="text"
              defaultValue={intForm.designation}
              onBlur={(e) => setInt("designation", e.target.value)}
              placeholder="Auto-filled"
              readOnly={!!intForm.empCode}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition border-gray-200 focus:ring-indigo-400
                ${
                  intForm.empCode
                    ? "bg-gray-100 text-gray-700 cursor-not-allowed"
                    : "bg-white text-gray-800"
                }
                placeholder-gray-400`}
            />
          </div>
        </div>
      </div>

      {/* ── Payment Info ── */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <SectionHeader
          icon={DollarSign}
          title="Payment Details"
          color="indigo"
        />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <FieldLabel>
              Pay Head *
              <span className="ml-1 font-normal text-gray-500 normal-case text-xs">
                ({intPayHeadOptions.join(" / ")})
              </span>
            </FieldLabel>
            <Select
              value={intForm.paymentHeader}
              onChange={(v) => setInt("paymentHeader", v)}
              options={intPayHeadOptions.map((p) => ({
                value: p,
                label: p,
              }))}
              placeholder="Select pay head"
              error={errors.paymentHeader}
            />
          </div>
          <div>
            <FieldLabel>Month of Pay</FieldLabel>
            <input
              type="month"
              defaultValue={intForm.monthOfPay}
              onBlur={(e) => setInt("monthOfPay", e.target.value)}
              className="w-full border border-gray-200 bg-white text-gray-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        {/* ✅ FIXED: defaultValue + onBlur for amount fields */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <FieldLabel>Payment Amount *</FieldLabel>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500 text-sm font-medium">
                ₹
              </span>
              <input
                type="text"
                inputMode="decimal"
                defaultValue={intForm.paymentAmount}
                onBlur={(e) =>
                  setInt("paymentAmount", e.target.value.replace(/[^0-9.]/g, ""))
                }
                className={`w-full border rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800 placeholder-gray-400
                  ${
                    errors.paymentAmount
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 bg-white"
                  }`}
                placeholder="0"
              />
            </div>
            {errors.paymentAmount && (
              <p className="text-xs text-red-500 mt-1">
                {errors.paymentAmount}
              </p>
            )}
          </div>
          <div>
            <FieldLabel>Income Tax Deducted</FieldLabel>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500 text-sm font-medium">
                ₹
              </span>
              <input
                type="text"
                inputMode="decimal"
                defaultValue={intForm.incomeTax}
                onBlur={(e) =>
                  setInt("incomeTax", e.target.value.replace(/[^0-9.]/g, ""))
                }
                className="w-full border border-gray-200 bg-white text-gray-800 placeholder-gray-400 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <FieldLabel>Net Payment</FieldLabel>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-emerald-600 text-sm font-medium">
                ₹
              </span>
              <input
                type="text"
                value={Math.max(netPayment, 0)}
                readOnly
                className="w-full border border-emerald-200 rounded-lg pl-7 pr-3 py-2.5 text-sm bg-emerald-50 text-emerald-700 font-semibold cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              = Amount − Tax (auto)
            </p>
          </div>
        </div>

        <div className="mb-3">
          <FieldLabel>Payment Description</FieldLabel>
          <textarea
            defaultValue={intForm.paymentDescription}
            onBlur={(e) => setInt("paymentDescription", e.target.value)}
            rows={2}
            placeholder="Describe the payment..."
            className="w-full border border-gray-200 bg-white text-gray-800 placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Date of Pay *</FieldLabel>
            <input
              type="date"
              defaultValue={intForm.dateOfPay}
              onBlur={(e) => setInt("dateOfPay", e.target.value)}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800
                ${
                  errors.dateOfPay
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 bg-white"
                }`}
            />
            {errors.dateOfPay && (
              <p className="text-xs text-red-500 mt-1">{errors.dateOfPay}</p>
            )}
          </div>
          <div>
            <FieldLabel>Bank / Account</FieldLabel>
            <Select
              value={intForm.bankId}
              onChange={(v) => setInt("bankId", v)}
              options={banks.map((b) => ({
                value: b.id,
                label: `${b.bank_name} — ${b.account_number}`,
              }))}
              placeholder="Select bank"
            />
          </div>
        </div>

        <div className="mt-3">
          <FieldLabel>Remarks</FieldLabel>
          <textarea
            defaultValue={intForm.remarks}
            onBlur={(e) => setInt("remarks", e.target.value)}
            rows={2}
            className="w-full border border-gray-200 bg-white text-gray-800 placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            placeholder="Additional notes..."
          />
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
        <button
          onClick={() => setSelectedOption(null)}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
        >
          ← Back
        </button>
        <div className="flex items-center gap-3">
          <label className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition">
            Upload Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              className="hidden"
            />
          </label>
        </div>
        <button
          onClick={saveInternal}
          disabled={loading || saved}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 min-w-[160px] justify-center transition
            ${
              saved
                ? "bg-emerald-500 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
            }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> Saved!
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Save Employee Expense
            </>
          )}
        </button>
      </div>
    </div>
  );

  // ─── OS PAYOUT FORM ────────────────────────────────────────────────────────
  const OSForm = () => {
    const withInvoice = osForm.invoiceAvailable === "Yes";

    return (
      <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
        {/* Toggle */}
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <FieldLabel>Invoice Number Available?</FieldLabel>
          <div className="flex gap-3 mt-1">
            {["Yes", "No"].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setOs("invoiceAvailable", opt)}
                className={`px-5 py-2 rounded-lg text-sm font-medium border transition
                  ${
                    osForm.invoiceAvailable === opt
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-purple-300"
                  }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* ── With Invoice ── */}
        {withInvoice && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 space-y-3">
            <SectionHeader
              icon={FileText}
              title="Invoice-Linked Payout"
              color="blue"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Invoice *</FieldLabel>
                <SearchableSelect
                  value={osForm.invoiceId}
                  onChange={(v) => setOs("invoiceId", v)}
                  options={invoices.map((i) => ({
                    value: i.id,
                    label: `${i.invoice_number}${
                      i.clients_master
                        ? " – " + i.clients_master.client_name
                        : ""
                    }`,
                  }))}
                  placeholder="Type invoice number..."
                  error={errors.invoiceId}
                />
              </div>
              <div>
                <FieldLabel>Pay Head</FieldLabel>
                <Select
                  value={osForm.payHeadOs}
                  onChange={(v) => setOs("payHeadOs", v)}
                  options={osPayHeadOptions.map((p) => ({
                    value: p,
                    label: p,
                  }))}
                  placeholder="Select pay head"
                />
              </div>
            </div>

            <div>
              <FieldLabel>Payment Details</FieldLabel>
              <input
                type="text"
                defaultValue={osForm.paymentDetailsOs}
                onBlur={(e) => setOs("paymentDetailsOs", e.target.value)}
                placeholder="Description of payout..."
                className="w-full border border-gray-200 bg-white text-gray-800 placeholder-gray-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* ✅ FIXED: defaultValue + onBlur */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <FieldLabel>Amount Paid *</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 text-sm font-medium">
                    ₹
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    defaultValue={osForm.amountPaid}
                    onBlur={(e) =>
                      setOs("amountPaid", e.target.value.replace(/[^0-9.]/g, ""))
                    }
                    className={`w-full border rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 placeholder-gray-400
                      ${
                        errors.amountPaid
                          ? "border-red-400 bg-red-50"
                          : "border-gray-200 bg-white"
                      }`}
                    placeholder="0"
                  />
                </div>
                {errors.amountPaid && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.amountPaid}
                  </p>
                )}
              </div>
              <div>
                <FieldLabel>Income Tax Deducted</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 text-sm font-medium">
                    ₹
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    defaultValue={osForm.incomeTaxOs}
                    onBlur={(e) =>
                      setOs("incomeTaxOs", e.target.value.replace(/[^0-9.]/g, ""))
                    }
                    className="w-full border border-gray-200 bg-white text-gray-800 placeholder-gray-400 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <FieldLabel>No. of Employees</FieldLabel>
                <input
                  type="text"
                  inputMode="numeric"
                  defaultValue={osForm.noOfEmployees}
                  onBlur={(e) =>
                    setOs("noOfEmployees", e.target.value.replace(/[^0-9]/g, ""))
                  }
                  placeholder="0"
                  className="w-full border border-gray-200 bg-white text-gray-800 placeholder-gray-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <p className="text-xs text-gray-500 mt-0.5">
                  Links to invoice headcount
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Date Paid *</FieldLabel>
                <input
                  type="date"
                  defaultValue={osForm.datePaid}
                  onBlur={(e) => setOs("datePaid", e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800
                    ${
                      errors.datePaid
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200 bg-white"
                    }`}
                />
                {errors.datePaid && (
                  <p className="text-xs text-red-500 mt-1">{errors.datePaid}</p>
                )}
              </div>
              <div>
                <FieldLabel>Bank *</FieldLabel>
                <Select
                  value={osForm.bankIdOs}
                  onChange={(v) => setOs("bankIdOs", v)}
                  options={banks.map((b) => ({
                    value: b.id,
                    label: `${b.bank_name} — ${b.account_number}`,
                  }))}
                  placeholder="Select bank"
                  error={errors.bankIdOs}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <label className="text-sm font-semibold text-gray-700">
                Billable to Client?
              </label>
              <button
                type="button"
                onClick={() => setOs("isBillable", !osForm.isBillable)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition
                  ${osForm.isBillable ? "bg-emerald-500" : "bg-gray-300"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition
                  ${osForm.isBillable ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
              <span
                className={`text-xs font-semibold ${
                  osForm.isBillable ? "text-emerald-600" : "text-gray-500"
                }`}
              >
                {osForm.isBillable ? "Billable ✓" : "Non-Billable"}
              </span>
            </div>
          </div>
        )}

        {/* ── Without Invoice (Manual) ── */}
        {!withInvoice && (
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 space-y-3">
            <SectionHeader
              icon={Building2}
              title="Manual OS Payout Entry"
              color="purple"
            />

            <div className="grid grid-cols-3 gap-3">
              <div>
                <FieldLabel>Entity *</FieldLabel>
                <Select
                  value={osForm.osEntity}
                  onChange={(v) => setOs("osEntity", v)}
                  options={entities.map((e) => ({
                    value: e.entity_name,
                    label: e.entity_name,
                  }))}
                  placeholder="Select entity"
                  error={errors.osEntity}
                />
              </div>
              <div>
                <FieldLabel>Department *</FieldLabel>
                <Select
                  value={osForm.osDepartment}
                  onChange={(v) => setOs("osDepartment", v)}
                  options={departments.map((d) => ({
                    value: d.dept_name,
                    label: d.dept_name,
                  }))}
                  placeholder="Select dept"
                  error={errors.osDepartment}
                />
              </div>
              <div>
                <FieldLabel>Client *</FieldLabel>
                <SearchableSelect
                  value={osForm.osClient}
                  onChange={(v) => {
                    setOs("osClient", v);
                    const cl = clients.find((c) => c.client_name === v);
                    if (cl?.ledger_name) {
                      setTimeout(() => {
                        setOs("ledgerName", cl.ledger_name);
                      }, 0);
                    }
                  }}
                  options={clients.map((c) => ({
                    value: c.client_name,
                    label: c.client_name,
                  }))}
                  placeholder="Type client name..."
                  error={errors.osClient}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Ledger Name</FieldLabel>
                {/* ✅ FIXED: defaultValue + onBlur */}
                <input
                  type="text"
                  defaultValue={osForm.ledgerName}
                  onBlur={(e) => setOs("ledgerName", e.target.value)}
                  placeholder="Auto-filled from client"
                  className="w-full border border-gray-200 bg-white text-gray-800 placeholder-gray-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div>
                <FieldLabel>Pay Head</FieldLabel>
                <Select
                  value={osForm.osPayHead}
                  onChange={(v) => setOs("osPayHead", v)}
                  options={osPayHeadOptions.map((p) => ({
                    value: p,
                    label: p,
                  }))}
                  placeholder="Select pay head"
                />
              </div>
            </div>

            <div>
              <FieldLabel>Payment Details *</FieldLabel>
              {/* ✅ FIXED: defaultValue + onBlur */}
              <input
                type="text"
                defaultValue={osForm.paymentDetails}
                onBlur={(e) => setOs("paymentDetails", e.target.value)}
                placeholder="Describe this OS payout..."
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-800 placeholder-gray-400
                  ${
                    errors.paymentDetails
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 bg-white"
                  }`}
              />
              {errors.paymentDetails && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.paymentDetails}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Payout Month *</FieldLabel>
                <input
                  type="month"
                  defaultValue={osForm.payoutMonth}
                  onBlur={(e) => setOs("payoutMonth", e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-800
                    ${
                      errors.payoutMonth
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200 bg-white"
                    }`}
                />
                {errors.payoutMonth && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.payoutMonth}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-0.5">
                  Links headcount when invoice is generated
                </p>
              </div>
              <div>
                <FieldLabel>No. of Employees</FieldLabel>
                {/* ✅ FIXED: defaultValue + onBlur */}
                <input
                  type="text"
                  inputMode="numeric"
                  defaultValue={osForm.osNoOfEmployees}
                  onBlur={(e) =>
                    setOs("osNoOfEmployees", e.target.value.replace(/[^0-9]/g, ""))
                  }
                  placeholder="0"
                  className="w-full border border-gray-200 bg-white text-gray-800 placeholder-gray-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <p className="text-xs text-gray-500 mt-0.5">
                  Links to invoice headcount
                </p>
              </div>
            </div>

            {/* ✅ FIXED: defaultValue + onBlur for amount fields */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <FieldLabel>Amount Paid *</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 text-sm font-medium">
                    ₹
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    defaultValue={osForm.osAmountPaid}
                    onBlur={(e) =>
                      setOs("osAmountPaid", e.target.value.replace(/[^0-9.]/g, ""))
                    }
                    className={`w-full border rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-800 placeholder-gray-400
                      ${
                        errors.osAmountPaid
                          ? "border-red-400 bg-red-50"
                          : "border-gray-200 bg-white"
                      }`}
                    placeholder="0"
                  />
                </div>
                {errors.osAmountPaid && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.osAmountPaid}
                  </p>
                )}
              </div>
              <div>
                <FieldLabel>Income Tax Deducted</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 text-sm font-medium">
                    ₹
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    defaultValue={osForm.osIncomeTax}
                    onBlur={(e) =>
                      setOs("osIncomeTax", e.target.value.replace(/[^0-9.]/g, ""))
                    }
                    className="w-full border border-gray-200 bg-white text-gray-800 placeholder-gray-400 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Date Paid *</FieldLabel>
                <input
                  type="date"
                  defaultValue={osForm.osDatePaid}
                  onBlur={(e) => setOs("osDatePaid", e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-800
                    ${
                      errors.osDatePaid
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200 bg-white"
                    }`}
                />
                {errors.osDatePaid && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.osDatePaid}
                  </p>
                )}
              </div>
            </div>

            <div>
              <FieldLabel>Bank *</FieldLabel>
              <Select
                value={osForm.osBankId}
                onChange={(v) => setOs("osBankId", v)}
                options={banks.map((b) => ({
                  value: b.id,
                  label: `${b.bank_name} — ${b.account_number}`,
                }))}
                placeholder="Select bank"
                error={errors.osBankId}
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-700">
                Billable to Client?
              </label>
              <button
                type="button"
                onClick={() => setOs("osIsBillable", !osForm.osIsBillable)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition
                  ${osForm.osIsBillable ? "bg-emerald-500" : "bg-gray-300"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition
                  ${osForm.osIsBillable ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
              <span
                className={`text-xs font-semibold ${
                  osForm.osIsBillable ? "text-emerald-600" : "text-gray-500"
                }`}
              >
                {osForm.osIsBillable ? "Billable ✓" : "Non-Billable"}
              </span>
            </div>

            <div className="bg-purple-100 rounded-lg p-3 text-xs text-purple-900 font-medium">
              <strong>Ref Format:</strong> PO-[ClientCode]-[DDMMYY]-01 —
              Auto-generated on save
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <button
            onClick={() => setSelectedOption(null)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
          >
            ← Back
          </button>
          <button
            onClick={saveOS}
            disabled={loading || saved}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 min-w-[160px] justify-center transition
              ${
                saved
                  ? "bg-emerald-500 text-white"
                  : "bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-60"
              }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : saved ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Saved!
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Save OS Payout
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  // ─── MODAL WRAPPER ─────────────────────────────────────────────────────────
  const headerConfig = {
    null: {
      title: "Add Expense / Payout",
      gradient: "from-indigo-600 to-purple-700",
    },
    internal: {
      title: "Internal Employee Expense",
      gradient: "from-blue-600 to-indigo-700",
    },
    os: {
      title: "3rd Party / OS Payout",
      gradient: "from-purple-600 to-pink-700",
    },
  };
  const hc = headerConfig[selectedOption] || headerConfig["null"];

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[99999]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col pointer-events-auto overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-6 py-4 bg-gradient-to-r ${hc.gradient} text-white flex-shrink-0`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                {selectedOption === "internal" ? (
                  <Users className="w-5 h-5" />
                ) : selectedOption === "os" ? (
                  <FileText className="w-5 h-5" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">{hc.title}</h3>
                <p className="text-white/80 text-xs">
                  {selectedOption === "internal"
                    ? "Salary, Reimbursement, Bonus, Loan"
                    : selectedOption === "os"
                    ? "Vendor, Consultant, Contract Staff"
                    : "Select the type of expense to continue"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {!selectedOption && (
                <motion.div
                  key="options"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <OptionSelection />
                </motion.div>
              )}
              {selectedOption === "internal" && (
                <motion.div
                  key="internal"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {internalFormJSX}
                </motion.div>
              )}
              {selectedOption === "os" && (
                <motion.div
                  key="os"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <OSForm />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>,
    document.body
  );
};

export default AddExpenseDetailsManModal;