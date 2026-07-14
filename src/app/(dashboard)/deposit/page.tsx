"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { formatPOL } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";

export default function DepositPage() {
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [depositAddress, setDepositAddress] = useState("");
  const [onChainBalance, setOnChainBalance] = useState(0);
  const [platformBalance, setPlatformBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addressLoading, setAddressLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [depositHistory, setDepositHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [creditedAmount, setCreditedAmount] = useState(0);
  const [newBalance, setNewBalance] = useState(0);

  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState<"waiting" | "processing" | "success" | "error">("waiting");
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const initialBalanceRef = useRef(0);
  const processingRef = useRef(false);

  useEffect(() => {
    loadBalances();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (selectedNetwork) generateAddress();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      setStatusMsg("");
    };
  }, [selectedNetwork]);

  const loadBalances = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: wallet } = await supabase.from("wallet").select("balance").eq("user_id", user.id).single();
    setPlatformBalance(wallet?.balance || 0);
    setLoading(false);
  };

  const generateAddress = async () => {
    setAddressLoading(true);
    setDepositAddress("");
    setOnChainBalance(0);
    try {
      const res = await fetch("/api/wallet/deposit");
      const data = await res.json();
      if (data.address) {
        setDepositAddress(data.address);
        setOnChainBalance(data.balance || 0);
        initialBalanceRef.current = data.balance || 0;
        startPolling(data.address, data.balance || 0);
      }
    } catch (err) {
      console.error("Failed to generate address:", err);
    }
    setAddressLoading(false);
  };

  const startPolling = useCallback((address: string, currentBalance: number) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setStatusMsg("Send any amount of POL to this address. We will auto-detect your deposit.");
    setStatusType("waiting");

    pollRef.current = setInterval(async () => {
      if (processingRef.current) return;
      try {
        const res = await fetch("/api/wallet/deposit");
        const data = await res.json();
        if (data.balance !== undefined) {
          setOnChainBalance(data.balance);
          if (data.balance > 0.02 && data.balance > initialBalanceRef.current) {
            if (pollRef.current) clearInterval(pollRef.current);
            processingRef.current = true;
            setStatusMsg("Funds detected! Sweeping to master wallet...");
            setStatusType("processing");
            await performAutoSweep(address);
          }
        }
      } catch { /* keep polling */ }
    }, 6000);
  }, []);

  const performAutoSweep = async (walletAddress: string) => {
    try {
      const res = await fetch("/api/wallet/sweep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });
      const data = await res.json();
      if (data.success) {
        setCreditedAmount(data.swept);
        setNewBalance(data.newBalance);
        setShowSuccess(true);
        setOnChainBalance(0);
        initialBalanceRef.current = 0;
        setStatusMsg("");
        setStatusType("success");
        loadBalances();
        loadDepositHistory();
      } else {
        setStatusMsg(`Sweep failed: ${data.error}. Retrying...`);
        setStatusType("error");
        setTimeout(() => {
          processingRef.current = false;
          startPolling(walletAddress, 0);
        }, 15000);
      }
    } catch {
      setStatusMsg("Sweep failed. Retrying...");
      setStatusType("error");
      setTimeout(() => {
        processingRef.current = false;
        startPolling(walletAddress, 0);
      }, 15000);
    }
    processingRef.current = false;
  };

  const loadDepositHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "deposit")
      .order("created_at", { ascending: false })
      .limit(20);
    setDepositHistory(data || []);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColors = {
    waiting: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    processing: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    success: "bg-green-500/10 text-green-400 border-green-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 flex items-center gap-2">
          <Icon name="refresh" size={20} className="animate-spin" />Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Deposit</h1>
        <p className="text-zinc-400 text-sm mt-1">Deposit POL to your wallet</p>
      </div>

      <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-600/20 rounded-xl p-6 flex items-center justify-between">
        <div>
          <p className="text-zinc-400 text-sm">Platform Balance</p>
          <p className="text-3xl font-bold text-white mt-1">{formatPOL(platformBalance)} POL</p>
        </div>
        <div className="w-16 h-16 bg-blue-600/10 rounded-xl flex items-center justify-center">
          <Icon name="wallet" size={32} className="text-blue-400" />
        </div>
      </div>

      {!selectedNetwork ? (
        <Card title="Select Network">
          <div className="space-y-3">
            <button
              onClick={() => setSelectedNetwork("polygon")}
              className="w-full flex items-center gap-4 p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 rounded-xl transition-all text-left"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                <img src="/pol-logo.svg" alt="POL" width={32} height={32} />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Polygon (POL)</p>
                <p className="text-zinc-400 text-xs mt-0.5">Polygon Network</p>
              </div>
              <Icon name="chevronRight" size={20} className="text-zinc-500" />
            </button>
          </div>
        </Card>
      ) : (
        <>
          <button
            onClick={() => {
              if (pollRef.current) clearInterval(pollRef.current);
              setSelectedNetwork(null);
              setDepositAddress("");
              setStatusMsg("");
              processingRef.current = false;
            }}
            className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors"
          >
            <Icon name="arrowLeft" size={16} />Change Network
          </button>

          <Card>
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center">
                  <img src="/pol-logo.svg" alt="POL" width={40} height={40} />
                </div>
                <div>
                  <p className="text-white font-semibold">Polygon (POL)</p>
                  <p className="text-zinc-400 text-xs">Polygon Network</p>
                </div>
              </div>

              {addressLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-zinc-400 flex items-center gap-2">
                    <Icon name="refresh" size={20} className="animate-spin" />Generating your deposit address...
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-center py-4">
                    <div className="bg-white p-4 rounded-xl">
                      <QRCodeSVG value={depositAddress} size={180} level="H" />
                    </div>
                  </div>

                  <div className="bg-zinc-800 rounded-lg p-4">
                    <p className="text-xs text-zinc-500 mb-2">Deposit Address</p>
                    <p className="text-sm text-zinc-300 font-mono break-all leading-relaxed">{depositAddress}</p>
                  </div>

                  <Button variant="primary" className="w-full" onClick={copyAddress}>
                    <Icon name={copied ? "check" : "copy"} size={16} />
                    {copied ? "Copied!" : "Copy Address"}
                  </Button>

                  <div className="bg-zinc-800/50 rounded-lg p-4 flex items-center justify-between">
                    <span className="text-zinc-400 text-sm">On-chain Balance</span>
                    <span className="text-white font-medium">{onChainBalance.toFixed(4)} POL</span>
                  </div>

                  {statusMsg && (
                    <div className={`rounded-lg p-3 text-sm flex items-center gap-2 border ${statusColors[statusType]}`}>
                      {(statusType === "waiting" || statusType === "processing") && (
                        <Icon name="refresh" size={14} className="animate-spin flex-shrink-0" />
                      )}
                      {statusType === "success" && (
                        <Icon name="check" size={14} className="flex-shrink-0" />
                      )}
                      {statusType === "error" && (
                        <Icon name="alertTriangle" size={14} className="flex-shrink-0" />
                      )}
                      {statusMsg}
                    </div>
                  )}

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-400 space-y-1">
                    <p className="font-medium flex items-center gap-2">
                      <Icon name="alertTriangle" size={14} />Important:
                    </p>
                    <ul className="list-disc list-inside text-xs space-y-0.5 text-amber-400/80">
                      <li>Send only POL on Polygon network</li>
                      <li>Minimum deposit: 0.02 POL</li>
                      <li>Deposits are auto-detected and credited instantly</li>
                      <li>Do NOT send from exchanges</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </Card>
        </>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Deposit History</h3>
          <button
            onClick={() => { setShowHistory(!showHistory); if (!showHistory) loadDepositHistory(); }}
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            {showHistory ? "Hide" : "View All"}
            <Icon name={showHistory ? "chevronDown" : "chevronRight"} size={14} />
          </button>
        </div>
        {showHistory && (
          <>
            {depositHistory.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="clock" size={32} className="text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-400 text-sm">No deposits yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {depositHistory.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-600/10">
                        <Icon name="download" size={14} className="text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-white">Deposit</p>
                        <p className="text-xs text-zinc-500">{new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-400">+{formatPOL(tx.amount)} POL</p>
                      {tx.tx_hash && (
                        <a
                          href={`https://polygonscan.com/tx/${tx.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1 justify-end"
                        >
                          {tx.tx_hash.slice(0, 6)}...{tx.tx_hash.slice(-4)}
                          <Icon name="externalLink" size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Card>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowSuccess(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Deposit Successful!</h2>
              <p className="text-zinc-400 text-sm">Your deposit has been auto-swept and credited</p>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-sm">Deposited</span>
                <span className="text-green-400 font-bold text-lg">+{creditedAmount.toFixed(4)} POL</span>
              </div>
              <div className="border-t border-zinc-700" />
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-sm">New Balance</span>
                <span className="text-white font-medium">{newBalance.toFixed(4)} POL</span>
              </div>
            </div>
            <Button variant="primary" className="w-full" onClick={() => setShowSuccess(false)}>
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
