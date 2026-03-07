/**
 * Geospatial Service — Donor Selection Engine
 *
 * SPATIAL INDEXING APPROACH:
 * - Geohash (precision=5): Spatial index to reduce search space
 * - H3 Hexagons: Privacy zones and UI visualization
 *
 * DISTANCE CALCULATION:
 * - Haversine formula for exact distance computation
 *
 * DONOR SELECTION PIPELINE:
 * Step 1 — Emergency request received
 * Step 2 — Spatial filtering (geohash-based grouping)
 * Step 3 — Haversine distance computation
 * Step 4 — Eligibility constraints (blood type, availability, radius)
 * Step 5 — Ranking by distance (ascending)
 * Step 6 — Return ranked donor list with execution logs
 */

import * as h3 from 'h3-js';
import type { Location, Donor, BloodType, TrafficStatus, DonorStatus } from '@/models/donor';
import type { SelectionLog, PipelineLog, SelectionResult } from '@/models/emergency';
import { encodeGeohash, GEOHASH_PRECISION } from './geohash';
import { canDonateToType } from './compatibility';

// H3 resolution: 7 = ~5km cells (privacy), 9 = ~200m cells (after accept)
const H3_RESOLUTION_PRIVACY = 7;
const H3_RESOLUTION_PRECISE = 9;

/**
 * Maximum reachability radius in kilometers (default)
 */
export const MAX_REACHABILITY_RADIUS_KM = 15;

// ============================================
// GEOLOCATION
// ============================================

/**
 * Get user's current location using Geolocation API
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
                let errorMessage = 'Unable to get your location';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Please enable location access.';
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
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
}

// ============================================
// H3 HEXAGONAL GRID
// ============================================

export function getH3Index(location: Location, precise = false): string {
    const resolution = precise ? H3_RESOLUTION_PRECISE : H3_RESOLUTION_PRIVACY;
    return h3.latLngToCell(location.lat, location.lng, resolution);
}

export function getH3Center(h3Index: string): Location {
    const [lat, lng] = h3.cellToLatLng(h3Index);
    return { lat, lng };
}

export function getH3Boundary(h3Index: string): [number, number][] {
    const boundary = h3.cellToBoundary(h3Index);
    return boundary.map(([lat, lng]) => [lat, lng]);
}

// ============================================
// HAVERSINE DISTANCE
// ============================================

/**
 * Calculate distance between two locations using Haversine formula
 * Returns distance in kilometers
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
 */
