'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { BloodRequest, Location } from '@/types';
import { getCurrentLocation, watchLocation } from '@/lib/geo';
import { canDonateToType } from '@/lib/compatibility';
import {
    subscribeToRequests,
    sendDonorResponse,
    updateLiveLocation,
    subscribeToSelection,
} from '@/lib/realtime';
import { getDonorIdentity, type DonorIdentity } from '@/lib/donor-identity';
import { getDNDState } from '@/lib/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DonorHeader from '@/components/DonorHeader';
import DonationHistory from '@/components/DonationHistory';

// Dynamic imports for client-only components
const AmberAlert = dynamic(() => import('@/components/AmberAlert'), { ssr: false });
const DonorMap = dynamic(() => import('@/components/DonorMap'), { ssr: false });
const DonorActiveRoute = dynamic(() => import('@/components/DonorActiveRoute'), { ssr: false });
const NotSelectedMessage = dynamic(() => import('@/components/NotSelectedMessage'), { ssr: false });

type DonorState = 'loading' | 'standby' | 'dnd' | 'alert' | 'accepted' | 'confirmed' | 'not-selected';

export default function DonorPage() {
    const router = useRouter();
    const [donorState, setDonorState] = useState<DonorState>('loading');
    const [location, setLocation] = useState<Location | null>(null);
    const [activeRequest, setActiveRequest] = useState<BloodRequest | null>(null);
    const [identity, setIdentity] = useState<DonorIdentity | null>(null);
    const [isDND, setIsDND] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const stopWatchRef = useRef<(() => void) | null>(null);
    // Track declined request IDs to prevent re-triggering alert
    const declinedRequestsRef = useRef<Set<string>>(new Set());
    // Track not-selected request IDs to prevent re-triggering alert after dismissal
    const notSelectedRequestsRef = useRef<Set<string>>(new Set());
    // Track accepted request IDs to prevent re-triggering after page reload
    const acceptedRequestsRef = useRef<Set<string>>(new Set());
    // Track donorState in ref to avoid re-running effects when state changes
    const donorStateRef = useRef<DonorState>(donorState);

    // Keep ref in sync with state
    useEffect(() => {
        donorStateRef.current = donorState;
    }, [donorState]);

    // Initialize identity and location
    useEffect(() => {
        // Check for demo mode (from Donor Simulator)
        const urlParams = new URLSearchParams(window.location.search);
        const isDemo = urlParams.get('demo') === 'true';
        const demoDonorId = urlParams.get('donorId');

        if (isDemo && demoDonorId) {
            // Demo mode: Get donor data from sessionStorage
            const demoDonors = JSON.parse(sessionStorage.getItem('lifestream_demo_donors') || '{}');
            const fakeDonor = demoDonors[demoDonorId];

            if (fakeDonor) {
                // Generate anonymous username from donor ID (privacy-first)
                const anonymousUsername = `Donor_${fakeDonor.id.slice(-5).toUpperCase()}`;

                // Create a demo identity from the fake donor data
                // Privacy-first: username is anonymous, realName is revealed after consent
                const demoIdentity: DonorIdentity = {
                    id: fakeDonor.id,
                    username: anonymousUsername,  // Anonymous ID shown before consent
                    realName: `Demo User ${fakeDonor.id.slice(-3).toUpperCase()}`,  // Demo name for after consent
                    bloodType: fakeDonor.bloodType,
                    avatarSeed: fakeDonor.id,
                    donationCount: Math.floor(Math.random() * 5),
                    donationHistory: [],
                    createdAt: new Date().toISOString(),
                    isRegistered: true, // Mark as registered for demo
                };

                setIdentity(demoIdentity);
                setLocation(fakeDonor.location);
                setDonorState('standby');
                setIsInitialized(true);
                console.log('[LifeStream Demo] Logged in as:', anonymousUsername, '| Blood:', fakeDonor.bloodType, '| Location:', fakeDonor.location);
                return;
            }
        }

        // Normal mode: Check real donor identity
        const donorIdentity = getDonorIdentity();

        // Redirect to registration if not registered
        if (!donorIdentity.isRegistered) {
            router.replace('/donor/register');
            return;
        }

        setIdentity(donorIdentity);

        const dndState = getDNDState();
        setIsDND(dndState.isActive);

        // Restore accepted request IDs from sessionStorage
        const storedAccepted = sessionStorage.getItem('lifestream_accepted_requests');
        if (storedAccepted) {
            try {
                const ids = JSON.parse(storedAccepted) as string[];
                ids.forEach(id => acceptedRequestsRef.current.add(id));
            } catch { /* ignore */ }
        }

        // Restore declined request IDs from sessionStorage
        const storedDeclined = sessionStorage.getItem('lifestream_declined_requests');
        if (storedDeclined) {
            try {
                const ids = JSON.parse(storedDeclined) as string[];
                ids.forEach(id => declinedRequestsRef.current.add(id));
            } catch { /* ignore */ }
        }

        getCurrentLocation()
            .then((loc) => {
                setLocation(loc);
                setDonorState(dndState.isActive ? 'dnd' : 'standby');
                setIsInitialized(true);
            })
            .catch((err) => {
                setError('Location access denied. Please enable location permissions.');
                console.error(err);
            });
    }, [router]);


    // Subscribe to blood requests
    // Note: We use donorStateRef.current inside the callback to avoid re-subscribing on every state change
    // We depend on isInitialized to ensure subscription runs after initialization is complete (not location which changes often)
    useEffect(() => {
        if (!identity || isDND || !isInitialized) return;

        const unsubscribe = subscribeToRequests((request) => {
            const currentState = donorStateRef.current;

            // Request cleared
            if (!request) {
                // Clear all tracking sets when request is cleared
                declinedRequestsRef.current.clear();
                notSelectedRequestsRef.current.clear();
                acceptedRequestsRef.current.clear();
                sessionStorage.removeItem('lifestream_accepted_requests');
                sessionStorage.removeItem('lifestream_declined_requests');

                if (currentState === 'alert' || currentState === 'accepted') {
                    setActiveRequest(null);
                    setDonorState('standby');
                    if (stopWatchRef.current) {
                        stopWatchRef.current();
                        stopWatchRef.current = null;
                    }
                }
                return;
            }

            // New request came in
            if (request.status === 'active') {
                // Check if we already declined this request
                if (declinedRequestsRef.current.has(request.id)) {
                    return; // Don't show alert for declined requests
                }

                // Check if we were already not-selected for this request
                if (notSelectedRequestsRef.current.has(request.id)) {
                    return; // Don't show alert for not-selected requests
                }

                // Check if we already accepted this request (page might have reloaded)
                if (acceptedRequestsRef.current.has(request.id)) {
                    // Restore accepted state
                    setActiveRequest(request);
                    setDonorState('accepted');
                    return;
                }

                // Check blood type compatibility
                if (!canDonateToType(identity.bloodType, request.bloodType)) {
                    console.log(`Skipping alert: ${identity.bloodType} cannot donate to ${request.bloodType}`);
                    return;
                }

                // Only show alert if in standby
                if (currentState === 'standby') {
                    setActiveRequest(request);
                    setDonorState('alert');
                }
            }
        });

        return () => unsubscribe();
    }, [identity, isDND, isInitialized]);

    // Subscribe to hospital selection
    // Note: We use donorStateRef to check state without triggering re-subscription
    useEffect(() => {
        if (!identity) return;
        // Only subscribe when in 'accepted' state
        if (donorStateRef.current !== 'accepted') return;

        const unsubscribe = subscribeToSelection(identity.id, (result) => {
            // Only process if still in accepted state
            if (donorStateRef.current !== 'accepted') return;

            if (result) {
                if (result.isSelected) {
                    setDonorState('confirmed');
                } else {
                    setDonorState('not-selected');
                    if (stopWatchRef.current) {
                        stopWatchRef.current();
                        stopWatchRef.current = null;
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [identity, donorState]);

    const handleDNDChange = useCallback((isActive: boolean) => {
        setIsDND(isActive);
        setDonorState(isActive ? 'dnd' : 'standby');
    }, []);

    const handleAccept = useCallback(() => {
        if (!location || !activeRequest || !identity) return;

        setDonorState('accepted');

        // Persist accepted request ID for page reload recovery
        acceptedRequestsRef.current.add(activeRequest.id);
        sessionStorage.setItem(
            'lifestream_accepted_requests',
            JSON.stringify(Array.from(acceptedRequestsRef.current))
        );

        sendDonorResponse({
            donorId: identity.id,
            requestId: activeRequest.id,
            accepted: true,
            liveLocation: location,
            donorName: identity.realName,  // Include real name for privacy-first reveal
        });

        stopWatchRef.current = watchLocation((newLocation) => {
            setLocation(newLocation);
            updateLiveLocation(identity.id, newLocation);
        });
    }, [location, activeRequest, identity]);

    const handleDecline = useCallback(() => {
        if (!activeRequest || !identity) return;

        // Mark this request as declined so we don't show alert again
        declinedRequestsRef.current.add(activeRequest.id);
        sessionStorage.setItem(
            'lifestream_declined_requests',
            JSON.stringify(Array.from(declinedRequestsRef.current))
        );

        sendDonorResponse({
            donorId: identity.id,
            requestId: activeRequest.id,
            accepted: false,
        });

        // Clear state immediately
        setActiveRequest(null);
        setDonorState('standby');
    }, [activeRequest, identity]);

    const handleNotSelectedDismiss = useCallback(() => {
        // Mark this request as handled so we don't show alert again
        if (activeRequest) {
            notSelectedRequestsRef.current.add(activeRequest.id);
        }
        setDonorState('standby');
        setActiveRequest(null);
    }, [activeRequest]);

    // Handle identity change from settings
    const handleIdentityChange = useCallback((updatedIdentity: DonorIdentity) => {
        setIdentity(updatedIdentity);
    }, []);

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">Location Required</h2>
                    <p className="text-zinc-400">{error}</p>
                </div>
            </div>
        );
    }

    // Loading state
    if (donorState === 'loading' || !identity || !location) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-400">Setting up your profile...</p>
                </div>
            </div>
        );
    }

    // Amber Alert overlay
    if (donorState === 'alert' && activeRequest) {
        return (
            <AmberAlert
                request={activeRequest}
                donorBloodType={identity.bloodType}
                onAccept={handleAccept}
                onDecline={handleDecline}
            />
        );
    }

    // Not selected message
    if (donorState === 'not-selected') {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col">
                <DonorHeader identity={identity} status="not-selected" />
                <NotSelectedMessage onDismiss={handleNotSelectedDismiss} />
            </div>
        );
    }

    // Confirmed - show route card (no map)
    if (donorState === 'confirmed' && activeRequest) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col">
                <DonorHeader identity={identity} status="confirmed" />
                <DonorActiveRoute request={activeRequest} donorLocation={location} />
            </div>
        );
    }

    // Main donor view - MOBILE FIRST
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col">
            <DonorHeader
                identity={identity}
                status={isDND ? 'dnd' : donorState as 'standby' | 'accepted'}
                onDNDChange={handleDNDChange}
                onIdentityChange={handleIdentityChange}
            />

            {/* Map in Card */}
            <div className="p-4">
                <Card className="bg-zinc-900/80 border-zinc-800 h-full overflow-hidden">
                    <CardContent className="p-0 h-full">
                        <div className="relative h-64 md:h-80">
                            <DonorMap
                                donorLocation={location}
                                hospitalLocation={donorState === 'accepted' && activeRequest ? activeRequest.hospitalLocation : null}
                                isSharing={donorState === 'accepted'}
                            />
                            {/* DND Overlay */}
                            {isDND && (
                                <div className="absolute inset-0 bg-zinc-950/90 flex items-center justify-center z-[1000]">
                                    <div className="text-center p-4">
                                        <p className="text-amber-400 font-semibold text-lg">🔕 Do Not Disturb</p>
                                        <p className="text-zinc-500 text-sm">You won't receive alerts</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Status Panel */}
            <div className="p-4 pt-0">
                <Card className="bg-zinc-800/50 border-zinc-700">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDND ? 'bg-amber-500/20' :
                                donorState === 'accepted' ? 'bg-green-500/20 animate-pulse' :
                                    'bg-zinc-700'
                                }`}>
                                {isDND ? (
                                    <span className="text-2xl">🔕</span>
                                ) : donorState === 'accepted' ? (
                                    <span className="text-2xl">📍</span>
                                ) : (
                                    <span className="text-2xl">🩸</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-white font-semibold">
                                    {isDND ? 'Do Not Disturb' :
                                        donorState === 'accepted' ? 'Sharing Location' :
                                            'Ready to Help'}
                                </h3>
                                <p className="text-zinc-500 text-sm">
                                    {isDND ? "You won't receive alerts" :
                                        donorState === 'accepted' ? 'Waiting for hospital...' :
                                            'Waiting for emergency alerts'}
                                </p>
                            </div>
                            <Badge className={`${isDND ? 'bg-amber-500/20 text-amber-400' :
                                donorState === 'accepted' ? 'bg-green-500/20 text-green-400' :
                                    'bg-zinc-700 text-zinc-400'
                                }`}>
                                {isDND ? 'DND' : donorState === 'accepted' ? 'LIVE' : 'STANDBY'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Donation History */}
                <details className="mt-4 group">
                    <summary className="flex items-center justify-between cursor-pointer text-zinc-400 text-sm p-2 rounded-lg hover:bg-zinc-800/50">
                        <span>View Donation History ({identity.donationCount})</span>
                        <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </summary>
                    <div className="mt-2">
                        <DonationHistory identity={identity} />
                    </div>
                </details>
            </div>
        </div>
    );
}
