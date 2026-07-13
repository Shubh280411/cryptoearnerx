"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icons";

interface Setting {
  key: string;
  value: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase.from("settings").select("*").order("key");
    setSettings(data || []);
    setLoading(false);
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
  };

  const handleSave = async () => {
    setSaving(true);
    for (const setting of settings) {
      await supabase.from("settings").upsert({ key: setting.key, value: setting.value }, { onConflict: "key" });
    }
    setSuccess("Settings saved!");
    setSaving(false);
    setTimeout(() => setSuccess(""), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 flex items-center gap-2">
          <Icon name="refresh" size={20} className="animate-spin" />
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
        <p className="text-zinc-400 text-sm mt-1">Configure platform parameters</p>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-400 flex items-center gap-2">
          <Icon name="check" size={18} />
          {success}
        </div>
      )}

      <Card title="Platform Configuration">
        <div className="space-y-4">
          {settings.map((setting) => (
            <div key={setting.key}>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 capitalize">
                {setting.key.replace(/_/g, " ")}
              </label>
              <input
                type={setting.key.includes("wallet") || setting.key.includes("key") ? "text" : setting.key.includes("mode") || setting.key.includes("fee") || setting.key.includes("rate") || setting.key.includes("min") ? "text" : "text"}
                value={setting.value}
                onChange={(e) => updateSetting(setting.key, e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </Card>

      <Card title="Danger Zone">
        <div className="space-y-3">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-400">
            These actions are irreversible. Be careful.
          </div>
          <Button variant="danger" disabled>Reset All Data</Button>
        </div>
      </Card>
    </div>
  );
}
