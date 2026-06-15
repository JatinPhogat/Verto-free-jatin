import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, CreditCard } from "lucide-react";
import supabase from "../../lib/supabaseClient";
import { usePerms } from "../../context/PermissionsContext";

// REMOVED: const BANK_OPTIONS = [...] — now fetched from bank_master

export default function AddCreditCardModal({ isOpen, onClose }) {
  const { isIntern } = usePerms?.() || {};
  const [form, setForm] = useState({
    bank: "", card_last4: "", issued_to: "", billing_cycle_from: "", billing_cycle_to: "", payment_date: "",
  });
  const [saving, setSaving] = useState(false);

  // Dynamic banks from bank_master
  const [banks, setBanks] = useState([]);

  useEffect(() => {
    fetchBanks();
  }, []);

  async function fetchBanks() {
    const { data } = await supabase
      .from("bank_master")
      .select("id, bank_name")
      .order("bank_name");
    setBanks(data || []);
  }

  const goldGrad = "linear-gradient(135deg, #78350f 0%, #b45309 60%, #d97706 100%)";

  async function handleSave() {
    if (isIntern) return;
    if (!form.bank || !form.card_last4) return;
    setSaving(true);
    await supabase.from("credit_card_master").insert([form]);
    setSaving(false);
    onClose();
    setForm({ bank: "", card_last4: "", issued_to: "", billing_cycle_from: "", billing_cycle_to: "", payment_date: "" });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" style={{ background: "#1c1200", border: "1px solid #78350f" }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ background: goldGrad }}>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-white" />
                <h2 className="text-white font-bold text-lg">Add Credit Card</h2>
              </div>
              <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {/* Bank — dynamic from bank_master */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#d97706" }}>Bank *</label>
                <select className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none text-white"
                  style={{ background: "#2a1f00", border: "1px solid #78350f" }}
                  value={form.bank} onChange={(e) => setForm((f) => ({ ...f, bank: e.target.value }))}>
                  <option value="">Select Bank</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.bank_name}>{b.bank_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#d97706" }}>Card Last 4 Digits *</label>
                <input maxLength={4} className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none text-white"
                  style={{ background: "#2a1f00", border: "1px solid #78350f" }}
                  value={form.card_last4} onChange={(e) => setForm((f) => ({ ...f, card_last4: e.target.value.replace(/\D/g, "") }))}
                  placeholder="e.g. 4321" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#d97706" }}>Issued To</label>
                <input className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none text-white"
                  style={{ background: "#2a1f00", border: "1px solid #78350f" }}
                  value={form.issued_to} onChange={(e) => setForm((f) => ({ ...f, issued_to: e.target.value }))} placeholder="Name" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#d97706" }}>Billing Cycle From</label>
                <input type="date" className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none text-white"
                  style={{ background: "#2a1f00", border: "1px solid #78350f" }}
                  value={form.billing_cycle_from} onChange={(e) => setForm((f) => ({ ...f, billing_cycle_from: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#d97706" }}>Billing Cycle To</label>
                <input type="date" className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none text-white"
                  style={{ background: "#2a1f00", border: "1px solid #78350f" }}
                  value={form.billing_cycle_to} onChange={(e) => setForm((f) => ({ ...f, billing_cycle_to: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#d97706" }}>Payment Date</label>
                <input type="date" className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none text-white"
                  style={{ background: "#2a1f00", border: "1px solid #78350f" }}
                  value={form.payment_date} onChange={(e) => setForm((f) => ({ ...f, payment_date: e.target.value }))} />
              </div>
            </div>
            <div className="px-6 pb-6 flex justify-end gap-3">
              <button onClick={onClose} className="px-5 py-2.5 rounded-xl border text-gray-300 text-sm font-semibold"
                style={{ borderColor: "#78350f" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving || isIntern} className={`px-6 py-2.5 text-white rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-60 ${
                isIntern ? "cursor-not-allowed" : ""
              }`} style={{ background: goldGrad }}>
                <Save className="w-4 h-4" /> {saving ? "Saving…" : isIntern ? "View Only" : "Save Card"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}