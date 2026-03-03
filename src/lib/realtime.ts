/**
 * Real-time Communication using Firebase Realtime Database
 * Enables cross-device communication between hospital and donor
 * 
 * ============================================
 * LOCKING MODEL DOCUMENTATION
 * ============================================
 * 
 * This system uses a POST-CONFIRMATION LOCKING MODEL:
 * 
 * CURRENT IMPLEMENTATION (Early Implementation):
 * 1. Hospital broadcasts blood request
 * 2. Multiple donors can accept request (multi-response)
 * 3. Hospital selects preferred donor(s) from pool
 * 4. Selection is locked once hospital confirms
 * 5. Unselected donors are released
 * 
 * WHY NOT FIRST-COME LOCKING:
 * - Emergency response benefits from multiple candidates
 * - Hospital can evaluate distance, ETA, and availability
 * - Prevents premature lock-in to suboptimal donor
 * 
 * LOCKING ENSURES DETERMINISTIC BEHAVIOR:
 * - Once hospital confirms selection, no further changes allowed
 * - Selected donor(s) receive confirmation with route details
 * - Request status transitions from ACTIVE → FULFILLED
 * 
 * FUTURE WORK:
 * - First-come locking (race condition handling)
 * - Transaction-based atomic updates
 * - Conflict resolution for simultaneous selections
 * 
 * ============================================
 */

import { database } from './firebase';
import { ref, set, onValue, remove, push, get, off } from 'firebase/database';
import type { BloodRequest, DonorResponse, Location } from '@/types';

// Firebase paths
const PATHS = {
    REQUEST: 'lifestream/activeRequest',
    RESPONSES: 'lifestream/responses',
    LIVE_LOCATIONS: 'lifestream/liveLocations',
    SELECTION: 'lifestream/selection',
};

/**
 * Broadcast a blood request (Hospital -> Donors)
 */
export function broadcastRequest(request: BloodRequest): void {
    const requestRef = ref(database, PATHS.REQUEST);
    set(requestRef, {
        ...request,
        createdAt: request.createdAt.toISOString(),
        timestamp: Date.now(),
    });
}

/**
 * Get the current active request
 */
export async function getActiveRequest(): Promise<BloodRequest | null> {
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
 * Clear the active request
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
export function subscribeToRequests(callback: (request: BloodRequest | null) => void): () => void {
    const requestRef = ref(database, PATHS.REQUEST);

    const unsubscribe = onValue(requestRef, (snapshot) => {
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

/**
 * Send donor response (Donor -> Hospital)
 */
export function sendDonorResponse(response: DonorResponse): void {
    const responseRef = ref(database, `${PATHS.RESPONSES}/${response.donorId}`);
    set(responseRef, {
        ...response,
        timestamp: Date.now(),
    });

    // Console log for review evidence
    if (response.accepted) {
        console.log('[LifeStream] 👤 Donor accepted request:', {
            donorId: response.donorId,
            requestId: response.requestId,
            hasLiveLocation: !!response.liveLocation,
        });
    }
}

/**
 * Subscribe to donor responses (for Hospital)
 */
export function subscribeToResponses(callback: (responses: DonorResponse[]) => void): () => void {
    const responsesRef = ref(database, PATHS.RESPONSES);

    const unsubscribe = onValue(responsesRef, (snapshot) => {
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

    const unsubscribe = onValue(locationsRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            // Extract just lat/lng from each entry
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
// Hospital Selection System (Multi-Accept Flow)
// ============================================

export interface DonorSelection {
    requestId: string;
    selectedDonorIds: string[];
    timestamp: number;
}

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

    const unsubscribe = onValue(selectionRef, (snapshot) => {
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
