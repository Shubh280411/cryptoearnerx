"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-zinc-800">500</h1>
        <p className="text-xl text-zinc-400 mt-4">Something went wrong</p>
        <p className="text-zinc-500 mt-2">{error.message || "An unexpected error occurred"}</p>
        <button
          onClick={() => reset()}
          className="mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
