/**
 * Emergency Request Model
 * 
 * Data types for emergency blood requests, donor responses,
 * selection engine results, and pipeline execution logs.
 */

import type { BloodType, Location } from './donor';

export interface EmergencyRequest {
    id: string;
    hospitalId: string;
    hospitalName: string;
    hospitalLocation: Location;
    hospitalGeohash?: string;
    bloodType: BloodType;
    searchRadius: number;
    urgency: 'critical' | 'urgent' | 'normal';
    status: 'pending' | 'scanning' | 'active' | 'fulfilled' | 'cancelled';
    createdAt: Date;
    respondingDonors: string[];
}

export interface DonorResponse {
    donorId: string;
    requestId: string;
    accepted: boolean;
    liveLocation?: Location;
    donorName?: string;
}

/**
 * Structured selection log with detailed metrics
 */
export interface SelectionLog {
    totalDonors: number;
    spatialFiltered: number;
    withinRadius: number;
    compatible: number;
    sorted: boolean;
    nearestDistanceKm: number | null;
    farthestDistanceKm: number | null;
    averageDistanceKm: number | null;
}

/**
 * Pipeline execution logs as string array (per capstone prompt)
 * These are displayed in the hospital dashboard.
 */
export type PipelineLog = string[];

export interface SelectionResult {
    requestId: string;
    rankedDonors: Array<{
        rank: number;
        donorId: string;
        donorName: string;
        bloodGroup: string;
        distance: number;
        availability: boolean;
    }>;
    pipelineLogs: PipelineLog;
    selectionLog: SelectionLog;
}

export interface DonorSelection {
    requestId: string;
    selectedDonorIds: string[];
    timestamp: number;
}
