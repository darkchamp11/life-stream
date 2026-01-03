'use client';

import { useEffect, useState, useCallback } from 'react';
import { triggerVibration, stopVibration } from '@/lib/alerts';
import type { BloodRequest } from '@/types';
import { Button } from '@/components/ui/button';

interface AmberAlertProps {
    request: BloodRequest;
    donorBloodType: string;
    onAccept: () => void;
    onDecline: () => void;
}

export default function AmberAlert({ request, donorBloodType, onAccept, onDecline }: AmberAlertProps) {
    const [flashOn, setFlashOn] = useState(true);
    const [isResponding, setIsResponding] = useState(false);

    // Start alert effects
    useEffect(() => {
        // Start vibration (mobile only)
        triggerVibration();

        // Flash effect
        const flashInterval = setInterval(() => {
            setFlashOn((prev) => !prev);
        }, 300);

        return () => {
            stopVibration();
            clearInterval(flashInterval);
        };
    }, []);

    const handleAccept = useCallback(() => {
        if (isResponding) return;
        setIsResponding(true);
        stopVibration();
        onAccept();
    }, [onAccept, isResponding]);

    const handleDecline = useCallback(() => {
        if (isResponding) return;
        setIsResponding(true);
        stopVibration();
        // Small delay to show feedback before closing
        setTimeout(() => {
            onDecline();
        }, 100);
    }, [onDecline, isResponding]);

    const isCompatible = checkBloodCompatibility(donorBloodType, request.bloodType);

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-100 ${flashOn ? 'bg-red-600' : 'bg-red-900'
                }`}
        >
            {/* Pulsing rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <div className="absolute w-64 h-64 border-4 border-white/30 rounded-full animate-ping" />
                <div className="absolute w-96 h-96 border-2 border-white/20 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center px-6 max-w-sm w-full">
                {/* Emergency icon */}
                <div className="mb-6">
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full transition-all duration-100 ${flashOn ? 'bg-white' : 'bg-white/80'
                        }`}>
                        <svg className="w-12 h-12 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-black text-white mb-1 tracking-tight">
                    EMERGENCY
                </h1>
                <p className="text-lg text-white/90 font-semibold mb-6">
                    Blood Donation Request
                </p>

                {/* Request details */}
                <div className="bg-black/30 backdrop-blur rounded-2xl p-5 mb-6">
                    <div className="flex items-center justify-center gap-4 mb-3">
                        <div className="text-center">
                            <p className="text-white/70 text-xs">Needed</p>
                            <p className="text-4xl font-black text-white">{request.bloodType}</p>
                        </div>
                        <div className="text-white/50 text-2xl">→</div>
                        <div className="text-center">
                            <p className="text-white/70 text-xs">Your Type</p>
                            <p className="text-4xl font-black text-white">{donorBloodType}</p>
                        </div>
                    </div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${isCompatible ? 'bg-green-500/30 text-green-300' : 'bg-yellow-500/30 text-yellow-300'
                        }`}>
                        {isCompatible ? '✓ Compatible' : '⚠ Not Optimal'}
                    </div>
                </div>

                {/* Hospital info */}
                <div className="text-white/80 mb-6">
                    <p className="font-semibold">{request.hospitalName}</p>
                    <p className="text-sm text-white/60">Requesting Hospital</p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                    <Button
                        onClick={handleDecline}
                        disabled={isResponding}
                        variant="outline"
                        className="flex-1 py-6 bg-black/40 hover:bg-black/60 text-white font-bold border-white/20 disabled:opacity-50"
                    >
                        Decline
                    </Button>
                    <Button
                        onClick={handleAccept}
                        disabled={isResponding}
                        className="flex-1 py-6 bg-white hover:bg-white/90 text-red-600 font-bold disabled:opacity-50"
                    >
                        {isResponding ? 'Processing...' : 'Accept'}
                    </Button>
                </div>

                <p className="mt-4 text-white/50 text-xs">
                    Accepting will share your live location
                </p>
            </div>
        </div>
    );
}

// Complete blood compatibility check (donor -> recipient)
function checkBloodCompatibility(donorType: string, recipientType: string): boolean {
    // Universal donor O- can donate to anyone
    if (donorType === 'O-') return true;
    // Same type always works
    if (donorType === recipientType) return true;
    // O+ can donate to any positive type
    if (donorType === 'O+' && recipientType.includes('+')) return true;
    // A- can donate to A+, A-, AB+, AB-
    if (donorType === 'A-' && (recipientType === 'A+' || recipientType === 'A-' || recipientType === 'AB+' || recipientType === 'AB-')) return true;
    // A+ can donate to A+ and AB+
    if (donorType === 'A+' && (recipientType === 'A+' || recipientType === 'AB+')) return true;
    // B- can donate to B+, B-, AB+, AB-
    if (donorType === 'B-' && (recipientType === 'B+' || recipientType === 'B-' || recipientType === 'AB+' || recipientType === 'AB-')) return true;
    // B+ can donate to B+ and AB+
    if (donorType === 'B+' && (recipientType === 'B+' || recipientType === 'AB+')) return true;
    // AB- can donate to AB+ and AB-
    if (donorType === 'AB-' && (recipientType === 'AB+' || recipientType === 'AB-')) return true;
    // AB+ can only donate to AB+
    if (donorType === 'AB+' && recipientType === 'AB+') return true;
    return false;
}
