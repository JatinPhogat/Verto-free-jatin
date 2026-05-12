import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Database } from "lucide-react";

import supabase from "../lib/supabaseClient";

const ExpenseViewModal = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);

  const [rows, setRows] = useState([]);

  // ✅ FETCH ALL DATA
  useEffect(() => {
    if (!open) return;

    fetchExpenses();
  }, [open]);

  const fetchExpenses = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("payment_made_view")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      console.log("FULL EXPENSE DATA:", data);

      setRows(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return `₹ ${Number(value || 0).toLocaleString("en-IN")}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN");
  };

  if (!open) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[999999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-[98vw] h-[95vh] overflow-hidden flex flex-col"
        >
          {/* HEADER */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-2xl">
                <Database className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-2xl font-bold">Expense Database View</h2>

                <p className="text-orange-100 text-sm">
                  SQL Style Expense Table
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-auto bg-gray-100 p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-300 overflow-auto">
                <table className="min-w-full text-sm border-collapse">
                  <thead className="bg-gray-200 sticky top-0 z-20">
                    <tr>
                      <TH>Client</TH>
                      <TH>Entity</TH>
                      <TH>Department</TH>
                      <TH>Pay Head</TH>
                      <TH>Due Amount</TH>
                      <TH>TDS</TH>
                      <TH>Transfer</TH>
                      <TH>Payment Date</TH>
                      <TH>Bank</TH>
                      <TH>Billable</TH>
                      <TH>Cash</TH>
                      <TH>Created At</TH>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan="13"
                          className="text-center py-10 text-gray-500"
                        >
                          No Expense Data Found
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, index) => (
                        <tr
                          key={row.id}
                          className={`border-b border-gray-300 hover:bg-orange-100 transition text-black ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                        >
                          <TD>{row.client_name}</TD>

                          <TD>{row.entity}</TD>

                          <TD>{row.department}</TD>

                          <TD>{row.pay_head}</TD>

                          <TD>{formatCurrency(row.due_amount)}</TD>

                          <TD>{formatCurrency(row.tds_amount)}</TD>

                          <TD>{formatCurrency(row.transfer_amount)}</TD>

                          <TD>{formatDate(row.payment_date)}</TD>

                          <TD>{row.bank_name}</TD>

                          <TD>{row.is_billable ? "YES" : "NO"}</TD>

                          <TD>{row.petty_cash ? "YES" : "NO"}</TD>

                          <TD>{formatDate(row.created_at)}</TD>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,

    document.body
  );
};

// TABLE HEADER
const TH = ({ children }) => (
  <th className="px-4 py-3 text-left border border-gray-300 font-bold whitespace-nowrap bg-gray-800 text-white">
    {children}
  </th>
);

// TABLE DATA
const TD = ({ children }) => (
  <td className="px-4 py-3 border border-gray-200 whitespace-nowrap text-black font-medium">
    {children || "-"}
  </td>
);

export default ExpenseViewModal;
