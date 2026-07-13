import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CryptoEarnerX - Earn Crypto, Build Teams, Grow Wealth",
  description: "Crypto-based earning platform on Polygon. Invest, earn daily ROI, grow your team, and build your wealth.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
