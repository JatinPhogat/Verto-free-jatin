import { useEffect, useCallback } from "react";
import { useSettings } from "../context/SettingsContext";

export function useKeyboardShortcuts() {
  const { settings } = useSettings();

  const handleKeyDown = useCallback(
    (e) => {
      if (!settings.shortcutsEnabled) return;
      if (!e.ctrlKey) return;

      // Don't fire when typing inside an input/textarea/select
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      const key = e.key === "/" ? "/" : e.key.toLowerCase();

      const map = {
        // ── Modals ──
        i: "verto:shortcut:add-invoice",
        p: "verto:shortcut:payment-received",
        o: "verto:shortcut:os-payout",
        s: "verto:shortcut:salary-payment",
        e: "verto:shortcut:expense-material",
        c: "verto:shortcut:cn-bad-debt",
        b: "verto:shortcut:bounce-back",
        a: "verto:shortcut:advance-loan",
        g: "verto:shortcut:statutory-payout",
        // ── Navigation ──
        d: "verto:shortcut:dashboard",
        h: "verto:shortcut:dashboard",
        t: "verto:shortcut:internal-team-nav",
        l: "verto:shortcut:ledger-nav",
        j: "verto:shortcut:bank-nav",
        r: "verto:shortcut:payment-records-nav",
        y: "verto:shortcut:salary-records-nav",
        m: "verto:shortcut:client-advance-nav",
        // ── Special ──
        k: "verto:shortcut:command-palette",
        f: "verto:shortcut:global-search",
        "/": "verto:shortcut:help",
      };

      const event = map[key];
      if (!event) return;

      e.preventDefault();
      e.stopPropagation();

      window.dispatchEvent(new CustomEvent(event, { bubbles: true }));
    },
    [settings.shortcutsEnabled]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export default useKeyboardShortcuts;