/**
 * Do Not Disturb (DND) System
 * Manages DND state and timer
 */

const STORAGE_KEY_DND = 'lifestream_dnd_state';

export interface DNDState {
    isActive: boolean;
    endTime: number | null; // Unix timestamp when DND ends
}

/**
 * Get current DND state
 */
export function getDNDState(): DNDState {
    if (typeof window === 'undefined') {
        return { isActive: false, endTime: null };
    }

    const stored = localStorage.getItem(STORAGE_KEY_DND);

    if (stored) {
        try {
            const state: DNDState = JSON.parse(stored);

            // Check if DND has expired
            if (state.isActive && state.endTime && Date.now() > state.endTime) {
                // DND expired, clear it
                clearDND();
                return { isActive: false, endTime: null };
            }

            return state;
        } catch {
            return { isActive: false, endTime: null };
        }
    }

    return { isActive: false, endTime: null };
}

/**
 * Enable DND for specified duration
 * @param durationMs Duration in milliseconds (max 3 hours = 10800000ms)
 */
export function enableDND(durationMs: number): DNDState {
    const maxDuration = 3 * 60 * 60 * 1000; // 3 hours
    const actualDuration = Math.min(durationMs, maxDuration);

    const state: DNDState = {
        isActive: true,
        endTime: Date.now() + actualDuration,
    };

    localStorage.setItem(STORAGE_KEY_DND, JSON.stringify(state));
    return state;
}

/**
 * Disable DND
 */
export function clearDND(): DNDState {
    const state: DNDState = { isActive: false, endTime: null };
    localStorage.setItem(STORAGE_KEY_DND, JSON.stringify(state));
    return state;
}

/**
 * Get remaining time in DND
 * Returns { hours, minutes, seconds } or null if not active
 */
export function getRemainingTime(endTime: number | null): { hours: number; minutes: number; seconds: number } | null {
    if (!endTime) return null;

    const remaining = endTime - Date.now();
    if (remaining <= 0) return null;

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
}

/**
 * Format remaining time as string (HH:MM:SS)
 */
export function formatRemainingTime(endTime: number | null): string {
    const time = getRemainingTime(endTime);
    if (!time) return '00:00:00';

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(time.hours)}:${pad(time.minutes)}:${pad(time.seconds)}`;
}
