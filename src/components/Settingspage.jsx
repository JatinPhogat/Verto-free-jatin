import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "../context/SettingsContext";
import {
  Palette,
  BarChart2,
  Bell,
  Zap,
  DollarSign,
  Cpu,
  Keyboard,
  Download,
  ChevronRight,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

/* ─── Toggle ─── */
const Toggle = ({ enabled, onChange, disabled = false }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!enabled)}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
      disabled
        ? "opacity-30 cursor-not-allowed bg-gray-200 dark:bg-slate-600"
        : enabled
        ? "bg-blue-500"
        : "bg-gray-200 dark:bg-slate-600"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
        enabled ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

/* ─── Pill Select ─── */
const PillSelect = ({ options, value, onChange, accent = "blue" }) => {
  const accentMap = {
    blue:    "bg-blue-600 text-white shadow-sm shadow-blue-200",
    indigo:  "bg-indigo-600 text-white shadow-sm shadow-indigo-200",
    violet:  "bg-violet-600 text-white shadow-sm shadow-violet-200",
    amber:   "bg-amber-500 text-white shadow-sm shadow-amber-200",
    rose:    "bg-rose-500 text-white shadow-sm shadow-rose-200",
    emerald: "bg-emerald-500 text-white shadow-sm shadow-emerald-200",
    slate:   "bg-slate-600 text-white shadow-sm shadow-slate-200",
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            value === opt.value
              ? accentMap[accent] + " border-transparent"
              : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-slate-200"
          }`}
        >
          {opt.icon && <span className="mr-1">{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  );
};

/* ─── Setting Row ─── */
const SettingRow = ({ label, description, children, badge }) => (
  <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-100 dark:border-slate-700/50 last:border-0">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-800 dark:text-slate-100">{label}</span>
        {badge && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
            {badge}
          </span>
        )}
      </div>
      {description && (
        <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5 leading-relaxed">{description}</p>
      )}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

/* ─── KBD Badge ─── */
const Kbd = ({ children }) => (
  <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-200 rounded-md text-gray-600 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300">
    {children}
  </kbd>
);

/* ─── Sections ─── */
const SECTIONS = [
  { id: "appearance",   icon: Palette,   title: "Appearance",         subtitle: "Theme, fonts, and display",         gradient: "from-blue-500 to-indigo-600"   },
  { id: "dashboard",    icon: BarChart2, title: "Dashboard",           subtitle: "Default views and data display",    gradient: "from-violet-500 to-purple-600"  },
  { id: "notifications",icon: Bell,      title: "Notifications",       subtitle: "Sounds, alerts, and summaries",     gradient: "from-amber-500 to-orange-500"   },
  { id: "productivity", icon: Zap,       title: "Productivity",        subtitle: "Speed, search, and filter memory",  gradient: "from-emerald-500 to-teal-500"   },
  { id: "finance",      icon: DollarSign,title: "Finance Display",     subtitle: "Number formats and color coding",   gradient: "from-rose-500 to-pink-600"      },
  { id: "shortcuts",    icon: Keyboard,  title: "Keyboard Shortcuts",  subtitle: "Global hotkeys for quick actions",  gradient: "from-indigo-500 to-blue-600"    },
  { id: "export",       icon: Download,  title: "Export Settings",     subtitle: "Default format and options",        gradient: "from-slate-600 to-gray-700"     },
  { id: "advanced",     icon: Cpu,       title: "Advanced",            subtitle: "Performance, animations, and FX",   gradient: "from-slate-500 to-gray-600"     },
];

/* ─── Shortcut rows config ─── */
const SHORTCUT_ROWS = [
  // Quick Add — individually toggleable
  { key: "shortcutAddInvoice",      label: "Add Invoice",             combo: ["Ctrl","I"], group: "Quick Add",  toggleable: true  },
  { key: "shortcutPaymentReceived", label: "Payment Received",        combo: ["Ctrl","P"], group: "Quick Add",  toggleable: true  },
  { key: "shortcutOsPayout",        label: "OS / 3rd Party Payout",   combo: ["Ctrl","O"], group: "Quick Add",  toggleable: true  },
  { key: "shortcutSalaryPayment",   label: "Salary Payout",           combo: ["Ctrl","S"], group: "Quick Add",  toggleable: true  },
  { key: "shortcutExpense",         label: "Add Expense",             combo: ["Ctrl","E"], group: "Quick Add",  toggleable: true  },
  { key: "shortcutCreditNote",      label: "Credit Note / Bad Debt",  combo: ["Ctrl","C"], group: "Quick Add",  toggleable: true  },
  { key: "shortcutBounceBack",      label: "Bounce Back",             combo: ["Ctrl","B"], group: "Quick Add",  toggleable: true  },
  { key: "shortcutAdvanceLoan",     label: "Advance / Loan",          combo: ["Ctrl","A"], group: "Quick Add",  toggleable: true  },
  { key: "shortcutStatutory",       label: "Statutory Payout",        combo: ["Ctrl","G"], group: "Quick Add",  toggleable: true  },
  { key: "shortcutCommandPalette",  label: "Command Palette",         combo: ["Ctrl","K"], group: "Quick Add",  toggleable: true  },
  // Navigate — tied to master switch only
  { key: null, label: "Dashboard",          combo: ["Ctrl","D"], group: "Navigate", toggleable: false },
  { key: null, label: "Internal Team",      combo: ["Ctrl","T"], group: "Navigate", toggleable: false },
  { key: null, label: "Ledger View",        combo: ["Ctrl","L"], group: "Navigate", toggleable: false },
  { key: null, label: "Bank & Fund Flow",   combo: ["Ctrl","J"], group: "Navigate", toggleable: false },
  { key: null, label: "Payment Records",    combo: ["Ctrl","R"], group: "Navigate", toggleable: false },
  { key: null, label: "Salary Records",     combo: ["Ctrl","Y"], group: "Navigate", toggleable: false },
  { key: null, label: "Client Advance",     combo: ["Ctrl","M"], group: "Navigate", toggleable: false },
  // Power
  { key: null, label: "Global Search",      combo: ["Ctrl","F"], group: "Power",    toggleable: false },
  { key: null, label: "Show All Shortcuts", combo: ["Ctrl","/"], group: "Power",    toggleable: false },
];

/* ─── Main Page ─── */
const SettingsPage = () => {
  const { settings, updateSetting, resetSettings } = useSettings();
  const [activeSection, setActiveSection] = useState("appearance");
  const [resetConfirm, setResetConfirm]   = useState(false);
  const [saved, setSaved]                 = useState(false);

  const handleReset = () => {
    if (!resetConfirm) { setResetConfirm(true); return; }
    resetSettings();
    setResetConfirm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const active = SECTIONS.find((s) => s.id === activeSection);

  // Group shortcut rows
  const shortcutGroups = ["Quick Add", "Navigate", "Power"].map((g) => ({
    group: g,
    rows: SHORTCUT_ROWS.filter((r) => r.group === g),
  }));

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-64px)] flex gap-6 p-6">

      {/* ── LEFT SIDEBAR ── */}
      <div className="w-72 flex-shrink-0 space-y-1.5 overflow-y-auto pr-2 scrollbar-hide">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Settings</h2>
          <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">Preferences apply instantly</p>
        </div>

        {SECTIONS.map((section) => {
          const isActive = activeSection === section.id;
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 group ${
                isActive
                  ? "bg-white dark:bg-slate-800 shadow-md border border-gray-100 dark:border-slate-700 ring-1 ring-blue-100 dark:ring-blue-900/30"
                  : "hover:bg-white/70 dark:hover:bg-slate-800/60"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-all ${
                isActive
                  ? `bg-gradient-to-br ${section.gradient}`
                  : "bg-gray-100 dark:bg-slate-700 group-hover:scale-105"
              }`}>
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-500 dark:text-slate-400"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${isActive ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-slate-300"}`}>
                  {section.title}
                </div>
                <div className="text-[11px] text-gray-400 dark:text-slate-500 truncate">{section.subtitle}</div>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? "text-blue-500 translate-x-0.5" : "text-gray-300 dark:text-slate-600"}`} />
            </button>
          );
        })}

        {/* Reset + saved */}
        <div className="pt-4 space-y-2">
          <button
            type="button"
            onClick={handleReset}
            className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              resetConfirm
                ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400"
                : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-gray-300"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {resetConfirm ? "Confirm Reset?" : "Reset All"}
          </button>
          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── RIGHT CONTENT ── */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 overflow-y-auto flex-1 scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.18 }}
            >
              {/* Section header */}
              <div className="flex items-center gap-3 mb-8">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${active.gradient} flex items-center justify-center shadow-lg`}>
                  <active.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{active.title}</h3>
                  <p className="text-sm text-gray-400 dark:text-slate-400">{active.subtitle}</p>
                </div>
              </div>

              {/* ── APPEARANCE ── */}
              {activeSection === "appearance" && (
                <div className="space-y-1">
                  <SettingRow label="Color Mode" description="Changes the entire app theme">
                    <PillSelect value={settings.colorMode} onChange={(v) => updateSetting("colorMode", v)}
                      options={[{ value:"light",label:"☀️ Light"},{value:"dark",label:"🌙 Dark"},{value:"system",label:"🖥️ System"}]} />
                  </SettingRow>
                  <SettingRow label="Night Light" description="Warm tone to reduce eye strain">
                    <PillSelect value={settings.nightLight} onChange={(v) => updateSetting("nightLight", v)} accent="amber"
                      options={[{value:"normal",label:"Normal"},{value:"warm",label:"🌅 Warm"},{value:"extra-warm",label:"🕯️ Extra Warm"}]} />
                  </SettingRow>
                  <SettingRow label="Contrast" description="Increase contrast for better readability">
                    <PillSelect value={settings.contrast} onChange={(v) => updateSetting("contrast", v)} accent="slate"
                      options={[{value:"normal",label:"Normal"},{value:"high",label:"High"},{value:"ultra",label:"Ultra"}]} />
                  </SettingRow>
                  <SettingRow label="Font Size">
                    <PillSelect value={settings.fontSize} onChange={(v) => updateSetting("fontSize", v)}
                      options={[{value:"small",label:"S"},{value:"medium",label:"M"},{value:"large",label:"L"},{value:"xl",label:"XL"}]} />
                  </SettingRow>
                  <SettingRow label="Font Family" description="Changes text throughout the app">
                    <PillSelect value={settings.fontFamily} onChange={(v) => updateSetting("fontFamily", v)}
                      options={[{value:"inter",label:"Inter"},{value:"poppins",label:"Poppins"},{value:"roboto",label:"Roboto"},{value:"opensans",label:"Open Sans"},{value:"system",label:"System"}]} />
                  </SettingRow>
                  <SettingRow label="Compact Mode" description="Reduce row height — great for large tables">
                    <PillSelect value={settings.compactMode} onChange={(v) => updateSetting("compactMode", v)} accent="indigo"
                      options={[{value:"normal",label:"Normal"},{value:"compact",label:"Compact"},{value:"ultra-compact",label:"Ultra"}]} />
                  </SettingRow>
                </div>
              )}

              {/* ── DASHBOARD ── */}
              {activeSection === "dashboard" && (
                <div className="space-y-1">
                  <SettingRow label="Default Period" description="Date range auto-selected on Dashboard load">
                    <PillSelect value={settings.dashboardPeriod} onChange={(v) => updateSetting("dashboardPeriod", v)} accent="violet"
                      options={[{value:"month",label:"This Month"},{value:"3m",label:"3 Months"},{value:"6m",label:"6 Months"},{value:"12m",label:"12 Months"}]} />
                  </SettingRow>
                  <SettingRow label="Landing Page" description="First page shown after login">
                    <PillSelect value={settings.landingPage} onChange={(v) => updateSetting("landingPage", v)} accent="violet"
                      options={[{value:"dashboard",label:"Dashboard"},{value:"pl",label:"P&L"},{value:"banking",label:"Banking"},{value:"invoices",label:"Invoices"},{value:"internal-cost",label:"Internal Cost"}]} />
                  </SettingRow>
                  <SettingRow label="Currency Format" description="How amounts are displayed across the app">
                    <PillSelect value={settings.currencyFormat} onChange={(v) => updateSetting("currencyFormat", v)} accent="violet"
                      options={[{value:"indian",label:"₹1,25,000"},{value:"k",label:"₹125K"},{value:"lakh",label:"₹1.25L"}]} />
                  </SettingRow>
                </div>
              )}

              {/* ── NOTIFICATIONS ── */}
              {activeSection === "notifications" && (
                <div className="space-y-1">
                  <SettingRow label="Sound Notifications" description="Audible alerts for key events">
                    <Toggle enabled={settings.soundNotifications} onChange={(v) => updateSetting("soundNotifications", v)} />
                  </SettingRow>
                  <AnimatePresence>
                    {settings.soundNotifications && (
                      <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 my-2 space-y-2.5">
                          {[["soundPaymentReceived","Payment Received"],["soundInvoiceAdded","Invoice Added"],["soundOsPayout","OS Payout Approved"],["soundSalary","Salary Processed"]].map(([key,label])=>(
                            <div key={key} className="flex items-center justify-between">
                              <span className="text-xs font-medium text-amber-800 dark:text-amber-300">{label}</span>
                              <Toggle enabled={settings[key]} onChange={(v) => updateSetting(key, v)} />
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <SettingRow label="Desktop Notifications" description="Show browser push notifications" badge="Beta">
                    <Toggle enabled={settings.desktopNotifications} onChange={(v) => { if(v&&"Notification"in window)Notification.requestPermission(); updateSetting("desktopNotifications",v); }} />
                  </SettingRow>
                  <SettingRow label="Daily Financial Summary" description="Get a daily digest at end of day">
                    <Toggle enabled={settings.dailySummary} onChange={(v) => updateSetting("dailySummary", v)} />
                  </SettingRow>
                </div>
              )}

              {/* ── PRODUCTIVITY ── */}
              {activeSection === "productivity" && (
                <div className="space-y-1">
                  <SettingRow label="Auto Refresh" description="Automatically refresh dashboard data">
                    <PillSelect value={settings.autoRefresh} onChange={(v) => updateSetting("autoRefresh", v)} accent="emerald"
                      options={[{value:"off",label:"Off"},{value:"30s",label:"30s"},{value:"1m",label:"1 min"},{value:"5m",label:"5 min"}]} />
                  </SettingRow>
                  <SettingRow label="Sticky Filters" description="Remember department, entity, and date range after logout">
                    <Toggle enabled={settings.stickyFilters} onChange={(v) => updateSetting("stickyFilters", v)} />
                  </SettingRow>
                  <SettingRow label="Quick Invoice Search" description="Type 4+ digits anywhere to instantly find an invoice">
                    <Toggle enabled={settings.quickSearch} onChange={(v) => updateSetting("quickSearch", v)} />
                  </SettingRow>
                </div>
              )}

              {/* ── FINANCE ── */}
              {activeSection === "finance" && (
                <div className="space-y-1">
                  <SettingRow label="Number Display" description="How large numbers are formatted">
                    <PillSelect value={settings.numberDisplay} onChange={(v) => updateSetting("numberDisplay", v)} accent="rose"
                      options={[{value:"indian",label:"8,77,99,167"},{value:"million",label:"87.8M"},{value:"raw",label:"87799167"}]} />
                  </SettingRow>
                  <SettingRow label="Negative Values" description="How negative amounts are shown">
                    <PillSelect value={settings.negativeDisplay} onChange={(v) => updateSetting("negativeDisplay", v)} accent="rose"
                      options={[{value:"parens",label:"(10,000)"},{value:"dash",label:"−10,000"},{value:"red",label:"🔴 Red"}]} />
                  </SettingRow>
                  <SettingRow label="Profit / Loss Colors" description="Color scheme for profit and loss indicators">
                    <PillSelect value={settings.profitColor} onChange={(v) => updateSetting("profitColor", v)} accent="emerald"
                      options={[{value:"green",label:"🟢 Green profit"},{value:"inverse",label:"🔴 Inverse"}]} />
                  </SettingRow>
                </div>
              )}

              {/* ── KEYBOARD SHORTCUTS ── */}
              {activeSection === "shortcuts" && (
                <div className="space-y-6">
                  {/* Master switch */}
                  <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                    <div>
                      <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200">Enable All Keyboard Shortcuts</p>
                      <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">Master switch — disabling this turns off all hotkeys</p>
                    </div>
                    <Toggle enabled={settings.shortcutsEnabled} onChange={(v) => updateSetting("shortcutsEnabled", v)} />
                  </div>

                  {/* Per-group rows */}
                  {shortcutGroups.map(({ group, rows }) => (
                    <div key={group}>
                      <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">{group}</p>
                      <div className="space-y-1.5">
                        {rows.map((row) => (
                          <div
                            key={row.key ?? row.label}
                            className={`flex items-center justify-between py-3 px-4 rounded-xl border transition-all ${
                              !settings.shortcutsEnabled
                                ? "opacity-40 bg-gray-50 dark:bg-slate-700/30 border-gray-100 dark:border-slate-700"
                                : "bg-gray-50 dark:bg-slate-700/50 border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                {row.combo.map((k, i) => (
                                  <span key={k} className="flex items-center gap-1">
                                    <Kbd>{k}</Kbd>
                                    {i < row.combo.length - 1 && <span className="text-gray-300 dark:text-slate-500 text-xs">+</span>}
                                  </span>
                                ))}
                              </div>
                              <span className="text-sm font-medium text-gray-700 dark:text-slate-200">{row.label}</span>
                              {!row.toggleable && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-400 uppercase tracking-wider">always on</span>
                              )}
                            </div>
                            {row.toggleable ? (
                              <Toggle
                                enabled={!!settings[row.key]}
                                onChange={(v) => updateSetting(row.key, v)}
                                disabled={!settings.shortcutsEnabled}
                              />
                            ) : (
                              <span className="w-5 h-5 flex items-center justify-center text-gray-300 dark:text-slate-600">
                                <CheckCircle2 className="w-4 h-4" />
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <p className="text-[11px] text-gray-400 dark:text-slate-500 text-center pt-2">
                    Shortcuts don't fire when typing inside inputs or textareas
                  </p>
                </div>
              )}

              {/* ── EXPORT SETTINGS ── */}
              {activeSection === "export" && (
                <div className="space-y-1">
                  <SettingRow label="Default Export Type" description="Format used when exporting tables or reports">
                    <PillSelect value={settings.defaultExportType} onChange={(v) => updateSetting("defaultExportType", v)} accent="slate"
                      options={[{value:"excel",label:"📊 Excel"},{value:"pdf",label:"📄 PDF"},{value:"csv",label:"📋 CSV"}]} />
                  </SettingRow>
                  <SettingRow label="Include Company Logo" description="Embed logo in exported PDF and Excel headers">
                    <Toggle enabled={settings.includeCompanyLogo} onChange={(v) => updateSetting("includeCompanyLogo", v)} />
                  </SettingRow>
                  <SettingRow label="Include Filters" description="Append active filter summary to exported documents">
                    <Toggle enabled={settings.includeFilters} onChange={(v) => updateSetting("includeFilters", v)} />
                  </SettingRow>

                  {/* Live export preview */}
                  <div className="mt-6 p-5 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-700/50 dark:to-slate-800/50 border border-gray-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-3">Export Preview</p>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-600 p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-slate-700">
                        <div className="flex items-center gap-2.5">
                          {settings.includeCompanyLogo && (
                            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-base">🏢</div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-slate-100">Verto Finance</p>
                            <p className="text-[10px] text-gray-400 dark:text-slate-500">Report Export</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                          settings.defaultExportType === "excel" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          settings.defaultExportType === "pdf"   ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                                                   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}>
                          {settings.defaultExportType}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full w-3/4" />
                        <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full w-1/2" />
                        <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full w-5/6" />
                        <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full w-2/3" />
                      </div>
                      {settings.includeFilters && (
                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                          <span className="text-[10px] text-gray-400 dark:text-slate-500">
                            Filters: Department = All · Entity = All · Date = This Month
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── ADVANCED ── */}
              {activeSection === "advanced" && (
                <div className="space-y-1">
                  <SettingRow label="Performance Mode" description="Disables animations, glow effects, and particles — for slower machines">
                    <Toggle enabled={settings.performanceMode} onChange={(v) => updateSetting("performanceMode", v)} />
                  </SettingRow>
                  <SettingRow label="Startup Live Screen" description="Show live activity screen immediately after login">
                    <Toggle enabled={settings.startupLiveScreen} onChange={(v) => updateSetting("startupLiveScreen", v)} />
                  </SettingRow>
                  <SettingRow label="Star Background" description="Animated star particles in the background">
                    <Toggle enabled={settings.starBackground} onChange={(v) => updateSetting("starBackground", v)} />
                  </SettingRow>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Save footer */}
          <div className="mt-8 pt-4 border-t border-gray-100 dark:border-slate-700">
            <button
              type="button"
              onClick={handleSave}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Settings Saved Automatically · Tap to Confirm
            </button>
            <p className="text-center text-[10px] text-gray-400 dark:text-slate-500 mt-2">
              All changes apply instantly and persist across sessions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;