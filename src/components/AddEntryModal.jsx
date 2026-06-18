import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Landmark,
  Calendar,
  IndianRupee,
  FileText,
  Building2,
  ChevronDown,
  ArrowRight,
  Plus,
  Wallet,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  RefreshCw,
  ArrowLeft,
  Save,
  AlertTriangle,
  Filter,
} from "lucide-react";

import supabase from "../lib/supabaseClient";

const AddEntryModal = ({
  isOpen,
  onClose,
  newEntry,
  setNewEntry,
  onSave,
  banks,
  entries = [],
  onDeleteEntry,
  onEditEntry,
  onRefreshEntries,
}) => {
  const [showAddBank, setShowAddBank] = useState(false);
  const [viewMode, setViewMode] = useState("add");
  const [editEntryData, setEditEntryData] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [filterBank, setFilterBank] = useState("all");

  const [newBank, setNewBank] = useState({
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    branch_name: "",
    bank_code: "",
  });

  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount, type) => {
    const num = Number(amount || 0);
    const formatted = `Rs. ${Math.abs(num).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    return type === "debit" ? `- ${formatted}` : `+ ${formatted}`;
  };

  const startEdit = (entry) => {
    setEditEntryData(entry);
    setEditForm({
      entity: entry.entity || "",
      amount: String(entry.amount || ""),
      date: entry.date || "",
      type: entry.type || "credit",
      bank_id: entry.bank_id || "",
      remarks: entry.remarks || "",
      entry_type: entry.entry_type || "manual_adjustment",
    });
    setViewMode("edit");
  };

  const handleUpdateEntry = async () => {
    if (!editForm.amount || Number(editForm.amount) <= 0) {
      alert("Enter a valid amount");
      return;
    }
    if (!editForm.date) {
      alert("Select a date");
      return;
    }
    if (!editForm.bank_id) {
      alert("Select a bank");
      return;
    }
    await onEditEntry(editEntryData.id, {
      entity: editForm.entity || "Verto India Pvt Ltd",
      amount: parseFloat(editForm.amount),
      date: editForm.date,
      type: editForm.type,
      bank_id: editForm.bank_id,
      remarks: editForm.remarks || "",
      entry_type: editForm.entry_type || "manual_adjustment",
    });
    setViewMode("list");
    setEditEntryData(null);
    onRefreshEntries?.();
  };

  const handleDelete = async (id) => {
    await onDeleteEntry(id);
    setDeleteConfirmId(null);
    onRefreshEntries?.();
  };

  const filteredEntries = filterBank === "all"
    ? entries
    : entries.filter((e) => String(e.bank_id) === String(filterBank));

  const handleAddBank = async () => {
    if (!newBank.bank_name || !newBank.account_number) {
      alert("Fill required fields");
      return;
    }

    const { data, error } = await supabase
      .from("bank_master")
      .insert([newBank])
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("Error saving bank");
      return;
    }

    setNewEntry({
      ...newEntry,
      bank_id: data.id,
      bank_code: data.bank_code,
      entity: "Verto India Pvt Ltd",
    });

    setShowAddBank(false);

    window.refreshBanks?.();
  };

  const transactionTypes = [
    {
      value: "credit",
      title: "Credit",
      subtitle: "Add money",
    },
    {
      value: "debit",
      title: "Debit",
      subtitle: "Reduce balance",
    },
    {
      value: "total_update",
      title: "Update",
      subtitle: "Actual balance",
    },
  ];

  // Entry Card Component for List View
  const EntryCard = ({ entry }) => {
    const bank = banks.find((b) => String(b.id) === String(entry.bank_id));
    
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-300 transition">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                entry.type === "credit" 
                  ? "bg-emerald-100 text-emerald-700" 
                  : entry.type === "debit"
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-100 text-blue-700"
              }`}>
                {entry.type?.toUpperCase() || "CREDIT"}
              </span>
              <span className="text-sm font-medium text-slate-700">
                {bank?.bank_name || "Unknown Bank"}
              </span>
              <span className="text-xs text-slate-400">
                {formatDate(entry.date)}
              </span>
            </div>
            
            <div className="flex items-baseline gap-3">
              <span className={`text-lg font-bold ${
                entry.type === "debit" ? "text-red-600" : "text-emerald-600"
              }`}>
                {formatAmount(entry.amount, entry.type)}
              </span>
              {entry.remarks && (
                <span className="text-sm text-slate-500 truncate max-w-xs">
                  {entry.remarks}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 ml-4">
            <button
              onClick={() => startEdit(entry)}
              className="w-8 h-8 rounded-lg hover:bg-indigo-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition"
              title="Edit Entry"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            
            {deleteConfirmId === entry.id ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="px-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirmId(entry.id)}
                className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-600 transition"
                title="Delete Entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl bg-[#f8fafc] rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* HEADER */}
              <div className="relative overflow-hidden bg-gradient-to-r from-indigo-700 to-violet-600 px-5 py-4 text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-10 translate-x-10" />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">
                        {viewMode === "list"
                          ? "View Entries"
                          : viewMode === "edit"
                          ? "Edit Entry"
                          : "Add Bank Entry"}
                      </h2>
                      <p className="text-indigo-100 text-sm mt-1">
                        {viewMode === "list"
                          ? `${filteredEntries.length} entries found`
                          : viewMode === "edit"
                          ? "Update transaction details"
                          : "Record bank transaction"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* VIEW ENTRIES BUTTON */}
                    <button
                      onClick={() => {
                        setViewMode(viewMode === "list" ? "add" : "list");
                        setEditEntryData(null);
                        setDeleteConfirmId(null);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-sm font-medium"
                      title={viewMode === "list" ? "Back to Add Entry" : "View All Entries"}
                    >
                      {viewMode === "list" ? (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Add New</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          <span>View Entries</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setViewMode("add");
                        setEditEntryData(null);
                        onClose();
                      }}
                      className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* BODY */}
              <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
                {viewMode === "list" && (
                  <>
                    {/* Filter Bar */}
                    <div className="flex items-center gap-2 mb-4">
                      <Filter className="w-4 h-4 text-slate-400" />
                      <select
                        value={filterBank}
                        onChange={(e) => setFilterBank(e.target.value)}
                        className="flex-1 h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                      >
                        <option value="all">All Banks</option>
                        {banks.map((b) => (
                          <option key={b.id} value={b.id}>{b.bank_name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => onRefreshEntries?.()}
                        className="h-10 px-3 rounded-lg border border-slate-200 hover:bg-slate-50"
                      >
                        <RefreshCw className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>

                    {/* Entries List */}
                    {filteredEntries.length === 0 ? (
                      <div className="text-center py-16">
                        <Landmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No entries found</p>
                        <p className="text-slate-400 text-sm mt-1">
                          {filterBank !== "all"
                            ? "Try changing the bank filter"
                            : "Create your first entry using the form"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredEntries.map((entry) => (
                          <EntryCard key={entry.id} entry={entry} />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {viewMode === "edit" && (
                  <>
                    {/* Back Button */}
                    <button
                      onClick={() => {
                        setViewMode("list");
                        setEditEntryData(null);
                      }}
                      className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition mb-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to entries
                    </button>

                    {/* Edit Form */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                          Amount
                        </label>
                        <div className="relative">
                          <IndianRupee className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={editForm.amount || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^\d*\.?\d*$/.test(val)) {
                                setEditForm({ ...editForm, amount: val });
                              }
                            }}
                            className="w-full h-12 rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                          Date
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                          <input
                            type="date"
                            value={editForm.date || ""}
                            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                            className="w-full h-12 rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                          Transaction Type
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {transactionTypes.map((type) => {
                            const active = (editForm.type || "credit") === type.value;
                            return (
                              <button
                                key={type.value}
                                onClick={() => setEditForm({ ...editForm, type: type.value })}
                                className={`rounded-xl border p-3 text-left transition ${
                                  active
                                    ? "bg-indigo-900 text-white border-indigo-900"
                                    : "bg-white border-slate-200 hover:border-indigo-300"
                                }`}
                              >
                                <div className="text-sm font-semibold">{type.title}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                          Bank
                        </label>
                        <select
                          value={editForm.bank_id || ""}
                          onChange={(e) => setEditForm({ ...editForm, bank_id: e.target.value })}
                          className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                        >
                          <option value="">Select bank</option>
                          {banks.map((b) => (
                            <option key={b.id} value={b.id}>{b.bank_name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                          Remarks
                        </label>
                        <textarea
                          rows={3}
                          value={editForm.remarks || ""}
                          onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                          placeholder="Optional remarks..."
                        />
                      </div>
                    </div>
                  </>
                )}

                {viewMode === "add" && (
                  <>
                    {/* ENTITY */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Entity Name
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                        <input
                          placeholder="Enter entity name"
                          value={newEntry.entity || ""}
                          onChange={(e) =>
                            setNewEntry({
                              ...newEntry,
                              entity: e.target.value,
                            })
                          }
                          className="w-full h-12 rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                        />
                      </div>
                    </div>

                    {/* DATE + AMOUNT */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                          Entry Date
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                          <input
                            type="date"
                            value={newEntry.dateOfBankBal || ""}
                            onChange={(e) =>
                              setNewEntry({
                                ...newEntry,
                                dateOfBankBal: e.target.value,
                              })
                            }
                            className="w-full h-12 rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                          Amount
                        </label>
                        <div className="relative">
                          <IndianRupee className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Enter amount"
                            value={newEntry.amount || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^\d*\.?\d*$/.test(val)) {
                                setNewEntry({
                                  ...newEntry,
                                  amount: val,
                                });
                              }
                            }}
                            className="w-full h-12 rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* TRANSACTION TYPE */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                        Transaction Type
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {transactionTypes.map((type) => {
                          const active =
                            (newEntry.transaction_mode || "credit") ===
                            type.value;
                          return (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() =>
                                setNewEntry({
                                  ...newEntry,
                                  transaction_mode: type.value,
                                })
                              }
                              className={`relative rounded-xl border p-4 text-left transition ${
                                active
                                  ? "bg-indigo-900 text-white border-indigo-900"
                                  : "bg-white border-slate-200 hover:border-indigo-300"
                              }`}
                            >
                              {active && (
                                <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-emerald-400" />
                              )}
                              <div className="text-sm font-semibold">
                                {type.title}
                              </div>
                              <div
                                className={`text-xs mt-1 ${
                                  active
                                    ? "text-slate-300"
                                    : "text-slate-500"
                                }`}
                              >
                                {type.subtitle}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* BANK */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Select Bank
                      </label>
                      <div className="relative">
                        <Landmark className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                        <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        <select
                          value={newEntry.bank_id || ""}
                          onChange={(e) => {
                            if (e.target.value === "ADD_NEW") {
                              setShowAddBank(true);
                              return;
                            }
                            const selectedBank = banks.find(
                              (b) => b.id === e.target.value
                            );
                            setNewEntry({
                              ...newEntry,
                              bank_id: selectedBank?.id,
                              bank_code: selectedBank?.bank_code,
                              entity:
                                selectedBank?.entity ||
                                "Verto India Pvt Ltd",
                            });
                          }}
                          className="appearance-none w-full h-12 rounded-xl border border-slate-200 bg-white pl-11 pr-10 text-sm outline-none transition focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                        >
                          <option value="">
                            Choose bank
                          </option>
                          <option value="ADD_NEW">
                            ➕ Add New Bank
                          </option>
                          {banks.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.bank_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* REMARKS */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Remarks
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                        <textarea
                          rows={3}
                          placeholder="Optional remarks..."
                          value={newEntry.remarks || ""}
                          onChange={(e) =>
                            setNewEntry({
                              ...newEntry,
                              remarks: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-sm outline-none transition resize-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* FOOTER */}
              <div className="bg-white border-t border-slate-200 p-5 flex gap-3">
                {viewMode === "edit" ? (
                  <>
                    <button
                      onClick={() => {
                        setViewMode("list");
                        setEditEntryData(null);
                      }}
                      className="flex-1 h-12 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateEntry}
                      className="flex-1 h-12 rounded-xl bg-indigo-900 text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition"
                    >
                      <Save className="w-4 h-4" />
                      Update Entry
                    </button>
                  </>
                ) : viewMode === "add" ? (
                  <>
                    <button
                      onClick={onClose}
                      className="flex-1 h-12 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (!newEntry.bank_id) {
                          alert("Select Bank First");
                          return;
                        }
                        if (
                          !newEntry.amount ||
                          Number(newEntry.amount) <= 0
                        ) {
                          alert("Enter valid amount");
                          return;
                        }
                        onSave();
                      }}
                      className="flex-1 h-12 rounded-xl bg-indigo-900 text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition"
                    >
                      Save Entry
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD BANK MODAL */}
      <AnimatePresence>
        {showAddBank && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      Add New Bank
                    </h2>
                    <p className="text-emerald-100 text-xs">
                      Create bank account
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddBank(false)}
                  className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3">
                {[
                  {
                    key: "bank_name",
                    placeholder: "Bank Name",
                  },
                  {
                    key: "account_number",
                    placeholder: "Account Number",
                  },
                  {
                    key: "ifsc_code",
                    placeholder: "IFSC Code",
                  },
                  {
                    key: "branch_name",
                    placeholder: "Branch Name",
                  },
                  {
                    key: "bank_code",
                    placeholder: "Bank Code",
                  },
                ].map((field) => (
                  <input
                    key={field.key}
                    placeholder={field.placeholder}
                    value={newBank[field.key]}
                    onChange={(e) =>
                      setNewBank({
                        ...newBank,
                        [field.key]: e.target.value,
                      })
                    }
                    className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400"
                  />
                ))}
              </div>

              <div className="p-5 pt-0 flex gap-3">
                <button
                  onClick={() => setShowAddBank(false)}
                  className="flex-1 h-11 rounded-xl border border-slate-300 text-sm font-medium hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBank}
                  className="flex-1 h-11 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
                >
                  Save Bank
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AddEntryModal;