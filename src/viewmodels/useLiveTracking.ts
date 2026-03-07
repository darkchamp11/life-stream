/**
 * useLiveTracking ViewModel
 * 
 * Subscribes to Firebase for real-time:
 * - Donor responses (accept/decline)
 * - Live location updates from accepted donors
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Location } from '@/models/donor';
import type { DonorResponse } from '@/models/emergency';
import { subscribeToResponses, subscribeToLiveLocations } from '@/services/realtime';

export function useLiveTracking() {
    const [donorLiveLocations, setDonorLiveLocations] = useState<Record<string, Location>>({});
    const unsubscribeRef = useRef<(() => void)[]>([]);

    // Start live tracking subscriptions
    const startTracking = useCallback((
        onResponseUpdate: (responses: DonorResponse[]) => void
    ) => {
        // Cleanup previous
        unsubscribeRef.current.forEach(unsub => unsub());
        unsubscribeRef.current = [];

        const unsubResponses = subscribeToResponses(onResponseUpdate);

        const unsubLocations = subscribeToLiveLocations((locations) => {
            setDonorLiveLocations(prev => {
                if (JSON.stringify(prev) === JSON.stringify(locations)) return prev;
                return locations;
            });
        });

        unsubscribeRef.current = [unsubResponses, unsubLocations];
    }, []);

    // Stop tracking
    const stopTracking = useCallback(() => {
        unsubscribeRef.current.forEach(unsub => unsub());
        unsubscribeRef.current = [];
        setDonorLiveLocations({});
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            unsubscribeRef.current.forEach(unsub => unsub());
        };
    }, []);

    return {
        donorLiveLocations,
        startTracking,
        stopTracking,
    };
}
