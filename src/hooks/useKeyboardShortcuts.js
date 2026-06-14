import { useEffect, useCallback } from "react";
import { useSettings } from "../context/SettingsContext";
import { SHORTCUT_ACTIONS, comboToString } from "../utils/shortcutDefaults";

// Maps action id -> the old per-shortcut toggle key in `settings`
// (only Quick Add + Command Palette were individually toggleable before;
//  Navigate/Power items are tied to the master switch only)
const TOGGLE_KEY_MAP = {
  addInvoice: "shortcutAddInvoice",
  paymentReceived: "shortcutPaymentReceived",
  osPayout: "shortcutOsPayout",
  salaryPayment: "shortcutSalaryPayment",
  expense: "shortcutExpense",
  creditNote: "shortcutCreditNote",
  bounceBack: "shortcutBounceBack",
  advanceLoan: "shortcutAdvanceLoan",
  statutory: "shortcutStatutory",
  commandPalette: "shortcutCommandPalette",
};

export function useKeyboardShortcuts() {
  const { settings, shortcuts, shortcutsLoaded } = useSettings();

  const handleKeyDown = useCallback(
    (e) => {
      // Master switch
      if (!settings.shortcutsEnabled) return;
      // Wait until custom shortcuts have loaded so we don't fire on defaults
      // for a frame and then "jump" once the user's overrides arrive.
      if (!shortcutsLoaded) return;

      // Don't fire when typing inside an input/textarea/select/contenteditable
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (document.activeElement?.isContentEditable) return;

      const combo = comboToString(e);
      if (!combo) return;

      // Only handle combos that involve Ctrl/Cmd (keeps plain typing safe)
      if (!combo.startsWith("ctrl")) return;

      const action = SHORTCUT_ACTIONS.find(
        (a) => shortcuts[a.id] === combo
      );
      if (!action) return;

      // Per-action toggle (Quick Add + Command Palette)
      const toggleKey = TOGGLE_KEY_MAP[action.id];
      if (toggleKey && !settings[toggleKey]) return;

      e.preventDefault();
      e.stopPropagation();

      window.dispatchEvent(new CustomEvent(action.event, { bubbles: true }));
    },
    [settings, shortcuts, shortcutsLoaded]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export default useKeyboardShortcuts;