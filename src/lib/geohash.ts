/**
 * Geohash Utility for Spatial Indexing
 * 
 * ACADEMIC CONTEXT:
 * ================
 * Geohash is used as a SPATIAL INDEX to reduce search space.
 * This implementation complements the H3 hexagonal grid already in use.
 * 
 * ROLE DISTINCTION:
 * - Geohash (precision=5): Used for conceptual spatial filtering
 *   → Encodes location into ~5km × 5km grid cells
 *   → Enables prefix-based range queries
 *   → Suitable for initial candidate filtering
 * 
 * - H3 Hexagons: Used for privacy zones and UI visualization
 *   → Displays approximate donor locations to protect privacy
 *   → Better for map rendering and visual grouping
 * 
 * PRECISION LEVELS:
 * - Precision 1: ~5,000km
 * - Precision 2: ~1,250km
 * - Precision 3: ~156km
 * - Precision 4: ~39km
 * - Precision 5: ~5km (CHOSEN - optimal for city-level emergency response)
 * - Precision 6: ~1.2km
 * - Precision 7: ~153m
 * 
 * REFERENCE: https://en.wikipedia.org/wiki/Geohash
 */

import type { Location } from '@/types';

// Base32 character set used by geohash encoding
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

// Geohash precision for this application (fixed at 5)
export const GEOHASH_PRECISION = 5;

/**
 * Encode latitude/longitude to geohash string
 * 
 * Algorithm:
 * 1. Alternate between longitude and latitude bits
 * 2. Bisect the range and set bit based on position
 * 3. Group bits into 5-bit chunks → base32 characters
 * 
 * Time Complexity: O(p) where p = precision
 * Space Complexity: O(p)
 * 
 * @param location - { lat, lng } coordinates
 * @param precision - Number of characters in geohash (default: 5)
 * @returns Geohash string of specified precision
 */
export function encodeGeohash(location: Location, precision: number = GEOHASH_PRECISION): string {
    const { lat, lng } = location;

    let minLat = -90, maxLat = 90;
    let minLng = -180, maxLng = 180;

    let hash = '';
    let bit = 0;
    let ch = 0;
    let isLng = true; // Start with longitude

    while (hash.length < precision) {
        if (isLng) {
            // Bisect longitude range
            const mid = (minLng + maxLng) / 2;
            if (lng >= mid) {
                ch = ch | (1 << (4 - bit));
                minLng = mid;
            } else {
                maxLng = mid;
            }
        } else {
            // Bisect latitude range
            const mid = (minLat + maxLat) / 2;
            if (lat >= mid) {
                ch = ch | (1 << (4 - bit));
                minLat = mid;
            } else {
                maxLat = mid;
            }
        }

        isLng = !isLng; // Alternate between lng and lat
        bit++;

        // Every 5 bits, output a character
        if (bit === 5) {
            hash += BASE32[ch];
            bit = 0;
            ch = 0;
        }
    }

    return hash;
}

/**
 * Decode geohash string back to approximate location (center of cell)
 * 
 * @param geohash - Geohash string to decode
 * @returns Location at center of geohash cell
 */
export function decodeGeohash(geohash: string): Location {
    let minLat = -90, maxLat = 90;
    let minLng = -180, maxLng = 180;
    let isLng = true;

    for (const char of geohash.toLowerCase()) {
        const idx = BASE32.indexOf(char);
        if (idx === -1) continue;

        for (let bit = 4; bit >= 0; bit--) {
            const bitValue = (idx >> bit) & 1;

            if (isLng) {
                const mid = (minLng + maxLng) / 2;
                if (bitValue === 1) {
                    minLng = mid;
                } else {
                    maxLng = mid;
                }
            } else {
                const mid = (minLat + maxLat) / 2;
                if (bitValue === 1) {
                    minLat = mid;
                } else {
                    maxLat = mid;
                }
            }

            isLng = !isLng;
        }
    }

    return {
        lat: (minLat + maxLat) / 2,
        lng: (minLng + maxLng) / 2,
    };
}

/**
 * Check if two geohashes share a common prefix
 * Used for determining spatial proximity before exact distance calculation
 * 
 * METHODOLOGY:
 * - Longer common prefix = closer locations
 * - At precision 5, same geohash means within ~5km
 * - This enables efficient candidate filtering
 * 
 * @param geohash1 - First geohash string
 * @param geohash2 - Second geohash string
 * @param minPrefixLength - Minimum prefix length to consider "nearby" (default: 4)
 * @returns true if geohashes share the minimum prefix
 */
export function areGeohashesNearby(
    geohash1: string,
    geohash2: string,
    minPrefixLength: number = 4
): boolean {
    if (!geohash1 || !geohash2) return false;
    return geohash1.substring(0, minPrefixLength) === geohash2.substring(0, minPrefixLength);
}

/**
 * Get geohash with encoded precision information for storage
 * This is the primary function to use when storing donor/request locations
 * 
 * @param location - { lat, lng } coordinates
 * @returns Object containing geohash and metadata
 */
export function createGeohashData(location: Location) {
    const geohash = encodeGeohash(location, GEOHASH_PRECISION);
    return {
        geohash,
        precision: GEOHASH_PRECISION,
        // First 3 chars = ~39km region (coarse filter)
        region: geohash.substring(0, 3),
    };
}
