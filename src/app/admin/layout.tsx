"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/icons";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: "home" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/deposits", label: "Deposits", icon: "download" },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: "upload" },
  { href: "/admin/investments", label: "Investments", icon: "layers" },
  { href: "/admin/packages", label: "Packages", icon: "package" },
  { href: "/admin/team", label: "Team Tree", icon: "trending" },
  { href: "/admin/earnings", label: "Earnings", icon: "chart" },
  { href: "/admin/staking", label: "Staking", icon: "lock" },
  { href: "/admin/notifications", label: "Notifications", icon: "bell" },
  { href: "/admin/support", label: "Support", icon: "headphones" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center gap-3 px-6 h-16 border-b border-zinc-800">
          <Image src="/logo.png" alt="CryptoEarnerX" width={32} height={32} className="rounded-lg" />
          <div>
            <span className="text-lg font-bold text-white">CryptoEarnerX</span>
            <span className="block text-xs text-red-400">Admin Panel</span>
          </div>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-64px)]">
          {adminNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-red-600/10 text-red-400 border border-red-600/20" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-zinc-800">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800">
              <Icon name="externalLink" size={18} />
              User Dashboard
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-zinc-800 w-full">
              <Icon name="logout" size={18} />
              Logout
            </button>
          </div>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-zinc-400 hover:text-white p-2">
            <Icon name="menu" size={24} />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 bg-red-600/10 border border-red-600/20 rounded text-xs text-red-400 font-medium">ADMIN</span>
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">A</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
