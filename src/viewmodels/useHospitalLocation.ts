/**
 * useHospitalLocation ViewModel
 * 
 * Manages hospital location state:
 * - Get current location via Geolocation API
 * - Support demo location switching
 * - Track search radius
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Location } from '@/models/donor';
import { getCurrentLocation } from '@/services/geo';

export interface DemoLocation {
    id: string;
    name: string;
    location: Location;
}

export const DEMO_LOCATIONS: DemoLocation[] = [
    { id: 'current', name: 'Current Location', location: { lat: 0, lng: 0 } },
    { id: 'apollo', name: 'Apollo Hospital, Jubilee Hills', location: { lat: 17.4125, lng: 78.2697 } },
    { id: 'care', name: 'Care Hospital, Banjara Hills', location: { lat: 17.4485, lng: 78.3908 } },
    { id: 'gandhi', name: 'Gandhi Hospital, Secunderabad', location: { lat: 17.3850, lng: 78.4867 } },
];

export function useHospitalLocation() {
    const [hospitalLocation, setHospitalLocation] = useState<Location | null>(null);
    const [searchRadius, setSearchRadius] = useState(15);
    const [selectedLocationId, setSelectedLocationId] = useState('current');
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Get location on mount
    useEffect(() => {
        if (isInitialized) return;

        getCurrentLocation()
            .then((location) => {
                setHospitalLocation(location);
                setIsInitialized(true);
            })
            .catch((err) => {
                setError(err.message || 'Location access denied.');
                // Fallback to Gandhi Hospital
                setHospitalLocation(DEMO_LOCATIONS[3].location);
                setIsInitialized(true);
            });
    }, [isInitialized]);

    const handleLocationChange = useCallback((locationId: string, location: Location | null) => {
        setSelectedLocationId(locationId);
        if (location) {
            setHospitalLocation(location);
        }
    }, []);

    return {
        hospitalLocation,
        setHospitalLocation,
        searchRadius,
        setSearchRadius,
        selectedLocationId,
        handleLocationChange,
        error,
        isInitialized,
    };
}
