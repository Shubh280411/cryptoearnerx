"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { PACKAGES } from "@/lib/constants";

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState(
    PACKAGES.map((p) => ({ ...p, enabled: true }))
  );
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackageStatus();
  }, []);

  const loadPackageStatus = async () => {
    const { data } = await supabase
      .from("settings")
      .select("key, value")
      .like("key", "package_enabled_%");

    if (data) {
      const statusMap: Record<string, boolean> = {};
      data.forEach((s) => {
        statusMap[s.key.replace("package_enabled_", "")] = s.value === "true";
      });
      setPackages((prev) =>
        prev.map((p) => ({
          ...p,
          enabled: statusMap[p.type] !== undefined ? statusMap[p.type] : true,
        }))
      );
    }
    setLoading(false);
  };

  const togglePackage = async (type: string, enabled: boolean) => {
    setPackages((prev) =>
      prev.map((p) => (p.type === type ? { ...p, enabled } : p))
    );

    const { error } = await supabase.from("settings").upsert(
      { key: `package_enabled_${type}`, value: String(enabled) },
      { onConflict: "key" }
    );

    if (!error) {
      setSuccess(`Package ${enabled ? "enabled" : "disabled"}!`);
      setTimeout(() => setSuccess(""), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 flex items-center gap-2">
          <Icon name="refresh" size={20} className="animate-spin" />
          Loading packages...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Package Management</h1>
        <p className="text-zinc-400 text-sm mt-1">Enable or disable investment packages</p>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-400 flex items-center gap-2">
          <Icon name="check" size={18} />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <Card key={pkg.type}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: pkg.color + "20" }}
                >
                  <Icon name="package" size={20} style={{ color: pkg.color }} />
                </div>
                <div>
                  <h3 className="text-white font-medium">{pkg.name}</h3>
                  <p className="text-xs text-zinc-500">{pkg.dailyROI}% daily</p>
                </div>
              </div>
              <button
                onClick={() => togglePackage(pkg.type, !pkg.enabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  pkg.enabled ? "bg-green-600" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    pkg.enabled ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Min Invest</span>
                <span className="text-white">{pkg.minInvest} POL</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Max Invest</span>
                <span className="text-white">
                  {pkg.maxInvest.toLocaleString()} POL
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Duration</span>
                <span className="text-white">{pkg.durationDays} days</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Total ROI</span>
                <span className="text-green-400">{pkg.totalROI}%</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Status</span>
                <span
                  className={pkg.enabled ? "text-green-400" : "text-red-400"}
                >
                  {pkg.enabled ? "Active" : "Disabled"}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
