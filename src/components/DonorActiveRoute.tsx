'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { BloodRequest, Location } from '@/types';
import { calculateETA } from '@/lib/geo';

interface DonorActiveRouteProps {
    request: BloodRequest;
    donorLocation: Location;
}

export default function DonorActiveRoute({ request, donorLocation }: DonorActiveRouteProps) {
    const [eta, setEta] = useState<{ distance: number; time: number; trafficStatus: string } | null>(null);
    const [progress, setProgress] = useState(0);

    // Calculate ETA
    useEffect(() => {
        const etaInfo = calculateETA(donorLocation, request.hospitalLocation);
        setEta(etaInfo);
    }, [donorLocation, request.hospitalLocation]);

    // Animate progress bar
    useEffect(() => {
        if (!eta) return;

        // Simulate progress based on estimated time
        const totalSeconds = eta.time * 60;
        const interval = setInterval(() => {
            setProgress((prev) => Math.min(prev + (100 / totalSeconds), 100));
        }, 1000);

        return () => clearInterval(interval);
    }, [eta]);

    const getTrafficColor = (status: string) => {
        switch (status) {
            case 'heavy': return 'text-red-400 bg-red-500/10 border-red-500/30';
            case 'moderate': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
            case 'clear': return 'text-green-400 bg-green-500/10 border-green-500/30';
            default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30';
        }
    };

    const handleNavigate = () => {
        // Open Google Maps with directions
        const { lat, lng } = request.hospitalLocation;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
        window.open(url, '_blank');
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-green-950/30 via-zinc-950 to-zinc-950 p-4 flex flex-col items-center justify-center">
            {/* Success Animation */}
            <div className="mb-8 text-center">
                <div className="relative inline-flex">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                        <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-green-500/50 animate-ping" />
                </div>
                <h2 className="text-xl font-semibold text-white mt-4">You're On Your Way!</h2>
                <p className="text-zinc-400 text-sm">The hospital is waiting for you</p>
            </div>

            {/* Route Card */}
            <Card className="w-full max-w-md bg-zinc-900/80 border-zinc-800">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <CardTitle className="text-lg text-white">{request.hospitalName}</CardTitle>
                            <p className="text-xs text-zinc-500">Requesting: {request.bloodType} Blood</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* ETA Display */}
                    {eta && (
                        <div className="bg-zinc-800/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-zinc-400">Estimated Arrival</span>
                                <Badge variant="outline" className={getTrafficColor(eta.trafficStatus)}>
                                    {eta.trafficStatus.charAt(0).toUpperCase() + eta.trafficStatus.slice(1)} traffic
                                </Badge>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-white">{eta.time}</span>
                                <span className="text-zinc-400">min</span>
                                <span className="text-zinc-500 text-sm ml-auto">{eta.distance} km</span>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-4">
                                <Progress value={progress} className="h-2 bg-zinc-700" />
                                <p className="text-xs text-zinc-500 mt-1 text-right">{Math.round(progress)}% complete</p>
                            </div>
                        </div>
                    )}

                    {/* Quick Info */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-red-400">{request.bloodType}</p>
                            <p className="text-xs text-zinc-500">Blood Type</p>
                        </div>
                        <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-amber-400">URGENT</p>
                            <p className="text-xs text-zinc-500">Priority</p>
                        </div>
                    </div>

                    {/* Navigate Button */}
                    <Button
                        onClick={handleNavigate}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Open in Google Maps
                    </Button>

                    {/* Safety Reminder */}
                    <p className="text-center text-xs text-zinc-500">
                        🚗 Drive safely. The hospital has been notified of your arrival.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
