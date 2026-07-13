"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StakingRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/invest#staking");
  }, [router]);
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-zinc-400">Redirecting to Invest...</div>
    </div>
  );
}
