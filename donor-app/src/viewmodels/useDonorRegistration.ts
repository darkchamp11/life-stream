/**
 * useDonorRegistration ViewModel
 * 
 * Manages donor registration flow:
 * - Form state (name, blood type, availability)
 * - GPS location retrieval via expo-location
 * - Submit to both API and Firebase
 * - Persist donor ID locally
 */

import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BloodType, Location } from '../models/donor';
import { getCurrentLocation } from '../services/location';
import { registerDonorAPI } from '../services/api';
import { registerDonorInFirebase } from '../services/realtime';

const DONOR_STORAGE_KEY = '@lifestream_donor';

export function useDonorRegistration() {
    const [name, setName] = useState('');
    const [bloodType, setBloodType] = useState<BloodType>('O+');
    const [availability, setAvailability] = useState(true);
    const [location, setLocation] = useState<Location | null>(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    // Get current GPS location
    const fetchLocation = useCallback(async () => {
        setIsLoadingLocation(true);
        setLocationError(null);

        const result = await getCurrentLocation();
        if (result.success && result.location) {
            setLocation(result.location);
        } else {
            setLocationError(result.error || 'Failed to get location');
        }

        setIsLoadingLocation(false);
    }, []);

    // Register donor
    const register = useCallback(async (): Promise<boolean> => {
        if (!name.trim()) {
            setError('Please enter your name');
            return false;
        }
        if (!location) {
            setError('Please get your current location first');
            return false;
        }

        setIsRegistering(true);
        setError(null);

        const donorId = `donor-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        const donorData = {
            id: donorId,
            name: name.trim(),
            bloodType,
            latitude: location.lat,
            longitude: location.lng,
            availability,
        };

        // Register in Firebase (real-time visibility)
        registerDonorInFirebase(donorData);

        // Also try API registration (optional - may fail if server not running)
        try {
            await registerDonorAPI({
                name: name.trim(),
                blood_group: bloodType,
                latitude: location.lat,
                longitude: location.lng,
                availability,
            });
        } catch {
            // API failure is non-critical as Firebase registration succeeded
        }

        // Persist locally
        await AsyncStorage.setItem(DONOR_STORAGE_KEY, JSON.stringify(donorData));

        setIsRegistering(false);
        return true;
    }, [name, bloodType, location, availability]);

    return {
        name,
        setName,
        bloodType,
        setBloodType,
        availability,
        setAvailability,
        location,
        isLoadingLocation,
        locationError,
        isRegistering,
        error,
        fetchLocation,
        register,
    };
}

/**
 * Check if a donor is already registered
 */
export async function getStoredDonor(): Promise<Record<string, unknown> | null> {
    try {
        const data = await AsyncStorage.getItem(DONOR_STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

/**
 * Clear stored donor data
 */
export async function clearStoredDonor(): Promise<void> {
    await AsyncStorage.removeItem(DONOR_STORAGE_KEY);
}
