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
import type { Location, Donor, BloodType, TrafficStatus } from '@/types';
import { encodeGeohash, GEOHASH_PRECISION } from './geohash';

// H3 resolution: 7 = ~5km cells (privacy), 9 = ~200m cells (after accept)
const H3_RESOLUTION_PRIVACY = 7;
const H3_RESOLUTION_PRECISE = 9;

/**
 * Get user's current location using Geolocation API
 * Falls back to a default location for development (when HTTPS not available)
 */
export function getCurrentLocation(): Promise<Location> {
    // Default fallback location (Bangalore, India - for demo)
    const FALLBACK_LOCATION: Location = {
        lat: 12.9716,
        lng: 77.5946,
    };

    return new Promise((resolve, reject) => {
        // Check if we're in a secure context (HTTPS) or localhost
        const isSecure = typeof window !== 'undefined' &&
            (window.location.protocol === 'https:' ||
                window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1');

        if (!navigator.geolocation) {
            console.warn('Geolocation not supported, using fallback location');
            resolve(FALLBACK_LOCATION);
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
                // On error (permission denied, or HTTP on mobile), use fallback
                console.warn('Geolocation error, using fallback:', error.message);
                resolve(FALLBACK_LOCATION);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
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
 */
export function generateFakeDonors(centerLocation: Location, count = 5): Donor[] {
    const names = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Gupta', 'Vikram Singh'];
    const bloodTypes: BloodType[] = ['A+', 'B+', 'O+', 'AB+', 'O-'];
    const trafficStatuses: TrafficStatus[] = ['heavy', 'moderate', 'clear'];

    // Get the center H3 cell and its neighbors
    const centerH3 = h3.latLngToCell(centerLocation.lat, centerLocation.lng, H3_RESOLUTION_PRIVACY);
    const neighborCells = h3.gridDisk(centerH3, 2); // Get cells within 2 rings

    // Shuffle and pick cells for donors
    const shuffledCells = neighborCells.sort(() => Math.random() - 0.5).slice(0, count);

    return shuffledCells.map((h3Index, i) => {
        const center = h3.cellToLatLng(h3Index);
        // Add slight random offset within the cell
        const offset = 0.002;
        const lat = center[0] + (Math.random() - 0.5) * offset;
        const lng = center[1] + (Math.random() - 0.5) * offset;

        const trafficStatus = trafficStatuses[Math.floor(Math.random() * trafficStatuses.length)];
        const baseTime = Math.floor(Math.random() * 10) + 5; // 5-15 mins base
        const trafficMultiplier = trafficStatus === 'heavy' ? 1.5 : trafficStatus === 'moderate' ? 1.2 : 1;

        return {
            id: `donor-${i + 1}`,
            name: names[i],
            bloodType: bloodTypes[i],
            status: 'active' as const,
            location: { lat, lng },
            h3Index: getH3Index({ lat, lng }),
            geohash: encodeGeohash({ lat, lng }, GEOHASH_PRECISION), // Geohash for spatial filtering
            trafficStatus,
            estimatedTime: Math.round(baseTime * trafficMultiplier),
        };
    });
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
 * - Filters by MAX_REACHABILITY_RADIUS_KM
 * - Checks donor availability status
 * 
 * @param donors - Array of donors to filter
 * @param hospitalLocation - Hospital's location
 * @returns Donors within reachability radius and available status
 */
export function filterReachableDonors(donors: Donor[], hospitalLocation: Location): Donor[] {
    return donors.filter(donor => {
        // Check availability status
        const isAvailable = donor.status === 'active';

        // Calculate exact distance
        const distance = calculateDistance(donor.location, hospitalLocation);
        const isWithinRadius = distance <= MAX_REACHABILITY_RADIUS_KM;

        return isAvailable && isWithinRadius;
    });
}

/**
 * Get prioritized reachable donors (combined filter + sort)
 * 
 * COMPLETE PRIORITIZATION PIPELINE:
 * 1. Filter by availability status
 * 2. Filter by reachability radius
 * 3. Sort by distance (nearest first)
 * 
 * @param donors - All candidate donors
 * @param hospitalLocation - Hospital's location
 * @returns Prioritized list of reachable donors
 */
export function getPrioritizedDonors(donors: Donor[], hospitalLocation: Location): Donor[] {
    const reachable = filterReachableDonors(donors, hospitalLocation);
    return sortDonorsByDistance(reachable, hospitalLocation);
}
