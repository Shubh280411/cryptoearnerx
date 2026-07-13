export type PackageType = "starter" | "basic" | "premium" | "vip" | "elite";
export type InvestmentStatus = "active" | "completed" | "withdrawn" | "pending";
export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "investment"
  | "roi_payout"
  | "referral_bonus"
  | "binary_bonus"
  | "level_commission"
  | "leadership_bonus"
  | "staking_reward"
  | "sweep";
export type TransactionStatus = "pending" | "completed" | "failed";
export type WithdrawalStatus = "pending" | "processing" | "completed" | "rejected";
export type Rank = "member" | "bronze" | "silver" | "gold" | "platinum" | "diamond" | "crown";
export type SupportStatus = "open" | "pending" | "resolved" | "closed";
export type NotificationType = "info" | "success" | "warning" | "error";

export interface User {
  id: string;
  email: string;
  name: string;
  wallet_address: string | null;
  sponsor_id: string | null;
  left_child_id: string | null;
  right_child_id: string | null;
  left_volume: number;
  right_volume: number;
  rank: Rank;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  bonus_balance: number;
  locked_bonus_balance: number;
  total_deposited: number;
  total_withdrawn: number;
  total_invested: number;
  updated_at: string;
}

export interface Investment {
  id: string;
  user_id: string;
  package_type: PackageType;
  amount: number;
  investment_source: "pol" | "cex";
  daily_roi: number;
  duration_days: number;
  start_date: string;
  end_date: string;
  total_earned: number;
  status: InvestmentStatus;
  tx_hash: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  tx_hash: string | null;
  status: TransactionStatus;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  wallet_address: string;
  tx_hash: string | null;
  status: WithdrawalStatus;
  created_at: string;
}

export interface Staking {
  id: string;
  user_id: string;
  amount: number;
  apy: number;
  duration_days: number;
  start_date: string;
  end_date: string;
  rewards_earned: number;
  status: string;
  created_at: string;
}

export interface CryptoWallet {
  id: string;
  user_id: string;
  address: string;
  private_key: string;
  derivation_index: number;
  network: string;
  status: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  status: SupportStatus;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

export interface PackageInfo {
  type: PackageType;
  name: string;
  minInvest: number;
  maxInvest: number;
  dailyROI: number;
  durationDays: number;
  totalROI: number;
  minWithdraw: number;
  color: string;
}

export interface MlmTreeNode {
  id: string;
  email: string;
  name: string;
  rank: Rank;
  leftVolume: number;
  rightVolume: number;
  isActive: boolean;
  leftChild: MlmTreeNode | null;
  rightChild: MlmTreeNode | null;
}
