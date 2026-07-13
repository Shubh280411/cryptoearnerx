import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export async function requireAuth() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ApiError(401, "Unauthorized");
  }

  return { user, supabase };
}

export async function requireAdmin() {
  const { user, supabase } = await requireAuth();

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    throw new ApiError(403, "Forbidden: admin access required");
  }

  return { user, supabase, admin: profile };
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }
  console.error("API error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

// Rate limiting via in-memory store (for production use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxRequests = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

// Zod schemas for all API routes
export const DepositSchema = z.object({
  amount: z.number().positive("Amount must be positive").max(10_000_000, "Amount too large"),
  txHash: z.string().min(1, "Transaction hash required").max(128).regex(/^0x[a-fA-F0-9]+$/, "Invalid transaction hash format"),
});

export const SweepSchema = z.object({
  walletAddress: z.string().min(1).max(128).regex(/^0x[a-fA-F0-9]+$/, "Invalid wallet address"),
  amount: z.number().positive("Amount must be positive").max(10_000_000, "Amount too large"),
});

export const RoiClaimSchema = z.object({
  investmentId: z.string().uuid("Invalid investment ID"),
});

export const MlmDistributeSchema = z.object({
  investorId: z.string().uuid("Invalid investor ID"),
  amount: z.number().positive("Amount must be positive").max(10_000_000, "Amount too large"),
});
