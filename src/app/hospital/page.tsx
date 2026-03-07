/**
 * Hospital Dashboard Page — MVVM Composition
 * 
 * This page composes ViewModels and Views together:
 * - useHospitalLocation (location management)
 * - useEmergencyRequest (request lifecycle + selection engine)
 * - useLiveTracking (real-time donor tracking)
 * 
 * Views: EmergencyRequestView (idle) / ResultsView (active/confirmed)
 */

'use client';

import { useEffect } from 'react';
import { useHospitalLocation } from '@/viewmodels/useHospitalLocation';
import { useEmergencyRequest } from '@/viewmodels/useEmergencyRequest';
import { useLiveTracking } from '@/viewmodels/useLiveTracking';
import EmergencyRequestView from '@/views/pages/EmergencyRequestView';
import ResultsView from '@/views/pages/ResultsView';
import { getH3Index } from '@/services/geo';
import type { DonorResponse } from '@/models/emergency';

export default function HospitalPage() {
    // ViewModels
    const {
        hospitalLocation,
        searchRadius,
        setSearchRadius,
        error,
        isInitialized,
    } = useHospitalLocation();

    const {
        hospitalState,
        activeRequest,
        prioritizedDonors,
        setPrioritizedDonors,
        selectionLog,
        pipelineLogs,
        selectedDonorIds,
        confirmationMessage,
        initializeDonors,
        requestBlood,
        cancelRequest,
        toggleDonorSelection,
        confirmSelection,
        completeRequest,
    } = useEmergencyRequest(hospitalLocation);

    const { donorLiveLocations, startTracking, stopTracking } = useLiveTracking();

    // Initialize donors when location is available
    useEffect(() => {
        if (hospitalLocation && isInitialized) {
            initializeDonors(hospitalLocation);
        }
    }, [hospitalLocation, isInitialized, initializeDonors]);

    // Start live tracking when request is active
    useEffect(() => {
        if (hospitalState !== 'idle') {
            startTracking((responses: DonorResponse[]) => {
                if (responses.length === 0) return;
                setPrioritizedDonors((prev) => {
                    let updated = [...prev];
                    responses.forEach((response) => {
                        const existingIndex = updated.findIndex(d => d.id === response.donorId);
                        if (existingIndex >= 0) {
                            updated[existingIndex] = {
                                ...updated[existingIndex],
                                status: response.accepted ? 'accepted' : 'declined',
                                name: response.donorName || updated[existingIndex].name,
                            };
                        } else if (response.accepted && response.liveLocation) {
                            if (!updated.find(d => d.id === response.donorId)) {
                                updated.push({
                                    id: response.donorId,
                                    name: response.donorName || `Donor_${response.donorId.slice(-5).toUpperCase()}`,
                                    bloodType: 'O+',
                                    status: 'accepted',
                                    availability: true,
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
        }

        return () => {
            if (hospitalState === 'idle') {
                stopTracking();
            }
        };
    }, [hospitalState, startTracking, stopTracking, setPrioritizedDonors]);

    // Error state
    if (error && !hospitalLocation) {
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

    // IDLE → EmergencyRequestView (Page 1)
    if (hospitalState === 'idle') {
        return (
            <EmergencyRequestView
                hospitalLocation={hospitalLocation}
                searchRadius={searchRadius}
                onSearchRadiusChange={setSearchRadius}
                onRequestBlood={(bloodType, radius, apiKey, hospitalName) =>
                    requestBlood(bloodType, radius, apiKey, hospitalName)
                }
            />
        );
    }

    // ACTIVE/CONFIRMED → ResultsView (Page 2)
    return (
        <ResultsView
            hospitalState={hospitalState}
            activeBloodType={activeRequest?.bloodType ?? 'O+'}
            prioritizedDonors={prioritizedDonors}
            selectionLog={selectionLog}
            pipelineLogs={pipelineLogs}
            selectedDonorIds={selectedDonorIds}
            confirmationMessage={confirmationMessage}
            onToggleDonorSelection={toggleDonorSelection}
            onConfirmSelection={confirmSelection}
            onCancelRequest={cancelRequest}
            onCompleteRequest={completeRequest}
        />
    );
}