export function calculateETA(from: Location, to: Location): { distance: number; time: number; trafficStatus: TrafficStatus } {
    const distance = calculateDistance(from, to);

    const seed = Math.abs(from.lat * 1000 + to.lng * 1000) % 100;
    let trafficStatus: TrafficStatus;
    if (seed < 30) trafficStatus = 'heavy';
    else if (seed < 60) trafficStatus = 'moderate';
    else trafficStatus = 'clear';

    const baseSpeedKmH = 30;
    const trafficMultiplier = trafficStatus === 'heavy' ? 0.5 : trafficStatus === 'moderate' ? 0.75 : 1;
    const effectiveSpeed = baseSpeedKmH * trafficMultiplier;
    const time = Math.max(1, Math.round((distance / effectiveSpeed) * 60));

    return { distance: Math.round(distance * 10) / 10, time, trafficStatus };
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

// ============================================
// DONOR GENERATION (Demo)
// ============================================

/**
 * Generate fake donors around a center location using H3
 * DETERMINISTIC: Uses pseudo-random based on index for stable demo
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

    const pseudoRandom = (seed: number): number => {
        return Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % 1;
    };

    const centerH3 = h3.latLngToCell(centerLocation.lat, centerLocation.lng, H3_RESOLUTION_PRIVACY);
    const allCells = h3.gridDisk(centerH3, 4);
    const sortedCells = [...allCells].sort();

    const donors: Donor[] = [];
    for (let i = 0; i < count; i++) {
        const cellIndex = i % sortedCells.length;
        const h3Cell = sortedCells[cellIndex];
        const center = h3.cellToLatLng(h3Cell);

        const offsetScale = 0.003 + (pseudoRandom(i * 3) * 0.005);
        const lat = center[0] + (pseudoRandom(i * 7) - 0.5) * offsetScale;
        const lng = center[1] + (pseudoRandom(i * 13) - 0.5) * offsetScale;

        const trafficStatus = trafficStatuses[i % trafficStatuses.length];
        const baseTime = 5 + (i * 2) % 15;
        const trafficMultiplier = trafficStatus === 'heavy' ? 1.5 : trafficStatus === 'moderate' ? 1.2 : 1;

        const status: DonorStatus = (i % 5 === 3) ? 'inactive' : 'active';
        const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
        const lastName = LAST_NAMES[i % LAST_NAMES.length];

        donors.push({
            id: `donor-${i + 1}`,
            name: `${firstName} ${lastName}`,
            bloodType: ALL_BLOOD_TYPES[i % ALL_BLOOD_TYPES.length],
            status,
            availability: status === 'active',
            location: { lat, lng },
            h3Index: getH3Index({ lat, lng }),
            geohash: encodeGeohash({ lat, lng }, GEOHASH_PRECISION),
            trafficStatus,
            estimatedTime: Math.round(baseTime * trafficMultiplier),
        });
    }

    return donors;
}

// ============================================
// DONOR SELECTION ENGINE
// ============================================

/**
 * Sort donors by distance from hospital (nearest first)
 *
 * Time Complexity: O(n log n)
 * Space Complexity: O(n)
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
 */
export function filterReachableDonors(
    donors: Donor[],
    hospitalLocation: Location,
    radiusKm: number = MAX_REACHABILITY_RADIUS_KM
): Donor[] {
    return donors.filter(donor => {
        const isAvailable = donor.status === 'active' || donor.availability === true;
        const distance = calculateDistance(donor.location, hospitalLocation);
        const isWithinRadius = distance <= radiusKm;
        return isAvailable && isWithinRadius;
    });
}

/**
 * COMPLETE DONOR SELECTION PIPELINE
 *
 * Implements the 6-step pipeline from the capstone prompt:
 * 1. Emergency request received
 * 2. Spatial filtering (geohash-based)
 * 3. Haversine distance computation
 * 4. Eligibility constraints (blood type + availability + radius)
 * 5. Ranking by distance (ascending)
 * 6. Return ranked donor list
 *
 * Returns both structured SelectionLog and string-array PipelineLog.
 */
export function getPrioritizedDonors(
    donors: Donor[],
    hospitalLocation: Location,
    requestedBloodType: BloodType,
    radiusKm: number = MAX_REACHABILITY_RADIUS_KM
): { prioritized: Donor[]; log: SelectionLog; pipelineLogs: PipelineLog } {

    const pipelineLogs: PipelineLog = [];
    const totalDonors = donors.length;

    // Step 1 — Emergency request received
    pipelineLogs.push('Emergency request received');

    // Step 2 — Spatial filtering (geohash grouping)
    const hospitalGeohash = encodeGeohash(hospitalLocation, GEOHASH_PRECISION);
    const spatialFiltered = donors.filter(d => {
        if (!d.geohash) return true; // include if no geohash
        return d.geohash.substring(0, 3) === hospitalGeohash.substring(0, 3);
    });
    pipelineLogs.push(`Spatial filtering applied — ${spatialFiltered.length} candidates from ${totalDonors} total`);

    // Step 3 — Haversine distance computed
    const withDistance = spatialFiltered.map(donor => ({
        ...donor,
        distance: calculateDistance(donor.location, hospitalLocation),
    }));
    pipelineLogs.push('Haversine distance computed');

    // Step 4 — Eligibility constraints
    const eligible = withDistance.filter(d =>
        canDonateToType(d.bloodType, requestedBloodType) &&
        (d.status === 'active' || d.availability === true) &&
        (d.distance ?? Infinity) <= radiusKm
    );
    pipelineLogs.push(`Eligibility constraints applied — ${eligible.length} eligible donors`);

    // Step 5 — Ranking by distance (ascending)
    const sorted = [...eligible].sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    pipelineLogs.push('Donors ranked by distance');

    // Step 6 — Compute statistics
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
        spatialFiltered: spatialFiltered.length,
        withinRadius: eligible.length,
        compatible: eligible.length,
        sorted: true,
        nearestDistanceKm,
        farthestDistanceKm,
        averageDistanceKm,
    };

    return { prioritized: sorted, log, pipelineLogs };
}
