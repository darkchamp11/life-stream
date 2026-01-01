/**
 * Blood Donation App Types
 * 
 * SPATIAL INDEXING:
 * - geohash: Used for spatial filtering (prefix-based range queries)
 * - h3Index: Used for privacy zones (approximate location display)
 */

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type TrafficStatus = 'heavy' | 'moderate' | 'clear';

export type DonorStatus = 'active' | 'inactive' | 'responding' | 'accepted' | 'declined';

export interface Location {
    lat: number;
    lng: number;
}

export interface Donor {
    id: string;
    name: string;
    bloodType: BloodType;
    status: DonorStatus;
    location: Location;
    h3Index: string;         // H3 hexagon for privacy zones
    geohash?: string;        // Geohash (precision=5) for spatial filtering
    trafficStatus: TrafficStatus;
    estimatedTime: number;   // in minutes
    distance?: number;       // Distance from hospital in km (for prioritization)
}

export interface Hospital {
    id: string;
    name: string;
    location: Location;
}

export interface BloodRequest {
    id: string;
    hospitalId: string;
    hospitalName: string;
    hospitalLocation: Location;
    hospitalGeohash?: string;   // Geohash of hospital for proximity queries
    bloodType: BloodType;
    urgency: 'critical' | 'urgent' | 'normal';
    status: 'pending' | 'scanning' | 'active' | 'fulfilled' | 'cancelled';
    createdAt: Date;
    respondingDonors: string[]; // donor IDs who accepted
}

export interface DonorResponse {
    donorId: string;
    requestId: string;
    accepted: boolean;
    liveLocation?: Location;
}

export type UserRole = 'hospital' | 'donor' | null;

