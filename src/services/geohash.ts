/**
 * Geohash Service — Spatial Indexing
 *
 * ACADEMIC CONTEXT:
 * Geohash encodes a geographic location into a short string of letters/digits.
 * Used as a SPATIAL INDEX to reduce search space before exact distance calculation.
 *
 * PRECISION LEVELS:
 * - Precision 5: ~5km × 5km cells (CHOSEN — optimal for city-level emergency response)
 *
 * REFERENCE: https://en.wikipedia.org/wiki/Geohash
 */

import type { Location } from '@/models/donor';

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

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
 */
export function encodeGeohash(location: Location, precision: number = GEOHASH_PRECISION): string {
    const { lat, lng } = location;

    let minLat = -90, maxLat = 90;
    let minLng = -180, maxLng = 180;

    let hash = '';
    let bit = 0;
    let ch = 0;
    let isLng = true;

    while (hash.length < precision) {
        if (isLng) {
            const mid = (minLng + maxLng) / 2;
            if (lng >= mid) {
                ch = ch | (1 << (4 - bit));
                minLng = mid;
            } else {
                maxLng = mid;
            }
        } else {
            const mid = (minLat + maxLat) / 2;
            if (lat >= mid) {
                ch = ch | (1 << (4 - bit));
                minLat = mid;
            } else {
                maxLat = mid;
            }
        }

        isLng = !isLng;
        bit++;

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
                if (bitValue === 1) { minLng = mid; } else { maxLng = mid; }
            } else {
                const mid = (minLat + maxLat) / 2;
                if (bitValue === 1) { minLat = mid; } else { maxLat = mid; }
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
 * Check if two geohashes share a common prefix (spatial proximity check)
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
 * Create geohash data for storage
 */
export function createGeohashData(location: Location) {
    const geohash = encodeGeohash(location, GEOHASH_PRECISION);
    return {
        geohash,
        precision: GEOHASH_PRECISION,
        region: geohash.substring(0, 3),
    };
}
