/**
 * Realtime Service (Mobile App)
 * 
 * Firebase RTDB operations for donor-side communication.
 * Uses lazy Firebase initialization to prevent crashes.
 */

import { getFirebaseDatabase } from './firebase';
import { ref, set, onValue, off, get, update } from 'firebase/database';
import type { Location } from '../models/donor';
import type { EmergencyRequest, DonorResponse } from '../models/emergency';

const PATHS = {
    DONORS: 'lifestream/donors',
    REQUEST: 'lifestream/activeRequest',
    RESPONSES: 'lifestream/responses',
    LIVE_LOCATIONS: 'lifestream/liveLocations',
    SELECTION: 'lifestream/selection',
};

function db() {
    return getFirebaseDatabase();
}

/**
 * Register donor in Firebase
 */
export function registerDonorInFirebase(donor: {
    id: string;
    name: string;
    bloodType: string;
    latitude: number;
    longitude: number;
    availability: boolean;
}): void {
    const donorRef = ref(db(), `${PATHS.DONORS}/${donor.id}`);
    set(donorRef, {
        ...donor,
        timestamp: Date.now(),
    });
}

/**
 * Update donor availability
 */
export function updateDonorAvailability(donorId: string, availability: boolean): void {
    const donorRef = ref(db(), `${PATHS.DONORS}/${donorId}`);
    update(donorRef, { availability, timestamp: Date.now() });
}

/**
 * Subscribe to emergency requests
 */
export function subscribeToRequests(
    callback: (request: EmergencyRequest | null) => void
): () => void {
    const requestRef = ref(db(), PATHS.REQUEST);

    onValue(requestRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        } else {
            callback(null);
        }
    });

    return () => off(requestRef);
}

/**
 * Send donor response (accept/decline)
 */
export function sendDonorResponse(response: DonorResponse): void {
    const responseRef = ref(db(), `${PATHS.RESPONSES}/${response.donorId}`);
    set(responseRef, {
        ...response,
        timestamp: Date.now(),
    });
}

/**
 * Update donor live location
 */
export function updateLiveLocation(donorId: string, location: Location): void {
    const locationRef = ref(db(), `${PATHS.LIVE_LOCATIONS}/${donorId}`);
    set(locationRef, {
        ...location,
        timestamp: Date.now(),
    });
}

/**
 * Subscribe to selection results
 */
export function subscribeToSelection(
    donorId: string,
    callback: (result: { isSelected: boolean } | null) => void
): () => void {
    const selectionRef = ref(db(), PATHS.SELECTION);

    onValue(selectionRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            callback({
                isSelected: data.selectedDonorIds?.includes(donorId) ?? false,
            });
        } else {
            callback(null);
        }
    });

    return () => off(selectionRef);
}

/**
 * Get donor data from Firebase
 */
export async function getDonorFromFirebase(donorId: string): Promise<Record<string, unknown> | null> {
    const donorRef = ref(db(), `${PATHS.DONORS}/${donorId}`);
    const snapshot = await get(donorRef);
    return snapshot.exists() ? snapshot.val() : null;
}
