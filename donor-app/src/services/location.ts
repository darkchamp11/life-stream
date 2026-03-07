/**
 * Location Service (Mobile App)
 * 
 * Wraps expo-location for GPS coordinate retrieval.
 */

import * as ExpoLocation from 'expo-location';
import type { Location } from '../models/donor';

/**
 * Request location permissions and get current GPS coordinates
 */
export async function getCurrentLocation(): Promise<{
    success: boolean;
    location?: Location;
    error?: string;
}> {
    try {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
            return {
                success: false,
                error: 'Location permission denied. Please enable location access in settings.',
            };
        }

        const position = await ExpoLocation.getCurrentPositionAsync({
            accuracy: ExpoLocation.Accuracy.High,
        });

        return {
            success: true,
            location: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            },
        };
    } catch (error) {
        return {
            success: false,
            error: 'Failed to get location. Please try again.',
        };
    }
}

/**
 * Watch location for live updates
 */
export async function watchLocation(
    onUpdate: (location: Location) => void,
): Promise<{ remove: () => void } | null> {
    try {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (status !== 'granted') return null;

        const subscription = await ExpoLocation.watchPositionAsync(
            {
                accuracy: ExpoLocation.Accuracy.High,
                timeInterval: 5000,
                distanceInterval: 10,
            },
            (position) => {
                onUpdate({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            }
        );

        return subscription;
    } catch {
        return null;
    }
}
