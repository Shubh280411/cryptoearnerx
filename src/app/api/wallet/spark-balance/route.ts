import { NextRequest, NextResponse } from "next/server";
import { getSparkBalance } from "@/lib/wallet";
import { SPARK_TOKEN_ADDRESS, SPARK_WALLET_ADDRESS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const walletAddress = req.nextUrl.searchParams.get("address") || SPARK_WALLET_ADDRESS;

    if (!walletAddress || !walletAddress.startsWith("0x")) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }

    const balance = await getSparkBalance(walletAddress);

    return NextResponse.json({
      address: walletAddress,
      balance,
      tokenAddress: SPARK_TOKEN_ADDRESS,
      chain: "Polygon PoS",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch SPARK balance" }, { status: 500 });
  }
}
