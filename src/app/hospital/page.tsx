'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback, useRef } from 'react';
import type { Donor, BloodRequest, BloodType, Location } from '@/types';
import { getCurrentLocation, generateFakeDonors, getH3Index, calculateETA } from '@/lib/geo';
import {
    broadcastRequest,
    clearRequest,
    subscribeToResponses,
    subscribeToLiveLocations,
    confirmDonorSelection,
    clearSelection,
    getActiveRequest
} from '@/lib/realtime';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

// Dynamic import for Leaflet (SSR issues)
const HospitalMap = dynamic(() => import('@/components/HospitalMap'), { ssr: false });

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

type HospitalState = 'idle' | 'scanning' | 'active' | 'confirmed';

export default function HospitalPage() {
    const [hospitalLocation, setHospitalLocation] = useState<Location | null>(null);
    const [donors, setDonors] = useState<Donor[]>([]);
    const [activeRequest, setActiveRequest] = useState<BloodRequest | null>(null);
    const [selectedBloodType, setSelectedBloodType] = useState<BloodType>('O+');
    const [hospitalState, setHospitalState] = useState<HospitalState>('idle');
    const [donorLiveLocations, setDonorLiveLocations] = useState<Record<string, Location>>({});
    const [error, setError] = useState<string | null>(null);
    const [selectedDonorIds, setSelectedDonorIds] = useState<string[]>([]);
    const [donorDetailDialog, setDonorDetailDialog] = useState<Donor | null>(null);
    const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const unsubscribeRef = useRef<(() => void)[]>([]);

    // Get hospital location on mount - ONCE
    useEffect(() => {
        if (isInitialized) return;

        getCurrentLocation()
            .then((location) => {
                setHospitalLocation(location);
                const fakeDonors = generateFakeDonors(location, 5);
                setDonors(fakeDonors);
                setIsInitialized(true);
            })
            .catch((err) => {
                setError('Location access denied.');
                console.error(err);
            });
    }, [isInitialized]);

    // Subscribe to donor responses and live locations - ONCE
    useEffect(() => {
        // Cleanup previous subscriptions
        unsubscribeRef.current.forEach(unsub => unsub());
        unsubscribeRef.current = [];

        const unsubResponses = subscribeToResponses((responses) => {
            if (responses.length === 0) return;

            setDonors((prev) => {
                let updated = [...prev];
                responses.forEach((response) => {
                    const existingIndex = updated.findIndex((d) => d.id === response.donorId);

                    if (existingIndex >= 0) {
                        updated[existingIndex] = {
                            ...updated[existingIndex],
                            status: response.accepted ? 'accepted' : 'declined'
                        };
                    } else if (response.accepted && response.liveLocation) {
                        // Only add if not already in list
                        if (!updated.find(d => d.id === response.donorId)) {
                            updated.push({
                                id: response.donorId,
                                name: `Donor_${response.donorId.slice(-5).toUpperCase()}`,
                                bloodType: 'O+',
                                status: 'accepted',
                                location: response.liveLocation,
                                h3Index: getH3Index(response.liveLocation),
                                trafficStatus: 'clear',
                                estimatedTime: 8,
                            });
                        }
                    }
                });
                return updated;
            });
        });

        const unsubLocations = subscribeToLiveLocations((locations) => {
            setDonorLiveLocations(prev => {
                // Only update if changed
                if (JSON.stringify(prev) === JSON.stringify(locations)) return prev;
                return locations;
            });
        });

        unsubscribeRef.current = [unsubResponses, unsubLocations];

        return () => {
            unsubscribeRef.current.forEach(unsub => unsub());
        };
    }, []);

    const handleRequestBlood = useCallback(() => {
        if (!hospitalLocation) return;

        setHospitalState('scanning');
        setSelectedDonorIds([]);
        setConfirmationMessage(null);

        const request: BloodRequest = {
            id: `req-${Date.now()}`,
            hospitalId: 'hospital-1',
            hospitalName: 'City General Hospital',
            hospitalLocation,
            bloodType: selectedBloodType,
            urgency: 'critical',
            status: 'scanning',
            createdAt: new Date(),
            respondingDonors: [],
        };

        // Simulate scanning delay
        setTimeout(() => {
            setHospitalState('active');
            setActiveRequest({ ...request, status: 'active' });
            broadcastRequest({ ...request, status: 'active' });
        }, 3000);
    }, [hospitalLocation, selectedBloodType]);

    const handleCancelRequest = useCallback(() => {
        setActiveRequest(null);
        setHospitalState('idle');
        setDonors((prev) => prev.map((d) => ({ ...d, status: 'active' as const })));
        setDonorLiveLocations({});
        setSelectedDonorIds([]);
        setConfirmationMessage(null);
        clearRequest();
        clearSelection();
    }, []);

    const toggleDonorSelection = useCallback((donorId: string) => {
        setSelectedDonorIds((prev) =>
            prev.includes(donorId)
                ? prev.filter((id) => id !== donorId)
                : [...prev, donorId]
        );
    }, []);

    const handleConfirmSelection = useCallback(() => {
        if (!activeRequest || selectedDonorIds.length === 0) return;

        confirmDonorSelection(activeRequest.id, selectedDonorIds);
        setHospitalState('confirmed');
        setConfirmationMessage(`✅ ${selectedDonorIds.length} donor(s) confirmed! They are on their way.`);
    }, [activeRequest, selectedDonorIds]);

    const getAnonymousId = (donor: Donor) => `Donor_${donor.id.slice(-5).toUpperCase()}`;

    const acceptedDonors = donors.filter(d => d.status === 'accepted');

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

    if (!hospitalLocation) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-400">Getting location...</p>
                </div>
            </div>
        );
    }

    // IDLE STATE
    if (hospitalState === 'idle') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-950/30 via-zinc-950 to-zinc-950 p-4 flex flex-col">
                {/* Header */}
                <div className="text-center mb-6 pt-4">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-red-500/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-white">City General Hospital</h1>
                    <p className="text-zinc-500 text-sm">Emergency Blood Request</p>
                </div>

                {/* Blood Type Selection */}
                <Card className="bg-zinc-900/80 border-zinc-800 mb-4">
                    <CardContent className="p-4">
                        <label className="block text-sm text-zinc-400 mb-3">Select Blood Type</label>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {BLOOD_TYPES.map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedBloodType(type)}
                                    className={`py-3 rounded-lg font-bold transition-all ${selectedBloodType === type
                                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        <Button
                            onClick={handleRequestBlood}
                            className="w-full py-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-lg"
                        >
                            🚨 EMERGENCY REQUEST
                        </Button>
                    </CardContent>
                </Card>

                {/* Map Preview in Card */}
                <Card className="bg-zinc-900/80 border-zinc-800 flex-1 overflow-hidden">
                    <CardContent className="p-0 h-full">
                        <div className="h-64 md:h-full min-h-[300px] relative">
                            <HospitalMap
                                hospitalLocation={hospitalLocation}
                                donors={donors}
                                donorLiveLocations={donorLiveLocations}
                                showPreciseLocations={false}
                                isScanning={false}
                                selectedDonorIds={[]}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // SCANNING STATE
    if (hospitalState === 'scanning') {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="relative w-40 h-40 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-red-500/20 rounded-full animate-ping" />
                        <div className="absolute inset-4 border-4 border-red-500/30 rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
                        <div className="absolute inset-8 border-4 border-red-500/40 rounded-full animate-ping" style={{ animationDelay: '0.6s' }} />
                        <div className="absolute inset-10 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center">
                            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Scanning for Donors</h2>
                    <p className="text-zinc-400">Requesting {selectedBloodType} blood...</p>
                </div>
            </div>
        );
    }

    // ACTIVE/CONFIRMED STATE
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-lg px-3">
                        {activeRequest?.bloodType}
                    </Badge>
                </div>
                <Button
                    onClick={handleCancelRequest}
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-400"
                >
                    Cancel
                </Button>
            </div>

            {/* Map in Card */}
            <Card className="bg-zinc-900/80 border-zinc-800 flex-1 overflow-hidden mb-4">
                <CardContent className="p-0 h-full">
                    <div className="h-64 md:h-96 relative">
                        <HospitalMap
                            hospitalLocation={hospitalLocation}
                            donors={donors}
                            donorLiveLocations={donorLiveLocations}
                            showPreciseLocations={true}
                            isScanning={false}
                            selectedDonorIds={selectedDonorIds}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Confirmation Message */}
            {confirmationMessage && (
                <Card className="bg-green-500/10 border-green-500/30 mb-4">
                    <CardContent className="p-3 text-center">
                        <p className="text-green-400 font-semibold">{confirmationMessage}</p>
                    </CardContent>
                </Card>
            )}

            {/* Donors Panel */}
            <Card className="bg-zinc-900/80 border-zinc-800">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-zinc-400 text-sm">Responding Donors: {acceptedDonors.length}</span>
                        {selectedDonorIds.length > 0 && hospitalState !== 'confirmed' && (
                            <Button onClick={handleConfirmSelection} size="sm" className="bg-green-600 hover:bg-green-700">
                                Confirm {selectedDonorIds.length}
                            </Button>
                        )}
                    </div>

                    {acceptedDonors.length === 0 ? (
                        <p className="text-center text-zinc-500 py-4">Waiting for donors...</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {acceptedDonors.map((donor) => {
                                const isSelected = selectedDonorIds.includes(donor.id);
                                const liveLocation = donorLiveLocations[donor.id];
                                const eta = liveLocation ? calculateETA(liveLocation, hospitalLocation) : null;

                                return (
                                    <button
                                        key={donor.id}
                                        onClick={() => toggleDonorSelection(donor.id)}
                                        disabled={hospitalState === 'confirmed'}
                                        className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all ${isSelected
                                                ? 'bg-green-500/20 border-2 border-green-500'
                                                : 'bg-zinc-800 border-2 border-transparent hover:border-blue-500/50'
                                            } ${hospitalState === 'confirmed' ? 'opacity-60' : ''}`}
                                    >
                                        <span className={`font-bold ${isSelected ? 'text-green-400' : 'text-blue-400'}`}>
                                            {donor.bloodType}
                                        </span>
                                        <span className="text-white text-sm">{getAnonymousId(donor)}</span>
                                        {eta && <span className="text-zinc-400 text-xs">{eta.time}m</span>}
                                        {liveLocation && <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialog */}
            <Dialog open={!!donorDetailDialog} onOpenChange={() => setDonorDetailDialog(null)}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                    {donorDetailDialog && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{getAnonymousId(donorDetailDialog)}</DialogTitle>
                                <DialogDescription className="text-zinc-400">Donor Details</DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Badge className="bg-red-500/20 text-red-400 text-lg px-3 py-1">
                                    {donorDetailDialog.bloodType}
                                </Badge>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDonorDetailDialog(null)}>Close</Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
