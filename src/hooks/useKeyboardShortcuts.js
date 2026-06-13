import { useEffect, useCallback } from "react";
import { useSettings } from "../context/SettingsContext";

/**
 * Global keyboard shortcuts hook.
 * Place this inside your main App component (or layout).
 * It dispatches CustomEvents you can listen to anywhere.
 */
export function useKeyboardShortcuts() {
  const { settings } = useSettings();

  const handleKeyDown = useCallback(
    (e) => {
      if (!settings.shortcutsEnabled) return;
      if (!e.ctrlKey) return;

      const map = {
        i: { key: "shortcutAddInvoice", event: "verto:shortcut:add-invoice" },
        p: { key: "shortcutPaymentReceived", event: "verto:shortcut:payment-received" },
        o: { key: "shortcutOsPayout", event: "verto:shortcut:os-payout" },
        s: { key: "shortcutSalaryPayment", event: "verto:shortcut:salary-payment" },
      };

      const entry = map[e.key.toLowerCase()];
      if (!entry) return;
      if (!settings[entry.key]) return;

      e.preventDefault();
      e.stopPropagation();

      window.dispatchEvent(new CustomEvent(entry.event, { bubbles: true }));
    },
    [settings]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export default useKeyboardShortcuts;