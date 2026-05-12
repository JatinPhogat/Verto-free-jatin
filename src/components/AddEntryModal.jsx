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
} from "lucide-react";

import supabase from "../lib/supabaseClient";

const AddEntryModal = ({
  isOpen,
  onClose,
  newEntry,
  setNewEntry,
  onSave,
  banks,
}) => {
  const [showAddBank, setShowAddBank] = useState(false);

  const [newBank, setNewBank] = useState({
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    branch_name: "",
    bank_code: "",
  });

  if (!isOpen) return null;

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
                        Add Bank Entry
                      </h2>

                      <p className="text-indigo-100 text-sm mt-1">
                        Record bank transaction
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* BODY */}

              <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
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
              </div>

              {/* FOOTER */}

              <div className="bg-white border-t border-slate-200 p-5 flex gap-3">
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