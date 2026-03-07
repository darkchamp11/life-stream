/**
 * Hospital Login Page
 * 
 * Email/password login form.
 * Dark theme matching the hospital dashboard.
 * On success → redirect to /hospital.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/viewmodels/useAuth';


export default function LoginPage() {
    const router = useRouter();
    const { signIn, loading, error } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        setIsSubmitting(true);
        const success = await signIn(email, password);
        setIsSubmitting(false);

        if (success) {
            router.push('/hospital');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-950/30 via-zinc-950 to-zinc-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">LifeStream</h1>
                    <p className="text-zinc-500 text-sm mt-1">Hospital Dashboard Login</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
                    {/* Email */}
                    <div className="mb-4">
                        <label className="block text-xs text-zinc-500 mb-1.5 uppercase tracking-wider font-semibold">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="hospital@lifestream.app"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-200 text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                            autoComplete="email"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div className="mb-6">
                        <label className="block text-xs text-zinc-500 mb-1.5 uppercase tracking-wider font-semibold">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-200 text-sm focus:outline-none focus:border-red-500/50 transition-colors pr-16"
                                autoComplete="current-password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting || !email || !password}
                        className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-lg shadow-red-500/25 transition-all"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Signing in...
                            </span>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* Security Note */}
                <div className="mt-6 bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 text-xs font-medium mt-0.5">
                            Secure
                        </span>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            Hospital accounts are created by system administrators.
                            All sessions use Firebase Auth with token verification.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
