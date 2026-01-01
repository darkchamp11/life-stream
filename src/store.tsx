'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Donor, BloodRequest, UserRole, Location, BloodType } from '@/types';

interface AppState {
    // User role
    role: UserRole;
    setRole: (role: UserRole) => void;

    // Hospital location
    hospitalLocation: Location | null;
    setHospitalLocation: (location: Location) => void;

    // Donors
    donors: Donor[];
    setDonors: (donors: Donor[]) => void;
    updateDonorStatus: (donorId: string, status: Donor['status'], liveLocation?: Location) => void;

    // Current donor (when logged in as donor)
    currentDonor: Donor | null;
    setCurrentDonor: (donor: Donor | null) => void;

    // Blood requests
    activeRequest: BloodRequest | null;
    createRequest: (bloodType: BloodType) => void;
    cancelRequest: () => void;

    // Donor live locations (after they accept)
    donorLiveLocations: Record<string, Location>;
    updateDonorLiveLocation: (donorId: string, location: Location) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
    const [role, setRole] = useState<UserRole>(null);
    const [hospitalLocation, setHospitalLocation] = useState<Location | null>(null);
    const [donors, setDonors] = useState<Donor[]>([]);
    const [currentDonor, setCurrentDonor] = useState<Donor | null>(null);
    const [activeRequest, setActiveRequest] = useState<BloodRequest | null>(null);
    const [donorLiveLocations, setDonorLiveLocations] = useState<Record<string, Location>>({});

    const updateDonorStatus = useCallback((donorId: string, status: Donor['status'], liveLocation?: Location) => {
        setDonors((prev) =>
            prev.map((d) => (d.id === donorId ? { ...d, status, location: liveLocation ?? d.location } : d))
        );
        if (liveLocation) {
            setDonorLiveLocations((prev) => ({ ...prev, [donorId]: liveLocation }));
        }
    }, []);

    const createRequest = useCallback((bloodType: BloodType) => {
        const request: BloodRequest = {
            id: `req-${Date.now()}`,
            hospitalId: 'hospital-1',
            hospitalName: 'City General Hospital',
            hospitalLocation: hospitalLocation!,
            bloodType,
            urgency: 'critical',
            status: 'scanning',
            createdAt: new Date(),
            respondingDonors: [],
        };
        setActiveRequest(request);

        // After 3 seconds, change status to active (simulating scan)
        setTimeout(() => {
            setActiveRequest((prev) => (prev ? { ...prev, status: 'active' } : null));
        }, 3000);
    }, [hospitalLocation]);

    const cancelRequest = useCallback(() => {
        setActiveRequest(null);
        // Reset all donors to active
        setDonors((prev) => prev.map((d) => ({ ...d, status: 'active' as const })));
        setDonorLiveLocations({});
    }, []);

    const updateDonorLiveLocation = useCallback((donorId: string, location: Location) => {
        setDonorLiveLocations((prev) => ({ ...prev, [donorId]: location }));
    }, []);

    return (
        <AppContext.Provider
            value={{
                role,
                setRole,
                hospitalLocation,
                setHospitalLocation,
                donors,
                setDonors,
                updateDonorStatus,
                currentDonor,
                setCurrentDonor,
                activeRequest,
                createRequest,
                cancelRequest,
                donorLiveLocations,
                updateDonorLiveLocation,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}
