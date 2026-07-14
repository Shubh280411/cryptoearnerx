import { ethers } from "ethers";
import crypto from "crypto";

const MASTER_PRIVATE_KEY = process.env.MASTER_PRIVATE_KEY || process.env.SWEEP_PRIVATE_KEY;
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || "https://polygon-bor-rpc.publicnode.com";
const ENC_KEY_HEX = process.env.WALLET_ENCRYPTION_KEY;

function getEncKey(): Buffer {
  if (!ENC_KEY_HEX) throw new Error("WALLET_ENCRYPTION_KEY not set in .env.local");
  const key = Buffer.from(ENC_KEY_HEX, "hex");
  if (key.length !== 32) throw new Error("WALLET_ENCRYPTION_KEY must be 32 bytes (64 hex chars)");
  return key;
}

export function encryptPrivateKey(privateKey: string): string {
  const key = getEncKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(privateKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptPrivateKey(encrypted: string): string {
  const key = getEncKey();
  const [ivB64, tagB64, dataB64] = encrypted.split(":");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Invalid encrypted private key format");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final("utf8");
}

export function isPrivateKeyEncrypted(value: string): boolean {
  const parts = value.split(":");
  return parts.length === 3;
}

export function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(POLYGON_RPC_URL);
}

export function getMasterWallet(): ethers.Wallet {
  if (!MASTER_PRIVATE_KEY) {
    throw new Error("MASTER_PRIVATE_KEY not set in .env.local");
  }
  return new ethers.Wallet(MASTER_PRIVATE_KEY);
}

export function deriveChildWallet(derivationIndex: number): ethers.Wallet {
  if (!MASTER_PRIVATE_KEY) {
    throw new Error("MASTER_PRIVATE_KEY not set in .env.local");
  }

  const masterWallet = new ethers.Wallet(MASTER_PRIVATE_KEY);

  const childKey = ethers.keccak256(
    ethers.solidityPacked(
      ["bytes32", "uint256"],
      [masterWallet.privateKey, derivationIndex]
    )
  );

  return new ethers.Wallet(childKey);
}

export function deriveChildAddress(derivationIndex: number): string {
  return deriveChildWallet(derivationIndex).address;
}

export async function getChildBalance(address: string): Promise<number> {
  const provider = getProvider();
  const balance = await provider.getBalance(address);
  return parseFloat(ethers.formatEther(balance));
}

export async function sweepChildToMaster(
  childPrivateKey: string
): Promise<{ txHash: string; amount: number; gasUsed: number }> {
  const provider = getProvider();
  const masterWallet = getMasterWallet();
  const childWallet = new ethers.Wallet(childPrivateKey, provider);

  const balance = await provider.getBalance(childWallet.address);
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice || BigInt(30000000000);
  const gasLimit = BigInt(21000);
  const gasCost = gasPrice * gasLimit;
  const sweepAmount = balance - gasCost;

  if (sweepAmount <= BigInt(0)) {
    throw new Error("Insufficient balance to cover gas fees");
  }

  const tx = await childWallet.sendTransaction({
    to: masterWallet.address,
    value: sweepAmount,
    gasLimit: BigInt(21000),
    gasPrice,
  });

  const receipt = await tx.wait();

  return {
    txHash: receipt?.hash || tx.hash,
    amount: parseFloat(ethers.formatEther(sweepAmount)),
    gasUsed: parseFloat(ethers.formatEther(gasCost)),
  };
}

export async function getMasterBalance(): Promise<number> {
  const provider = getProvider();
  const wallet = getMasterWallet();
  const balance = await provider.getBalance(wallet.address);
  return parseFloat(ethers.formatEther(balance));
}
