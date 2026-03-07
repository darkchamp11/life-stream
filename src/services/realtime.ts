/**
 * Realtime Service — Firebase RTDB Communication
 *
 * Enables cross-device communication between hospital dashboard and donor app.
 *
 * LOCKING MODEL:
 * 1. Hospital broadcasts blood request
 * 2. Multiple donors can accept request (multi-response)
 * 3. Hospital selects preferred donor(s) from pool
 * 4. Selection is locked once hospital confirms
 * 5. Unselected donors are released
 */

import { database } from './firebase';
import { ref, set, onValue, remove, push, get, off, update } from 'firebase/database';
import type { Location } from '@/models/donor';
import type { EmergencyRequest, DonorResponse, DonorSelection } from '@/models/emergency';

// Firebase paths
const PATHS = {
    DONORS: 'lifestream/donors',
    REQUEST: 'lifestream/activeRequest',
    RESPONSES: 'lifestream/responses',
    LIVE_LOCATIONS: 'lifestream/liveLocations',
    SELECTION: 'lifestream/selection',
    EMERGENCY_RESULTS: 'lifestream/emergencyResults',
};

// ============================================
// DONOR OPERATIONS
// ============================================

/**
 * Register a donor in Firebase RTDB
 */
export function registerDonor(donor: {
    id: string;
    name: string;
    bloodType: string;
    latitude: number;
    longitude: number;
    availability: boolean;
}): void {
    const donorRef = ref(database, `${PATHS.DONORS}/${donor.id}`);
    set(donorRef, {
        ...donor,
        timestamp: Date.now(),
    });
}

/**
 * Get all donors from Firebase
 */
export async function getAllDonors(): Promise<Record<string, unknown>[]> {
    const donorsRef = ref(database, PATHS.DONORS);
    const snapshot = await get(donorsRef);

    if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.values(data);
    }
    return [];
}

/**
 * Subscribe to donors list changes
 */
export function subscribeToDonors(callback: (donors: Record<string, unknown>[]) => void): () => void {
    const donorsRef = ref(database, PATHS.DONORS);

    onValue(donorsRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(Object.values(snapshot.val()));
        } else {
            callback([]);
        }
    });

    return () => off(donorsRef);
}

/**
 * Update donor availability
 */
export function updateDonorAvailability(donorId: string, availability: boolean): void {
    const donorRef = ref(database, `${PATHS.DONORS}/${donorId}`);
    update(donorRef, { availability, timestamp: Date.now() });
}

// ============================================
// EMERGENCY REQUEST OPERATIONS
// ============================================

/**
 * Broadcast a blood request (Hospital -> Donors)
 */
export function broadcastRequest(request: EmergencyRequest): void {
    const requestRef = ref(database, PATHS.REQUEST);
    set(requestRef, {
        ...request,
        createdAt: request.createdAt instanceof Date ? request.createdAt.toISOString() : request.createdAt,
        timestamp: Date.now(),
    });
}

/**
 * Get the current active request
 */
export async function getActiveRequest(): Promise<EmergencyRequest | null> {
    const requestRef = ref(database, PATHS.REQUEST);
    const snapshot = await get(requestRef);

    if (snapshot.exists()) {
        const data = snapshot.val();
        return {
            ...data,
            createdAt: new Date(data.createdAt),
        };
    }
    return null;
}

/**
 * Clear the active request and all associated data
 */
export function clearRequest(): void {
    remove(ref(database, PATHS.REQUEST));
    remove(ref(database, PATHS.RESPONSES));
    remove(ref(database, PATHS.LIVE_LOCATIONS));
    remove(ref(database, PATHS.SELECTION));
}

/**
 * Subscribe to blood requests (for Donors)
 */
export function subscribeToRequests(callback: (request: EmergencyRequest | null) => void): () => void {
    const requestRef = ref(database, PATHS.REQUEST);

    onValue(requestRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            callback({
                ...data,
                createdAt: new Date(data.createdAt),
            });
        } else {
            callback(null);
        }
    });

    return () => off(requestRef);
}

