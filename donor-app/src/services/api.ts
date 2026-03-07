/**
 * API Service (Mobile App)
 * 
 * HTTP calls to the hospital dashboard API for donor registration.
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export async function registerDonorAPI(donor: {
    name: string;
    blood_group: string;
    latitude: number;
    longitude: number;
    availability: boolean;
}): Promise<{ success: boolean; donor?: unknown; error?: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/donor/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(donor),
        });

        const data = await response.json();

        if (response.ok) {
            return { success: true, donor: data.donor };
        } else {
            return { success: false, error: data.error || 'Registration failed' };
        }
    } catch (error) {
        return { success: false, error: 'Network error. Make sure the server is running.' };
    }
}

export async function getDonorsAPI(): Promise<{ success: boolean; donors?: unknown[]; error?: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/donors`);
        const data = await response.json();

        if (response.ok) {
            return { success: true, donors: data.donors };
        } else {
            return { success: false, error: data.error || 'Failed to fetch donors' };
        }
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
}
