'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { BloodType } from '@/types';
import { getDonorIdentity, registerDonor } from '@/lib/donor-identity';

export default function DonorRegisterPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [name, setName] = useState('');
    const [bloodType, setBloodType] = useState<BloodType>('O+');

    const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    useEffect(() => {
        setMounted(true);
        // Check if already registered
        const identity = getDonorIdentity();
        if (identity.isRegistered) {
            router.replace('/donor');
            return;
        }
        // Pre-populate with generated blood type
        setBloodType(identity.bloodType);
    }, [router]);

    const handleRegister = () => {
        if (!name.trim()) return;
        registerDonor(name.trim(), bloodType);
        router.push('/donor');
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-950 via-zinc-950 to-zinc-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-red-800/10 to-transparent rounded-full animate-pulse" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-red-700/10 to-transparent rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-md">
                {/* Logo Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-2xl shadow-red-500/40 mb-4">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-1">
                        Become a <span className="text-red-500">Donor</span>
                    </h1>
                    <p className="text-zinc-400">Join the emergency blood donation network</p>
                </div>

                {/* Registration Card */}
                <Card className="bg-zinc-900/80 border-zinc-800 backdrop-blur-lg">
                    <CardContent className="p-6 space-y-6">
                        {/* Name Input */}
                        <div>
                            <label className="text-sm font-medium text-zinc-300 block mb-2">
                                Your Name
                            </label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your full name"
                                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 h-12"
                            />
                            <p className="text-xs text-zinc-500 mt-1">
                                Your name is only revealed to hospitals after you accept a request
                            </p>
                        </div>

                        {/* Blood Type Selector */}
                        <div>
                            <label className="text-sm font-medium text-zinc-300 block mb-2">
                                Blood Type
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {bloodTypes.map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setBloodType(type)}
                                        className={`py-3 rounded-xl font-bold text-lg transition-all duration-200 ${bloodType === type
                                                ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 scale-105'
                                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:scale-102'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Register Button */}
                        <Button
                            onClick={handleRegister}
                            disabled={!name.trim()}
                            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-6 text-lg rounded-xl shadow-lg shadow-red-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Register as Donor
                        </Button>

                        {/* Privacy Note */}
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs mt-0.5">
                                Privacy
                            </Badge>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Your location is only shared when you accept an emergency request. You can enable Do Not Disturb anytime.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Back Link */}
                <div className="text-center mt-6">
                    <button
                        onClick={() => router.push('/')}
                        className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
                    >
                        ← Back to home
                    </button>
                </div>
            </div>
        </div>
    );
}
