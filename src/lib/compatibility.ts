/**
 * Blood Type Compatibility Module
 *
 * Standard red blood cell compatibility matrix.
 * Compatibility is donor → recipient direction.
 *
 * Used by:
 * - Engine (geo.ts): filtering compatible donors in prioritization pipeline
 * - Donor UI (donor/page.tsx): client-side gating before showing alerts
 */

/**
 * Check if a donor blood type can donate to a requested blood type.
 *
 * Implements the standard RBC compatibility rules:
 * - O- is universal donor
 * - AB+ is universal recipient
 * - Rh- can donate to same-group Rh+ and Rh-
 * - Same type always compatible
 */
export function canDonateToType(donorType: string, requestedType: string): boolean {
    // Universal donor
    if (donorType === 'O-') return true;
    // Same type
    if (donorType === requestedType) return true;
    // O+ can donate to positive types
    if (donorType === 'O+' && requestedType.includes('+')) return true;
    // A- can donate to A and AB
    if (donorType === 'A-' && (requestedType === 'A+' || requestedType === 'A-' || requestedType === 'AB+' || requestedType === 'AB-')) return true;
    // A+ can donate to A+ and AB+
    if (donorType === 'A+' && (requestedType === 'A+' || requestedType === 'AB+')) return true;
    // B- can donate to B and AB
    if (donorType === 'B-' && (requestedType === 'B+' || requestedType === 'B-' || requestedType === 'AB+' || requestedType === 'AB-')) return true;
    // B+ can donate to B+ and AB+
    if (donorType === 'B+' && (requestedType === 'B+' || requestedType === 'AB+')) return true;
    // AB- can donate to AB
    if (donorType === 'AB-' && (requestedType === 'AB+' || requestedType === 'AB-')) return true;
    // AB+ can only donate to AB+
    if (donorType === 'AB+' && requestedType === 'AB+') return true;

    return false;
}
