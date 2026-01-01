'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Clear any previous session
    sessionStorage.removeItem('userRole');
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-black to-red-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-red-800/20 to-transparent rounded-full animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-red-700/20 to-transparent rounded-full animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Logo */}
        <div className="mb-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-2xl shadow-red-500/50 mb-4">
            <svg
              className="w-14 h-14 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
            Life<span className="text-red-500">Stream</span>
          </h1>
          <p className="text-red-200/70 text-lg">Emergency Blood Donation Network</p>
        </div>

        {/* Role Selection */}
        <div className="flex flex-col sm:flex-row gap-6 mt-12">
          <Link
            href="/hospital"
            onClick={() => sessionStorage.setItem('userRole', 'hospital')}
            className="group relative px-12 py-6 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl text-white font-semibold text-xl shadow-2xl shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col items-center gap-2">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Log in as Hospital</span>
            </div>
          </Link>

          <Link
            href="/donor"
            onClick={() => sessionStorage.setItem('userRole', 'donor')}
            className="group relative px-12 py-6 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-2xl text-white font-semibold text-xl shadow-2xl shadow-black/30 hover:shadow-red-500/30 transition-all duration-300 hover:scale-105 hover:-translate-y-1 border border-red-500/20"
          >
            <div className="absolute inset-0 bg-red-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col items-center gap-2">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>Log in as Donor</span>
            </div>
          </Link>
        </div>

        {/* Footer info */}
        <p className="mt-16 text-red-200/40 text-sm">
          Demo Mode • No authentication required
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}
