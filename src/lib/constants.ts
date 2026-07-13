import { PackageInfo } from "./types";

export const PACKAGES: PackageInfo[] = [
  {
    type: "starter",
    name: "Starter",
    minInvest: 25,
    maxInvest: 499,
    dailyROI: 1.0,
    durationDays: 30,
    totalROI: 30,
    minWithdraw: 5,
    color: "#22c55e",
  },
  {
    type: "basic",
    name: "Basic",
    minInvest: 500,
    maxInvest: 2499,
    dailyROI: 1.2,
    durationDays: 60,
    totalROI: 72,
    minWithdraw: 25,
    color: "#3b82f6",
  },
  {
    type: "premium",
    name: "Premium",
    minInvest: 2500,
    maxInvest: 9999,
    dailyROI: 1.5,
    durationDays: 90,
    totalROI: 135,
    minWithdraw: 50,
    color: "#a855f7",
  },
  {
    type: "vip",
    name: "VIP",
    minInvest: 10000,
    maxInvest: 49999,
    dailyROI: 1.8,
    durationDays: 120,
    totalROI: 216,
    minWithdraw: 100,
    color: "#f59e0b",
  },
  {
    type: "elite",
    name: "Elite",
    minInvest: 50000,
    maxInvest: 999999,
    dailyROI: 2.0,
    durationDays: 180,
    totalROI: 360,
    minWithdraw: 500,
    color: "#ef4444",
  },
];

export const STAKING_PLANS = [
  { name: "Silver", minPOL: 25, cexRate: 20, days: 30, dailyPOL: 0.25, color: "#94a3b8" },
  { name: "Gold", minPOL: 100, cexRate: 20, days: 60, dailyPOL: 0.40, color: "#f59e0b" },
  { name: "Platinum", minPOL: 500, cexRate: 20, days: 90, dailyPOL: 0.75, color: "#a855f7" },
  { name: "Diamond", minPOL: 1000, cexRate: 20, days: 120, dailyPOL: 1.20, color: "#3b82f6" },
  { name: "Crown", minPOL: 5000, cexRate: 20, days: 180, dailyPOL: 2.00, color: "#ef4444" },
];

export const RANKS = [
  { name: "member" as const, minTeam: 0, minDirects: 0, bonusRate: 0 },
  { name: "bronze" as const, minTeam: 10, minDirects: 2, bonusRate: 1 },
  { name: "silver" as const, minTeam: 50, minDirects: 5, bonusRate: 2 },
  { name: "gold" as const, minTeam: 200, minDirects: 10, bonusRate: 3 },
  { name: "platinum" as const, minTeam: 500, minDirects: 15, bonusRate: 4 },
  { name: "diamond" as const, minTeam: 2000, minDirects: 20, bonusRate: 5 },
  { name: "crown" as const, minTeam: 5000, minDirects: 50, bonusRate: 5 },
];

export const BINARY_REFERRAL_RATE = 10;
export const BINARY_MATCHING_RATE = 10;
export const LEVEL_COMMISSION_RATES = [
  { level: 2, rate: 5 },
  { level: 3, rate: 3 },
  { level: 4, rate: 2 },
  { level: 5, rate: 1 },
];
export const CEX_LEVEL_BONUS: Record<number, number> = {
  1: 50,
  2: 40,
  3: 30,
  4: 20,
  5: 10,
};

export const MIN_DEPOSIT = 0.1;
export const MIN_WITHDRAWAL = 25;
export const WITHDRAWAL_FEE = 1;
export const PLATFORM_FEE = 2;
export const SWEEP_GAS_LIMIT = 0.01;
