/**
 * Donor Model (Mobile App)
 */

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface Location {
    lat: number;
    lng: number;
}

export interface Donor {
    id: string;
    name: string;
    bloodType: BloodType;
    latitude: number;
    longitude: number;
    availability: boolean;
}
