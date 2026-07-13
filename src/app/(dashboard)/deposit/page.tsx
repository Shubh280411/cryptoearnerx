"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { formatPOL } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";

const NETWORKS = [
  {
    id: "polygon",
    name: "Polygon (POL)",
    symbol: "POL",
    color: "#8247e5",
  },
];

const PolLogo = ({ size = 24 }: { size?: number }) => (
  <img src="/pol-logo.svg" alt="POL" width={size} height={size} />
);

export default function DepositPage() {
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [depositAddress, setDepositAddress] = useState("");
  const [onChainBalance, setOnChainBalance] = useState(0);
  const [platformBalance, setPlatformBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addressLoading, setAddressLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [sweepResult, setSweepResult] = useState("");
  const [depositHistory, setDepositHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadBalances();
  }, []);

  useEffect(() => {
    if (selectedNetwork) {
      generateAddress();
    }
  }, [selectedNetwork]);

  const loadBalances = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: wallet } = await supabase
      .from("wallet")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    setPlatformBalance(wallet?.balance || 0);
    setLoading(false);
  };

  const generateAddress = async () => {
    setAddressLoading(true);
    setDepositAddress("");
    setOnChainBalance(0);
    setSweepResult("");
    try {
      const res = await fetch("/api/wallet/deposit");
      const data = await res.json();
      if (data.address) {
        setDepositAddress(data.address);
        setOnChainBalance(data.balance || 0);

        if (data.balance > 0.02) {
          setSweeping(true);
          setSweepResult("Funds detected! Auto-sweeping to your wallet...");
          const sweepRes = await fetch("/api/wallet/sweep", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress: data.address, amount: data.balance }),
          });
          const sweepData = await sweepRes.json();
          if (sweepData.success) {
            setSweepResult(`Swept ${sweepData.swept.toFixed(4)} POL to your wallet!`);
            loadBalances();
            setOnChainBalance(0);
          } else {
            setSweepResult(`Auto-sweep failed: ${sweepData.error}. Use manual sweep.`);
          }
          setSweeping(false);
        }
      }
    } catch (err) {
      console.error("Failed to generate address:", err);
    }
    setAddressLoading(false);
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

  const handleSweep = async () => {
    if (!depositAddress) return;
    setSweeping(true);
    setSweepResult("");
    try {
      const res = await fetch("/api/wallet/sweep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: depositAddress, amount: onChainBalance }),
      });
      const data = await res.json();
      if (data.success) {
        setSweepResult(`Swept ${data.swept.toFixed(4)} POL to master wallet!`);
        generateAddress();
        loadBalances();
      } else {
        setSweepResult(`Error: ${data.error}`);
      }
    } catch {
      setSweepResult("Sweep failed. Try again.");
    }
    setSweeping(false);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedNet = NETWORKS.find((n) => n.id === selectedNetwork);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 flex items-center gap-2">
          <Icon name="refresh" size={20} className="animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Deposit</h1>
        <p className="text-zinc-400 text-sm mt-1">Select a cryptocurrency to deposit</p>
      </div>

      {/* Balance Banner */}
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
        <>
          {/* Network Selection */}
          <Card title="Select Network">
            <div className="space-y-3">
              {NETWORKS.map((net) => (
                <button
                  key={net.id}
                  onClick={() => setSelectedNetwork(net.id)}
                  className="w-full flex items-center gap-4 p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 rounded-xl transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <img src="/pol-logo.svg" alt="POL" width={32} height={32} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{net.name}</p>
                    <p className="text-zinc-400 text-xs mt-0.5">Polygon Network</p>
                  </div>
                  <Icon name="chevronRight" size={20} className="text-zinc-500" />
                </button>
              ))}
            </div>
          </Card>
        </>
      ) : (
        <>
          {/* Back button */}
          <button
            onClick={() => { setSelectedNetwork(null); setDepositAddress(""); }}
            className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors"
          >
            <Icon name="arrowLeft" size={16} />
            Change Network
          </button>

          {/* QR Code + Address Window */}
          <Card>
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center">
                  <img src="/pol-logo.svg" alt="POL" width={40} height={40} />
                </div>
                <div>
                  <p className="text-white font-semibold">{selectedNet?.name}</p>
                  <p className="text-zinc-400 text-xs">Polygon Network (MATIC)</p>
                </div>
              </div>

              {addressLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-zinc-400 flex items-center gap-2">
                    <Icon name="refresh" size={20} className="animate-spin" />
                    Generating your deposit address...
                  </div>
                </div>
              ) : (
                <>
                  {/* QR Code */}
                  <div className="flex justify-center py-4">
                    <div className="bg-white p-4 rounded-xl">
                      <QRCodeSVG
                        value={depositAddress}
                        size={180}
                        level="H"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <p className="text-xs text-zinc-500 mb-2">Deposit Address</p>
                    <p className="text-sm text-zinc-300 font-mono break-all leading-relaxed">{depositAddress}</p>
                  </div>

                  {/* Copy Button */}
                  <Button variant="primary" className="w-full" onClick={copyAddress}>
                    <Icon name={copied ? "check" : "copy"} size={16} />
                    {copied ? "Copied!" : "Copy Address"}
                  </Button>

                  {/* On-chain balance + Sweep */}
                  <div className="bg-zinc-800/50 rounded-lg p-4 flex items-center justify-between">
                    <span className="text-zinc-400 text-sm">On-chain Balance</span>
                    <span className="text-white font-medium">{onChainBalance.toFixed(4)} {selectedNet?.symbol}</span>
                  </div>

                  {onChainBalance > 0.02 && (
                    <Button
                      variant="primary"
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={handleSweep}
                      disabled={sweeping}
                    >
                      <Icon name="refresh" size={16} className={sweeping ? "animate-spin" : ""} />
                      {sweeping ? "Sweeping..." : `Sweep ${onChainBalance.toFixed(4)} ${selectedNet?.symbol} to Wallet`}
                    </Button>
                  )}

                  {sweepResult && (
                    <div className={`rounded-lg p-3 text-sm ${
                      sweepResult.startsWith("Error") || sweepResult.startsWith("Sweep failed")
                        ? "bg-red-500/10 text-red-400"
                        : "bg-green-500/10 text-green-400"
                    }`}>
                      {sweepResult}
                    </div>
                  )}

                  {/* Warning */}
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-400 space-y-1">
                    <p className="font-medium flex items-center gap-2">
                      <Icon name="alertTriangle" size={14} />
                      Important:
                    </p>
                    <ul className="list-disc list-inside text-xs space-y-0.5 text-amber-400/80">
                      <li>Send only {selectedNet?.symbol} on Polygon network</li>
                      <li>Minimum deposit: 25 POL</li>
                      <li>After sending, click Sweep to credit to your wallet</li>
                      <li>Do NOT send from exchanges</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </Card>
        </>
      )}

      {/* Deposit History */}
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
    </div>
  );
}
