"use client";

import { Icon } from "./icons";

export function OtpSpamNotice({ onClose }: { onClose?: () => void }) {
  return (
    <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center mt-0.5">
          <Icon name="alertTriangle" size={16} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-amber-300 text-sm font-semibold">OTP sent to your email!</p>
          <div className="mt-2 bg-zinc-800/60 rounded-lg p-2.5 border border-zinc-700/50">
            <p className="text-zinc-300 text-xs leading-relaxed">
              <span className="text-amber-400 font-semibold">Email not showing?</span> Check your{" "}
              <strong className="text-white">Spam / Junk</strong> folder and mark it as{" "}
              <strong className="text-white">Not Spam</strong> — future OTPs will land in your Inbox.
            </p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors p-1">
            &#x2715;
          </button>
        )}
      </div>
    </div>
  );
}
