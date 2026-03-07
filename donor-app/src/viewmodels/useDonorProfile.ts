/**
 * useDonorProfile ViewModel
 * 
 * Manages donor profile state:
 * - Load profile from local storage
 * - Toggle availability (syncs to Firebase)
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateDonorAvailability, getDonorFromFirebase } from '../services/realtime';

const DONOR_STORAGE_KEY = '@lifestream_donor';

export interface DonorProfile {
    id: string;
    name: string;
    bloodType: string;
    latitude: number;
    longitude: number;
    availability: boolean;
}

export function useDonorProfile() {
    const [profile, setProfile] = useState<DonorProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load profile from local storage
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await AsyncStorage.getItem(DONOR_STORAGE_KEY);
                if (data) {
                    setProfile(JSON.parse(data));
                }
            } catch {
                // ignore
            }
            setIsLoading(false);
        };
        loadProfile();
    }, []);

    // Toggle availability
    const toggleAvailability = useCallback(async () => {
        if (!profile) return;

        const newAvailability = !profile.availability;
        const updated = { ...profile, availability: newAvailability };

        setProfile(updated);

        // Sync to Firebase
        updateDonorAvailability(profile.id, newAvailability);

        // Update local storage
        await AsyncStorage.setItem(DONOR_STORAGE_KEY, JSON.stringify(updated));
    }, [profile]);

    return {
        profile,
        isLoading,
        toggleAvailability,
    };
}
