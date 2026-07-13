"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setNotifications(data || []);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success": return { name: "check", color: "text-green-400" };
      case "warning": return { name: "alertTriangle", color: "text-amber-400" };
      case "error": return { name: "x", color: "text-red-400" };
      default: return { name: "info", color: "text-blue-400" };
    }
  };

  const unread = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 flex items-center gap-2">
          <Icon name="refresh" size={20} className="animate-spin" />
          Loading notifications...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-zinc-400 text-sm mt-1">{unread} unread notification{unread !== 1 ? "s" : ""}</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-sm text-blue-400 hover:text-blue-300">
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Icon name="bell" size={48} className="text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No notifications yet</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const iconInfo = getTypeIcon(notif.type);
            return (
              <div
                key={notif.id}
                onClick={() => !notif.is_read && markAsRead(notif.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                  notif.is_read
                    ? "bg-zinc-900 border-zinc-800"
                    : "bg-zinc-900 border-blue-600/30 hover:border-blue-600/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    notif.type === "success" ? "bg-green-600/10" :
                    notif.type === "warning" ? "bg-amber-600/10" :
                    notif.type === "error" ? "bg-red-600/10" : "bg-blue-600/10"
                  }`}>
                    <Icon name={iconInfo.name} size={16} className={iconInfo.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-medium ${notif.is_read ? "text-zinc-400" : "text-white"}`}>
                        {notif.title}
                      </h3>
                      {!notif.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
                    </div>
                    <p className="text-sm text-zinc-500 mt-1">{notif.message}</p>
                    <p className="text-xs text-zinc-600 mt-2">{new Date(notif.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
