/**
 * Blood Type Compatibility Service
 *
 * Standard red blood cell compatibility matrix.
 * Compatibility is donor → recipient direction.
 *
 * Used by:
 * - Geo service: filtering compatible donors in prioritization pipeline
 * - Donor UI: client-side gating before showing alerts
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
    if (donorType === 'O-') return true;
    if (donorType === requestedType) return true;
    if (donorType === 'O+' && requestedType.includes('+')) return true;
    if (donorType === 'A-' && ['A+', 'A-', 'AB+', 'AB-'].includes(requestedType)) return true;
    if (donorType === 'A+' && ['A+', 'AB+'].includes(requestedType)) return true;
    if (donorType === 'B-' && ['B+', 'B-', 'AB+', 'AB-'].includes(requestedType)) return true;
    if (donorType === 'B+' && ['B+', 'AB+'].includes(requestedType)) return true;
    if (donorType === 'AB-' && ['AB+', 'AB-'].includes(requestedType)) return true;
    if (donorType === 'AB+' && requestedType === 'AB+') return true;
    return false;
}