// ============================================
// DONOR RESPONSE OPERATIONS
// ============================================

/**
 * Send donor response (Donor -> Hospital)
 */
export function sendDonorResponse(response: DonorResponse): void {
    const responseRef = ref(database, `${PATHS.RESPONSES}/${response.donorId}`);
    set(responseRef, {
        ...response,
        timestamp: Date.now(),
    });
}

/**
 * Subscribe to donor responses (for Hospital)
 */
export function subscribeToResponses(callback: (responses: DonorResponse[]) => void): () => void {
    const responsesRef = ref(database, PATHS.RESPONSES);

    onValue(responsesRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const responses = Object.values(data) as DonorResponse[];
            callback(responses);
        } else {
            callback([]);
        }
    });

    return () => off(responsesRef);
}

// ============================================
// LIVE LOCATION OPERATIONS
// ============================================

/**
 * Update donor live location
 */
export function updateLiveLocation(donorId: string, location: Location): void {
    const locationRef = ref(database, `${PATHS.LIVE_LOCATIONS}/${donorId}`);
    set(locationRef, {
        ...location,
        timestamp: Date.now(),
    });
}

/**
 * Subscribe to live location updates (for Hospital)
 */
export function subscribeToLiveLocations(callback: (locations: Record<string, Location>) => void): () => void {
    const locationsRef = ref(database, PATHS.LIVE_LOCATIONS);

    onValue(locationsRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const locations: Record<string, Location> = {};
            for (const [donorId, locData] of Object.entries(data)) {
                const loc = locData as Location & { timestamp?: number };
                locations[donorId] = { lat: loc.lat, lng: loc.lng };
            }
            callback(locations);
        } else {
            callback({});
        }
    });

    return () => off(locationsRef);
}

// ============================================
// DONOR SELECTION OPERATIONS
// ============================================

/**
 * Hospital confirms selection of specific donors
 */
export function confirmDonorSelection(requestId: string, donorIds: string[]): void {
    const selectionRef = ref(database, PATHS.SELECTION);
    set(selectionRef, {
        requestId,
        selectedDonorIds: donorIds,
        timestamp: Date.now(),
    });
}

/**
 * Get current selection
 */
export async function getDonorSelection(): Promise<DonorSelection | null> {
    const selectionRef = ref(database, PATHS.SELECTION);
    const snapshot = await get(selectionRef);

    if (snapshot.exists()) {
        return snapshot.val();
    }
    return null;
}

/**
 * Subscribe to donor selection (for Donors)
 */
export function subscribeToSelection(
    donorId: string,
    callback: (result: { isSelected: boolean; selection: DonorSelection } | null) => void
): () => void {
    const selectionRef = ref(database, PATHS.SELECTION);

    onValue(selectionRef, (snapshot) => {
        if (snapshot.exists()) {
            const selection: DonorSelection = snapshot.val();
            callback({
                isSelected: selection.selectedDonorIds.includes(donorId),
                selection,
            });
        } else {
            callback(null);
        }
    });

    return () => off(selectionRef);
}

/**
 * Clear selection
 */
export function clearSelection(): void {
    remove(ref(database, PATHS.SELECTION));
}

// ============================================
// EMERGENCY RESULTS STORAGE
// ============================================

/**
 * Store emergency results (for GET /api/emergency/:id/results)
 */
export function storeEmergencyResults(requestId: string, results: unknown): void {
    const resultsRef = ref(database, `${PATHS.EMERGENCY_RESULTS}/${requestId}`);
    set(resultsRef, {
        ...results as Record<string, unknown>,
        timestamp: Date.now(),
    });
}

/**
 * Get emergency results by ID
 */
export async function getEmergencyResults(requestId: string): Promise<unknown | null> {
    const resultsRef = ref(database, `${PATHS.EMERGENCY_RESULTS}/${requestId}`);
    const snapshot = await get(resultsRef);

    if (snapshot.exists()) {
        return snapshot.val();
    }
    return null;
}
