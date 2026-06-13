import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, FileText, DollarSign, Users, CreditCard,
  TrendingUp, LayoutDashboard, Wallet, ArrowRight,
  CornerDownLeft, X, Keyboard,
} from "lucide-react";

const ACTIONS = [
  { label: "Add Invoice",           icon: FileText,       event: "verto:shortcut:add-invoice",      shortcut: "Ctrl+I", color: "text-blue-500 bg-blue-50" },
  { label: "Payment Received",      icon: DollarSign,     event: "verto:shortcut:payment-received",  shortcut: "Ctrl+P", color: "text-emerald-500 bg-emerald-50" },
  { label: "OS / 3rd Party Payout", icon: Users,          event: "verto:shortcut:os-payout",         shortcut: "Ctrl+O", color: "text-purple-500 bg-purple-50" },
  { label: "Salary Payout",         icon: CreditCard,     event: "verto:shortcut:salary-payment",    shortcut: "Ctrl+S", color: "text-indigo-500 bg-indigo-50" },
  { label: "Add Expense",           icon: Wallet,         event: "verto:shortcut:expense-material",  shortcut: "Ctrl+E", color: "text-orange-500 bg-orange-50" },
  { label: "Credit Note / Bad Debt",icon: FileText,       event: "verto:shortcut:cn-bad-debt",       shortcut: "Ctrl+C", color: "text-violet-500 bg-violet-50" },
  { label: "Bounce Back",           icon: ArrowRight,     event: "verto:shortcut:bounce-back",       shortcut: "Ctrl+B", color: "text-rose-500 bg-rose-50" },
  { label: "Advance / Loan",        icon: CreditCard,     event: "verto:shortcut:advance-loan",      shortcut: "Ctrl+A", color: "text-cyan-500 bg-cyan-50" },
  { label: "Statutory Payout",      icon: FileText,       event: "verto:shortcut:statutory-payout",  shortcut: "Ctrl+G", color: "text-teal-500 bg-teal-50" },
  { label: "Dashboard",             icon: LayoutDashboard,event: "verto:shortcut:dashboard",          shortcut: "Ctrl+D", color: "text-gray-500 bg-gray-100" },
  { label: "Internal Team",         icon: Users,          event: "verto:shortcut:internal-team-nav",  shortcut: "Ctrl+T", color: "text-gray-500 bg-gray-100" },
  { label: "Bank & Fund Flow",      icon: TrendingUp,     event: "verto:shortcut:bank-nav",           shortcut: "Ctrl+J", color: "text-gray-500 bg-gray-100" },
  { label: "Client Advance",        icon: CreditCard,     event: "verto:shortcut:client-advance-nav", shortcut: "Ctrl+M", color: "text-gray-500 bg-gray-100" },
  { label: "Keyboard Shortcuts",    icon: Keyboard,       event: "verto:shortcut:help",               shortcut: "Ctrl+/", color: "text-gray-400 bg-gray-50" },
];

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);

  const filtered = ACTIONS.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => { setSelected(0); }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
      if (e.key === "Enter") {
        e.preventDefault();
        const action = filtered[selected];
        if (action) { fire(action); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, filtered, selected]);

  const fire = (action) => {
    window.dispatchEvent(new CustomEvent(action.event, { bubbles: true }));
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-start justify-center pt-[15vh] px-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
            style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.2)" }}
          >
            {/* Search bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search actions…"
                className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
              />
              <kbd className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-[380px] overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">No actions match "{query}"</div>
              ) : (
                filtered.map((action, idx) => (
                  <button
                    key={action.event}
                    onClick={() => fire(action)}
                    onMouseEnter={() => setSelected(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      selected === idx ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${action.color}`}>
                      <action.icon className="w-4 h-4" />
                    </div>
                    <span className={`flex-1 text-sm font-medium ${selected === idx ? "text-blue-700" : "text-gray-800"}`}>
                      {action.label}
                    </span>
                    <kbd className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg hidden sm:block">
                      {action.shortcut}
                    </kbd>
                    {selected === idx && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium">
                <span className="flex items-center gap-1"><kbd className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[9px]">↑↓</kbd> navigate</span>
                <span className="flex items-center gap-1"><kbd className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[9px]">↵</kbd> open</span>
                <span className="flex items-center gap-1"><kbd className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[9px]">Esc</kbd> close</span>
              </div>
              <span className="text-[10px] text-gray-400">{filtered.length} actions</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}