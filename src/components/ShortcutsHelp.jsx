import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";

const GROUPS = [
  {
    title: "Quick Add",
    color: "blue",
    items: [
      ["Ctrl + I", "Add Invoice"],
      ["Ctrl + P", "Payment Received"],
      ["Ctrl + O", "OS / 3rd Party Payout"],
      ["Ctrl + S", "Salary Payout"],
      ["Ctrl + E", "Add Expense"],
      ["Ctrl + C", "Credit Note / Bad Debt"],
      ["Ctrl + B", "Bounce Back"],
      ["Ctrl + A", "Advance / Loan"],
      ["Ctrl + G", "Statutory Payout"],
    ],
  },
  {
    title: "Navigate",
    color: "indigo",
    items: [
      ["Ctrl + D", "Dashboard"],
      ["Ctrl + H", "Home (Dashboard)"],
      ["Ctrl + T", "Internal Team"],
      ["Ctrl + L", "Ledger View"],
      ["Ctrl + J", "Bank & Fund Flow"],
      ["Ctrl + M", "Client Advance"],
      ["Ctrl + Y", "Salary Records"],
      ["Ctrl + R", "Payment Records"],
    ],
  },
  {
    title: "Power",
    color: "violet",
    items: [
      ["Ctrl + K", "Command Palette"],
      ["Ctrl + F", "Global Search"],
      ["Ctrl + /", "Show This Help"],
    ],
  },
];

const colorMap = {
  blue:   "bg-blue-50 text-blue-700 border-blue-100",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
  violet: "bg-violet-50 text-violet-700 border-violet-100",
};

export default function ShortcutsHelp({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                  <Keyboard className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Keyboard Shortcuts</h3>
                  <p className="text-slate-400 text-xs">All shortcuts — press Ctrl + K to search</p>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid */}
            <div className="p-6 grid grid-cols-3 gap-5">
              {GROUPS.map((group) => (
                <div key={group.title}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                    {group.title}
                  </p>
                  <div className="space-y-1.5">
                    {group.items.map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-600 truncate">{label}</span>
                        <kbd className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border whitespace-nowrap flex-shrink-0 ${colorMap[group.color]}`}>
                          {key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-400">
              Shortcuts only fire when you're not typing in a field · Press <kbd className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[10px]">Esc</kbd> to close
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}