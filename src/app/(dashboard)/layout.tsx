"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/wallet", label: "Wallet", icon: "wallet" },
  { href: "/deposit", label: "Deposit", icon: "download" },
  { href: "/withdraw", label: "Withdraw", icon: "upload" },
  { href: "/withdraw-airdrop", label: "Withdraw SPARK", icon: "coins" },
  { href: "/invest", label: "Invest", icon: "package" },
  { href: "/investments", label: "My Packages", icon: "layers" },
  { href: "/earnings", label: "Earnings", icon: "chart" },
  { href: "/team", label: "My Team", icon: "users" },
  { href: "/referral", label: "Referral", icon: "link" },
  { href: "/leaderboard", label: "Leaderboard", icon: "trophy" },
  { href: "/convert", label: "CEX to POL", icon: "coins" },
  { href: "/notifications", label: "Notifications", icon: "bell" },
  { href: "/support", label: "Support", icon: "headphones" },
  { href: "/profile", label: "Profile", icon: "user" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("U");
  const [toolsOpen, setToolsOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("users").select("name").eq("id", user.id).single();
        if (data?.name) setUserName(data.name.charAt(0).toUpperCase());
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-3 px-6 h-16 border-b border-zinc-800">
          <Image src="/logo.png" alt="CryptoEarnerX" width={32} height={32} className="rounded-lg" />
          <span className="text-lg font-bold text-white">CryptoEarnerX</span>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-64px)]">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600/10 text-blue-400 border border-blue-600/20"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-zinc-800">
            <button
              onClick={() => { setToolsOpen(true); setSidebarOpen(false); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 w-full transition-colors"
            >
              <Icon name="settings" size={18} />
              Tools
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-zinc-800 w-full transition-colors mt-1"
            >
              <Icon name="logout" size={18} />
              Logout
            </button>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-zinc-400 hover:text-white p-2"
          >
            <Icon name="menu" size={24} />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-4">
            <Link href="/notifications" className="relative text-zinc-400 hover:text-white p-2">
              <Icon name="bell" size={20} />
            </Link>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {userName}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Tools Modal */}
      {toolsOpen && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4" onClick={() => setToolsOpen(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Tools</h2>
              <button onClick={() => setToolsOpen(false)} className="text-zinc-400 hover:text-white p-1">
                <Icon name="x" size={20} />
              </button>
            </div>

            {/* Presentation PDF */}
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center shrink-0">
                  <Icon name="fileText" size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Presentation PDF</p>
                  <p className="text-zinc-500 text-xs">Company overview & roadmap</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a href="/presentation.pdf" target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
                  <Icon name="eye" size={16} />
                  View
                </a>
                <a href="/presentation.pdf" download="CryptoEarnerX-Presentation.pdf"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium transition-colors">
                  <Icon name="download" size={16} />
                  Download
                </a>
              </div>
            </div>

            {/* Whitepaper PDF */}
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600/10 flex items-center justify-center shrink-0">
                  <Icon name="fileText" size={20} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Whitepaper PDF</p>
                  <p className="text-zinc-500 text-xs">Technical documentation</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a href="/whitepaper.pdf" target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors">
                  <Icon name="eye" size={16} />
                  View
                </a>
                <a href="/whitepaper.pdf" download="CryptoEarnerX-Whitepaper.pdf"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium transition-colors">
                  <Icon name="download" size={16} />
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
