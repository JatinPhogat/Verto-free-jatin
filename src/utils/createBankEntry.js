import supabase from "../lib/supabaseClient";

// ======================================================
// CREATE BANK ENTRY (COMMON HELPER)
// ======================================================

export const createBankEntry = async ({
  bank_id,
  entity,
  amount,
  type,
  entry_type,
  remarks,
  reference_no,
  invoice_id = null,
}) => {

  try {

    // ✅ PREVENT DUPLICATE
    const { data: existing } = await supabase
      .from("bank_entries")
      .select("id")
      .eq("reference_no", reference_no)
      .eq("entry_type", entry_type)
      .eq("bank_id", bank_id)
      .maybeSingle();

    if (existing) {

      console.log(
        "⚠ Duplicate bank entry skipped:",
        reference_no
      );

      return {
        success: false,
        duplicate: true,
      };
    }

    // ✅ INSERT ENTRY
    const { data, error } = await supabase
      .from("bank_entries")
      .insert([
        {
          bank_id,
          entity,
          amount: Math.abs(Number(amount || 0)),
          type,
          entry_type,
          remarks,
          reference_no,
          invoice_id,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Bank entry created:", data);

    return {
      success: true,
      data,
    };

  } catch (err) {

    console.error("❌ createBankEntry error:", err);

    return {
      success: false,
      error: err.message,
    };
  }
};