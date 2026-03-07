/**
 * Donor Model
 * 
 * Core data types for blood donors in the LifeStream system.
 * Used across services, viewmodels, and views.
 */

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type DonorStatus = 'active' | 'inactive' | 'responding' | 'accepted' | 'declined';

export type TrafficStatus = 'heavy' | 'moderate' | 'clear';

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
    availability: boolean;
    h3Index?: string;
    geohash?: string;
    trafficStatus?: TrafficStatus;
    estimatedTime?: number;
    distance?: number;
}
