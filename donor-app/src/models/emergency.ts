/**
 * Emergency Model (Mobile App)
 */

import type { BloodType, Location } from './donor';

export interface EmergencyRequest {
    id: string;
    hospitalId: string;
    hospitalName: string;
    hospitalLocation: Location;
    bloodType: BloodType;
    searchRadius: number;
    urgency: 'critical' | 'urgent' | 'normal';
    status: string;
    createdAt: string;
    timestamp: number;
}

export interface DonorResponse {
    donorId: string;
    requestId: string;
    accepted: boolean;
    liveLocation?: Location;
    donorName?: string;
}
