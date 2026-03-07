/**
 * Hospital Model
 * 
 * Hospital types and API key configuration for authentication.
 */

import type { Location } from './donor';

export interface Hospital {
    id: string;
    name: string;
    location: Location;
    apiKey: string;
}

/**
 * Demo hospital API keys as specified in the capstone prompt.
 * Used by API routes for authentication validation.
 */
export const HOSPITAL_API_KEYS: Record<string, Hospital> = {
    'API_APOLLO_123': {
        id: 'hospital-apollo',
        name: 'Apollo Hospital',
        location: { lat: 17.4125, lng: 78.2697 },
        apiKey: 'API_APOLLO_123',
    },
    'API_CARE_456': {
        id: 'hospital-care',
        name: 'Care Hospital',
        location: { lat: 17.4485, lng: 78.3908 },
        apiKey: 'API_CARE_456',
    },
    'API_GANDHI_789': {
        id: 'hospital-gandhi',
        name: 'Gandhi Hospital',
        location: { lat: 17.3850, lng: 78.4867 },
        apiKey: 'API_GANDHI_789',
    },
};

/**
 * Validate an API key and return the associated hospital.
 * Returns null if the key is invalid.
 */
export function validateApiKey(apiKey: string | null): Hospital | null {
    if (!apiKey) return null;
    return HOSPITAL_API_KEYS[apiKey] ?? null;
}
