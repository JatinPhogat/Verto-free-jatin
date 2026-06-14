import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { SHORTCUT_ACTIONS, formatCombo } from "../utils/shortcutDefaults";

const colorMap = {
  "Quick Add": "bg-blue-50 text-blue-700 border-blue-100",
  Navigate:    "bg-indigo-50 text-indigo-700 border-indigo-100",
  Power:       "bg-violet-50 text-violet-700 border-violet-100",
};

export default function ShortcutsHelp({ isOpen, onClose }) {
  const { shortcuts } = useSettings();

  const groups = ["Quick Add", "Navigate", "Power"].map((g) => ({
    title: g,
    items: SHORTCUT_ACTIONS.filter((a) => a.group === g).map((a) => ({
      label: a.label,
      combo: formatCombo(shortcuts[a.id] || a.default),
      custom: (shortcuts[a.id] || a.default) !== a.default,
    })),
  }));

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
                  <p className="text-slate-400 text-xs">Your current shortcuts · customize in Settings</p>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid */}
            <div className="p-6 grid grid-cols-3 gap-5 max-h-[70vh] overflow-y-auto">
              {groups.map((group) => (
                <div key={group.title}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                    {group.title}
                  </p>
                  <div className="space-y-1.5">
                    {group.items.map(({ label, combo, custom }) => (
                      <div key={label} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-600 truncate">{label}</span>
                        <kbd className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border whitespace-nowrap flex-shrink-0 ${
                          custom
                            ? "bg-violet-50 text-violet-700 border-violet-200"
                            : colorMap[group.title]
                        }`}>
                          {combo}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                <span className="inline-block w-2 h-2 rounded-full bg-violet-400 mr-1" />
                Purple = customized
              </span>
              <span className="text-xs text-gray-400">
                Shortcuts only fire when not typing · <kbd className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[10px]">Esc</kbd> to close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}