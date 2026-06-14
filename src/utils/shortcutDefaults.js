// ──────────────────────────────────────────────────────────────────────────
// Central registry of keyboard shortcut actions + their default key combos.
// Combo format: lowercase, "+"-joined, modifiers in order ctrl, shift, alt,
// then the key itself. e.g. "ctrl+i", "ctrl+shift+f"
// ──────────────────────────────────────────────────────────────────────────

export const SHORTCUT_ACTIONS = [
    // ── Quick Add ──
    { id: "addInvoice",        label: "Add Invoice",            group: "Quick Add", default: "ctrl+i", event: "verto:shortcut:add-invoice" },
    { id: "paymentReceived",   label: "Payment Received",       group: "Quick Add", default: "ctrl+p", event: "verto:shortcut:payment-received" },
    { id: "osPayout",          label: "OS / 3rd Party Payout",  group: "Quick Add", default: "ctrl+o", event: "verto:shortcut:os-payout" },
    { id: "salaryPayment",     label: "Salary Payout",          group: "Quick Add", default: "ctrl+s", event: "verto:shortcut:salary-payment" },
    { id: "expense",           label: "Add Expense",            group: "Quick Add", default: "ctrl+e", event: "verto:shortcut:expense-material" },
    { id: "creditNote",        label: "Credit Note / Bad Debt", group: "Quick Add", default: "ctrl+c", event: "verto:shortcut:cn-bad-debt" },
    { id: "bounceBack",        label: "Bounce Back",            group: "Quick Add", default: "ctrl+b", event: "verto:shortcut:bounce-back" },
    { id: "advanceLoan",       label: "Advance / Loan",         group: "Quick Add", default: "ctrl+a", event: "verto:shortcut:advance-loan" },
    { id: "statutory",         label: "Statutory Payout",       group: "Quick Add", default: "ctrl+g", event: "verto:shortcut:statutory-payout" },
  
    // ── Navigate ──
    { id: "dashboardNav",      label: "Dashboard",              group: "Navigate", default: "ctrl+d",       event: "verto:shortcut:dashboard" },
    { id: "internalTeamNav",   label: "Internal Team",          group: "Navigate", default: "ctrl+t",       event: "verto:shortcut:internal-team-nav" },
    { id: "ledgerNav",         label: "Ledger View",            group: "Navigate", default: "ctrl+l",       event: "verto:shortcut:ledger-nav" },
    { id: "bankNav",           label: "Bank & Fund Flow",        group: "Navigate", default: "ctrl+j",       event: "verto:shortcut:bank-nav" },
    { id: "paymentRecordsNav", label: "Payment Records",         group: "Navigate", default: "ctrl+r",       event: "verto:shortcut:payment-records-nav" },
    { id: "salaryRecordsNav",  label: "Salary Records",          group: "Navigate", default: "ctrl+y",       event: "verto:shortcut:salary-records-nav" },
    { id: "clientAdvanceNav",  label: "Client Advance",          group: "Navigate", default: "ctrl+m",       event: "verto:shortcut:client-advance-nav" },
    { id: "financeRegisterNav",label: "Payment Center / Finance Register", group: "Navigate", default: "ctrl+shift+f", event: "verto:shortcut:payment-center" },
  
    // ── Power ──
    { id: "commandPalette",    label: "Command Palette",         group: "Power", default: "ctrl+k", event: "verto:shortcut:command-palette" },
    { id: "globalSearch",      label: "Global Search",           group: "Power", default: "ctrl+f", event: "verto:shortcut:global-search" },
    { id: "help",              label: "Show All Shortcuts",      group: "Power", default: "ctrl+/", event: "verto:shortcut:help" },
  ];
  
  // Quick id -> action lookup
  export const SHORTCUT_ACTIONS_BY_ID = SHORTCUT_ACTIONS.reduce((acc, a) => {
    acc[a.id] = a;
    return acc;
  }, {});
  
  // { addInvoice: "ctrl+i", paymentReceived: "ctrl+p", ... }
  export const DEFAULT_SHORTCUT_MAP = SHORTCUT_ACTIONS.reduce((acc, a) => {
    acc[a.id] = a.default;
    return acc;
  }, {});
  
  // ──────────────────────────────────────────────────────────────────────────
  // Convert a KeyboardEvent into a normalized combo string, e.g. "ctrl+shift+i"
  // Returns null while only modifier keys are held (not a complete combo yet).
  // ──────────────────────────────────────────────────────────────────────────
  export function comboToString(e) {
    const key = e.key?.toLowerCase();
    if (!key) return null;
    if (["control", "shift", "alt", "meta"].includes(key)) return null;
  
    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push("ctrl");
    if (e.shiftKey) parts.push("shift");
    if (e.altKey) parts.push("alt");
  
    parts.push(key === " " ? "space" : key);
    return parts.join("+");
  }
  
  // "ctrl+shift+i" -> "Ctrl + Shift + I"
  export function formatCombo(combo) {
    if (!combo) return "";
    return combo
      .split("+")
      .map((p) => (p === "/" ? "/" : p.charAt(0).toUpperCase() + p.slice(1)))
      .join(" + ");
  }
  
  // Returns the action id that already uses `combo` (excluding `excludeId`), or null
  export function findConflict(shortcutMap, combo, excludeId) {
    for (const [id, c] of Object.entries(shortcutMap)) {
      if (id !== excludeId && c === combo) return id;
    }
    return null;
  }