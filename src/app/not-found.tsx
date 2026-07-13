import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="text-center">
        <Image src="/logo.png" alt="CryptoEarnerX" width={80} height={80} className="rounded-2xl mx-auto mb-6" />
        <h1 className="text-6xl font-bold text-zinc-800">404</h1>
        <p className="text-xl text-zinc-400 mt-4">Page Not Found</p>
        <p className="text-zinc-500 mt-2">The page you are looking for does not exist.</p>
        <Link href="/" className="inline-block mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          Go Home
        </Link>
      </div>
    </div>
  );
}
