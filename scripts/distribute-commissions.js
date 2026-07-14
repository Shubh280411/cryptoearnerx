const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://udqtrnarcllvnczhfmoj.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkcXRybmFyY2xsdm5jemhmbW9qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzg3Njk1OCwiZXhwIjoyMDk5NDUyOTU4fQ.2ETUJuhTrdQE5RWAkcY8-dWMObfX-TKFVHzQ5mllE7o";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const REFERRAL_RATE = 10;
const LEVEL_RATES = [3, 2, 1, 0.5, 0.25];

async function creditWallet(userId, amount) {
  const { data: wallet } = await supabase.from("wallet").select("balance").eq("user_id", userId).single();
  const currentBalance = parseFloat(wallet?.balance || "0");
  const newBalance = currentBalance + amount;

  await supabase.from("wallet").update({ balance: newBalance }).eq("user_id", userId);

  await supabase.from("transactions").insert({
    user_id: userId,
    type: "referral_bonus",
    amount,
    balance_before: currentBalance,
    balance_after: newBalance,
    description: `Commission from downline investment`,
    status: "completed",
  });

  return { balance_before: currentBalance, balance_after: newBalance };
}

async function main() {
  console.log("=== Distributing commissions ===\n");

  const { data: investments } = await supabase
    .from("investments")
    .select("user_id, amount")
    .eq("status", "active");

  if (!investments || investments.length === 0) {
    console.log("No investments found");
    return;
  }

  const processed = new Set();
  let totalReferral = 0;
  let totalLevel = 0;

  for (const inv of investments) {
    if (processed.has(inv.user_id)) continue;
    processed.add(inv.user_id);

    const { data: investor } = await supabase
      .from("users")
      .select("sponsor_id")
      .eq("id", inv.user_id)
      .single();

    if (!investor?.sponsor_id) continue;

    // Referral bonus (10%)
    const refBonus = inv.amount * (REFERRAL_RATE / 100);
    await creditWallet(investor.sponsor_id, refBonus);
    totalReferral += refBonus;
    console.log(`Referral: ${refBonus} POL -> ${investor.sponsor_id.slice(0, 8)}... (from ${inv.user_id.slice(0, 8)}...)`);

    // Level commissions
    let currentSponsorId = investor.sponsor_id;
    for (let i = 0; i < LEVEL_RATES.length; i++) {
      if (!currentSponsorId) break;
      const commission = inv.amount * (LEVEL_RATES[i] / 100);
      if (commission < 0.01) break;

      const { data: wallet } = await supabase.from("wallet").select("balance").eq("user_id", currentSponsorId).single();
      const cb = parseFloat(wallet?.balance || "0");
      await supabase.from("wallet").update({ balance: cb + commission }).eq("user_id", currentSponsorId);

      await supabase.from("transactions").insert({
        user_id: currentSponsorId,
        type: "level_commission",
        amount: commission,
        balance_before: cb,
        balance_after: cb + commission,
        description: `Level ${i + 1} commission from downline investment`,
        status: "completed",
      });

      totalLevel += commission;
      console.log(`Level ${i + 1}: ${commission} POL -> ${currentSponsorId.slice(0, 8)}...`);

      const { data: next } = await supabase.from("users").select("sponsor_id").eq("id", currentSponsorId).single();
      currentSponsorId = next?.sponsor_id || null;
    }
  }

  // Give Shriyas and Shubh some wallet balance for leaderboard
  const bonusUsers = [
    { id: "08c414fa-30c0-4177-8832-e8c08f567a27", bal: 500 },
    { id: "c60e6ade-3bea-454e-9bcb-35efb414e94c", bal: 200 },
  ];

  for (const bu of bonusUsers) {
    const { data: w } = await supabase.from("wallet").select("balance").eq("user_id", bu.id).single();
    const cb = parseFloat(w?.balance || "0");
    await supabase.from("wallet").update({ balance: cb + bu.bal }).eq("user_id", bu.id);
    await supabase.from("transactions").insert({
      user_id: bu.id,
      type: "deposit",
      amount: bu.bal,
      balance_before: cb,
      balance_after: cb + bu.bal,
      description: "Admin deposit for team activity",
      status: "completed",
    });
    console.log(`\nBonus ${bu.bal} POL -> ${bu.id.slice(0, 8)}...`);
  }

  console.log(`\n=== Done ===`);
  console.log(`Total referral bonuses: ${totalReferral} POL`);
  console.log(`Total level commissions: ${totalLevel} POL`);
}

main().catch(console.error);
