/**
 * Donor Identity System
 * Auto-generates and persists unique donor profiles
 */

import type { BloodType } from '@/types';

export interface DonorIdentity {
    id: string;
    username: string;        // Shown before hospital accepts (e.g., "Donor_A3X")
    realName: string;        // Shown after hospital accepts
    bloodType: BloodType;
    avatarSeed: string;      // For generating consistent random avatar
    donationCount: number;
    donationHistory: DonationRecord[];
    createdAt: string;
}

export interface DonationRecord {
    id: string;
    date: string;
    hospitalName: string;
    bloodType: BloodType;
}

const STORAGE_KEY = 'lifestream_donor_identity';

// First names for random generation
const FIRST_NAMES = [
    'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan',
    'Ananya', 'Diya', 'Priya', 'Saanvi', 'Aanya', 'Ishita', 'Kavya', 'Meera',
    'Rahul', 'Amit', 'Vikram', 'Rohan', 'Sneha', 'Pooja', 'Neha', 'Riya'
];

const LAST_NAMES = [
    'Sharma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Reddy', 'Nair', 'Iyer',
    'Verma', 'Joshi', 'Rao', 'Mehta', 'Shah', 'Kapoor', 'Malhotra', 'Bhat'
];

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Sample donation history for demo
const SAMPLE_HOSPITALS = [
    'City General Hospital',
    'Apollo Medical Center',
    'Fortis Healthcare',
    'Max Super Specialty',
    'AIIMS Hospital',
    'Manipal Hospital'
];

/**
 * Generate a random alphanumeric string
 */
function generateId(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Generate a random username (e.g., "Donor_A3X7K")
 */
function generateUsername(): string {
    return `Donor_${generateId(5)}`;
}

/**
 * Generate a random real name
 */
function generateRealName(): string {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    return `${firstName} ${lastName}`;
}

/**
 * Generate random donation history (0-5 past donations)
 */
function generateDonationHistory(bloodType: BloodType): DonationRecord[] {
    const count = Math.floor(Math.random() * 6); // 0-5 donations
    const history: DonationRecord[] = [];

    for (let i = 0; i < count; i++) {
        const daysAgo = Math.floor(Math.random() * 365) + 30; // 30-395 days ago
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);

        history.push({
            id: `donation-${generateId(6)}`,
            date: date.toISOString().split('T')[0],
            hospitalName: SAMPLE_HOSPITALS[Math.floor(Math.random() * SAMPLE_HOSPITALS.length)],
            bloodType,
        });
    }

    // Sort by date descending
    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Create a new donor identity
 */
function createNewIdentity(): DonorIdentity {
    const bloodType = BLOOD_TYPES[Math.floor(Math.random() * BLOOD_TYPES.length)];
    const donationHistory = generateDonationHistory(bloodType);

    return {
        id: `donor_${generateId(8).toLowerCase()}`,
        username: generateUsername(),
        realName: generateRealName(),
        bloodType,
        avatarSeed: generateId(10),
        donationCount: donationHistory.length,
        donationHistory,
        createdAt: new Date().toISOString(),
    };
}

/**
 * Get or create donor identity
 * Returns existing identity from localStorage or creates new one
 */
export function getDonorIdentity(): DonorIdentity {
    if (typeof window === 'undefined') {
        // SSR fallback
        return createNewIdentity();
    }

    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            // Invalid stored data, create new
        }
    }

    // Create and store new identity
    const identity = createNewIdentity();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
    return identity;
}

/**
 * Add a new donation to history
 */
export function addDonationRecord(hospitalName: string): DonorIdentity {
    const identity = getDonorIdentity();

    const newRecord: DonationRecord = {
        id: `donation-${generateId(6)}`,
        date: new Date().toISOString().split('T')[0],
        hospitalName,
        bloodType: identity.bloodType,
    };

    identity.donationHistory.unshift(newRecord);
    identity.donationCount = identity.donationHistory.length;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
    return identity;
}

/**
 * Clear donor identity (for testing)
 */
export function clearDonorIdentity(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
    }
}

/**
 * Generate avatar URL using DiceBear API
 */
export function getAvatarUrl(seed: string): string {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}
