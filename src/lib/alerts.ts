/**
 * Alert utilities for Amber Alert effects
 * VIBRATION ONLY - no sound as per user request
 */

let vibrationIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * No-op function - sound removed per user request
 */
export function playAlertSound(): () => void {
    // Sound removed - return empty cleanup function
    return () => { };
}

/**
 * Trigger continuous phone vibration pattern for mobile
 * Uses repeating pattern for urgent feel
 */
export function triggerVibration(): boolean {
    if (typeof navigator === 'undefined' || !navigator.vibrate) {
        console.warn('Vibration API not supported');
        return false;
    }

    try {
        // Clear any existing vibration
        stopVibration();

        // Emergency vibration pattern: urgent pulsing
        const pattern = [300, 100, 300, 100, 500, 200];

        // Start vibration
        navigator.vibrate(pattern);

        // Repeat vibration every 1.5 seconds
        vibrationIntervalId = setInterval(() => {
            if (navigator.vibrate) {
                navigator.vibrate(pattern);
            }
        }, 1500);

        return true;
    } catch {
        console.warn('Vibration failed');
        return false;
    }
}

/**
 * Stop vibration
 */
export function stopVibration(): void {
    if (vibrationIntervalId) {
        clearInterval(vibrationIntervalId);
        vibrationIntervalId = null;
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(0);
    }
}

/**
 * Generate random traffic status and time
 */
export function getRandomTrafficStatus(): { status: 'heavy' | 'moderate' | 'clear'; time: number } {
    const rand = Math.random();
    if (rand < 0.3) {
        return { status: 'heavy', time: Math.floor(Math.random() * 5) + 12 };
    } else if (rand < 0.6) {
        return { status: 'moderate', time: Math.floor(Math.random() * 4) + 8 };
    } else {
        return { status: 'clear', time: Math.floor(Math.random() * 4) + 5 };
    }
}
