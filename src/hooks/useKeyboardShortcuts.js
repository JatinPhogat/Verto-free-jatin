import { useEffect, useCallback } from "react";
import { useSettings } from "../context/SettingsContext";

// Maps Ctrl+key → { settingKey, event }
// settingKey: null = always-on nav shortcut (not toggleable individually)
const SHORTCUT_MAP = [
  // ── Quick Add (individually toggleable) ──
  { key: "i", settingKey: "shortcutAddInvoice",      event: "verto:shortcut:add-invoice"        },
  { key: "p", settingKey: "shortcutPaymentReceived",  event: "verto:shortcut:payment-received"   },
  { key: "o", settingKey: "shortcutOsPayout",         event: "verto:shortcut:os-payout"          },
  { key: "s", settingKey: "shortcutSalaryPayment",    event: "verto:shortcut:salary-payment"     },
  { key: "e", settingKey: "shortcutExpense",          event: "verto:shortcut:expense-material"   },
  { key: "c", settingKey: "shortcutCreditNote",       event: "verto:shortcut:cn-bad-debt"        },
  { key: "b", settingKey: "shortcutBounceBack",       event: "verto:shortcut:bounce-back"        },
  { key: "a", settingKey: "shortcutAdvanceLoan",      event: "verto:shortcut:advance-loan"       },
  { key: "g", settingKey: "shortcutStatutory",        event: "verto:shortcut:statutory-payout"   },
  { key: "k", settingKey: "shortcutCommandPalette",   event: "verto:shortcut:command-palette"    },

  // ── Navigation (no individual toggle — tied to master switch only) ──
  { key: "d", settingKey: null, event: "verto:shortcut:dashboard"            },
  { key: "h", settingKey: null, event: "verto:shortcut:dashboard"            },
  { key: "t", settingKey: null, event: "verto:shortcut:internal-team-nav"    },
  { key: "l", settingKey: null, event: "verto:shortcut:ledger-nav"           },
  { key: "j", settingKey: null, event: "verto:shortcut:bank-nav"             },
  { key: "r", settingKey: null, event: "verto:shortcut:payment-records-nav"  },
  { key: "y", settingKey: null, event: "verto:shortcut:salary-records-nav"   },
  { key: "m", settingKey: null, event: "verto:shortcut:client-advance-nav"   },
  { key: "f", settingKey: null, event: "verto:shortcut:global-search"        },
  { key: "/", settingKey: null, event: "verto:shortcut:help"                 },
];

export function useKeyboardShortcuts() {
  const { settings } = useSettings();

  const handleKeyDown = useCallback(
    (e) => {
      // Master switch
      if (!settings.shortcutsEnabled) return;
      if (!e.ctrlKey && !e.metaKey) return;

      // Don't fire when user is typing
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (document.activeElement?.isContentEditable) return;

      const key = e.key === "/" ? "/" : e.key.toLowerCase();

      const shortcut = SHORTCUT_MAP.find((s) => s.key === key);
      if (!shortcut) return;

      // Per-key toggle check (only for toggleable shortcuts)
      if (shortcut.settingKey && !settings[shortcut.settingKey]) return;

      e.preventDefault();
      e.stopPropagation();

      window.dispatchEvent(new CustomEvent(shortcut.event, { bubbles: true }));
    },
    [settings]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export default useKeyboardShortcuts;