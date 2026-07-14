const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://udqtrnarcllvnczhfmoj.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkcXRybmFyY2xsdm5jemhmbW9qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzg3Njk1OCwiZXhwIjoyMDk5NDUyOTU4fQ.2ETUJuhTrdQE5RWAkcY8-dWMObfX-TKFVHzQ5mllE7o";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const SHRIYAS_ID = "08c414fa-30c0-4177-8832-e8c08f567a27";
const SHUBH_ID = "c60e6ade-3bea-454e-9bcb-35efb414e94c";
const TEST_PASSWORD = "CxR@2026!Test";

const names = [
  "Aarav","Vivaan","Aditya","Arjun","Sai","Rohan","Vihaan","Krishna","Ishaan","Shaurya",
  "Reyansh","Ayaan","Atharv","Advik","Pranav","Advaith","Aarush","Hridhaan","Dhruv","Kabir",
  "Vedant","Nivaan","Rudra","Samarth","Arin","Anirudh","Aaditya","Parth","Tejas","Harsh",
  "Kavya","Diya","Ananya","Priya","Nisha","Riya","Pooja","Simran","Neha","Tanvi",
  "Meera","Ishita","Misha","Aisha","Rhea","Palak","Soniya","Deepika","Nandini","Shreya"
];

const PACKAGES = [
  { type: "starter", min: 25, max: 499, dailyROI: 1.0, duration: 30 },
  { type: "basic", min: 500, max: 2499, dailyROI: 1.2, duration: 60 },
  { type: "premium", min: 2500, max: 9999, dailyROI: 1.5, duration: 90 },
];

function randBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRefCode(name, idx) {
  const code = "CEX" + name.toUpperCase().slice(0, 4) + String(idx + 1).padStart(3, "0");
  return code;
}

async function createUser(name, idx, sponsorId) {
  const email = `testuser${idx + 1}@cryptoearnerx.test`;
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });

  if (authError) {
    console.log(`Auth error for ${name}: ${authError.message}`);
    return null;
  }

  const userId = authUser.user.id;
  const refCode = generateRefCode(name, idx);

  const { error: userError } = await supabase.from("users").insert({
    id: userId,
    email,
    name,
    referral_code: refCode,
    sponsor_id: sponsorId,
    is_active: true,
  });

  if (userError) {
    console.log(`User insert error for ${name}: ${userError.message}`);
    return null;
  }

  await supabase.from("wallet").insert({
    user_id: userId,
    balance: 0,
    bonus_balance: 0,
    locked_bonus_balance: 0,
    total_deposited: 0,
    total_invested: 0,
    total_withdrawn: 0,
  });

  return { userId, email, name, refCode };
}

async function addInvestment(userId, pkgIdx) {
  const pkg = PACKAGES[pkgIdx];
  const amount = randBetween(pkg.min, Math.min(pkg.max, pkg.min + 500));

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + pkg.duration);

  const { error } = await supabase.from("investments").insert({
    user_id: userId,
    package_type: pkg.type,
    amount,
    investment_source: "pol",
    daily_roi: pkg.dailyROI,
    duration_days: pkg.duration,
    start_date: new Date().toISOString(),
    end_date: endDate.toISOString(),
    total_earned: 0,
    status: "active",
    roi_enabled: true,
  });

  if (error) {
    console.log(`Investment error: ${error.message}`);
    return;
  }

  const lockedCEX = amount * 20;
  const { data: wallet } = await supabase.from("wallet").select("locked_bonus_balance").eq("user_id", userId).single();
  const currentLocked = parseFloat(wallet?.locked_bonus_balance || "0");

  await supabase.from("wallet").update({ locked_bonus_balance: currentLocked + lockedCEX }).eq("user_id", userId);

  await supabase.from("transactions").insert({
    user_id: userId,
    type: "invest_locked_cex",
    amount: lockedCEX,
    balance_before: currentLocked,
    balance_after: currentLocked + lockedCEX,
    description: `Investment CEX bonus - ${pkg.type} package (${amount} POL = ${lockedCEX} CEX locked)`,
    status: "completed",
  });

  console.log(`  Invested ${amount} POL (${pkg.type}) for ${userId}`);
}

async function placeInTree(parentId, childId, side) {
  if (side === "left") {
    await supabase.from("users").update({ left_child_id: childId }).eq("id", parentId);
  } else {
    await supabase.from("users").update({ right_child_id: childId }).eq("id", parentId);
  }
}

async function main() {
  console.log("=== Creating 50 test users ===\n");

  // 25 users under Shubh's subtree
  console.log("--- Shubh's subtree (25 users) ---");
  const shubhUsers = [];
  const shubhQueue = [{ parentId: SHUBH_ID, side: "left" }, { parentId: SHUBH_ID, side: "right" }];

  for (let i = 0; i < 25; i++) {
    const pos = shubhQueue.shift();
    const user = await createUser(names[i], i, pos.parentId);
    if (!user) continue;

    await placeInTree(pos.parentId, user.userId, pos.side);
    shubhUsers.push(user);
    console.log(`  [${i + 1}/25] ${user.name} -> ${pos.side} of ${pos.parentId.slice(0, 8)}...`);

    shubhQueue.push({ parentId: user.userId, side: "left" });
    shubhQueue.push({ parentId: user.userId, side: "right" });

    await new Promise(r => setTimeout(r, 200));
  }

  // 25 users under Shriyas's right subtree
  console.log("\n--- Shriyas's right subtree (25 users) ---");
  const shriyasUsers = [];
  const shriyasQueue = [{ parentId: SHRIYAS_ID, side: "right" }];

  for (let i = 0; i < 25; i++) {
    const pos = shriyasQueue.shift();
    const user = await createUser(names[25 + i], 25 + i, pos.parentId);
    if (!user) continue;

    await placeInTree(pos.parentId, user.userId, pos.side);
    shriyasUsers.push(user);
    console.log(`  [${i + 1}/25] ${user.name} -> ${pos.side} of ${pos.parentId.slice(0, 8)}...`);

    shriyasQueue.push({ parentId: user.userId, side: "left" });
    shriyasQueue.push({ parentId: user.userId, side: "right" });

    await new Promise(r => setTimeout(r, 200));
  }

  // Give investments to ~20 users
  console.log("\n--- Adding investments ---");
  const investUsers = [...shubhUsers.slice(0, 13), ...shriyasUsers.slice(0, 7)];

  for (let i = 0; i < investUsers.length; i++) {
    const pkgIdx = i < 5 ? 2 : i < 12 ? 1 : 0;
    await addInvestment(investUsers[i].userId, pkgIdx);
    await new Promise(r => setTimeout(r, 200));
  }

  console.log("\n=== Done! ===");
  console.log(`Created ${shubhUsers.length + shriyasUsers.length} users`);
  console.log(`Invested: ${investUsers.length} users`);
  console.log(`Password for all: ${TEST_PASSWORD}`);
}

main().catch(console.error);
