'use client';

/**
 * Donor Simulator Panel
 * 
 * Allows hospital staff to:
 * - View current demo donors
 * - Add new donors with custom blood type and location
 * - Login as a donor to test the donor view
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Donor, BloodType, Location, DonorStatus } from '@/types';
import { getH3Index, calculateETA } from '@/lib/geo';

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface DonorSimulatorProps {
    donors: Donor[];
    hospitalLocation: Location;
    onAddDonor: (donor: Donor) => void;
    onRemoveDonor: (donorId: string) => void;
}

export default function DonorSimulator({
    donors,
    hospitalLocation,
    onAddDonor,
    onRemoveDonor,
}: DonorSimulatorProps) {
    const [selectedBloodType, setSelectedBloodType] = useState<BloodType>('O+');
    const [distanceKm, setDistanceKm] = useState('5');
    const [isAdding, setIsAdding] = useState(false);

    const handleAddDonor = () => {
        const distance = parseFloat(distanceKm) || 5;

        // Generate a location at approximately the specified distance
        // Using a random angle
        const angle = Math.random() * 2 * Math.PI;
        const latOffset = (distance / 111) * Math.cos(angle);
        const lngOffset = (distance / (111 * Math.cos(hospitalLocation.lat * Math.PI / 180))) * Math.sin(angle);

        const donorLocation: Location = {
            lat: hospitalLocation.lat + latOffset,
            lng: hospitalLocation.lng + lngOffset,
        };

        const newDonor: Donor = {
            id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: `Donor_${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
            bloodType: selectedBloodType,
            status: 'active' as DonorStatus,
            location: donorLocation,
            h3Index: getH3Index(donorLocation),
            trafficStatus: 'clear',
            estimatedTime: Math.round(distance * 2 + Math.random() * 5),
        };

        // Store donor in sessionStorage for demo page to access
        const demoDonors = JSON.parse(sessionStorage.getItem('lifestream_demo_donors') || '{}');
        demoDonors[newDonor.id] = newDonor;
        sessionStorage.setItem('lifestream_demo_donors', JSON.stringify(demoDonors));

        onAddDonor(newDonor);
        setIsAdding(false);
    };

    const handleLoginAsDonor = (donor: Donor) => {
        // Store this donor's data for the demo page to access
        const demoDonors = JSON.parse(sessionStorage.getItem('lifestream_demo_donors') || '{}');
        demoDonors[donor.id] = donor;
        sessionStorage.setItem('lifestream_demo_donors', JSON.stringify(demoDonors));

        // Open donor view in new tab with demo mode and donor ID
        const url = `/donor?demo=true&donorId=${donor.id}`;
        window.open(url, '_blank');
    };

    return (
        <details className="group mb-4">
            <summary className="flex items-center justify-between cursor-pointer text-zinc-300 text-sm p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 transition-colors">
                <div className="flex items-center gap-2">
                    <span className="text-lg">👥</span>
                    <span className="font-medium">Donor Simulator (Demo)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                        {donors.length} donors
                    </span>
                    <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </summary>

            <Card className="mt-2 bg-zinc-900/80 border-zinc-700/50">
                <CardContent className="p-4 space-y-4">
                    {/* Current Donors List */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm text-zinc-400">Demo Donors</label>
                            <Button
                                size="sm"
                                onClick={() => setIsAdding(!isAdding)}
                                className="text-xs bg-blue-600 hover:bg-blue-700"
                            >
                                {isAdding ? 'Cancel' : '+ Add Donor'}
                            </Button>
                        </div>

                        {/* Add Donor Form */}
                        {isAdding && (
                            <div className="p-3 mb-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 space-y-3">
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Blood Type</label>
                                    <div className="grid grid-cols-4 gap-1">
                                        {BLOOD_TYPES.map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setSelectedBloodType(type)}
                                                className={`py-1.5 rounded text-xs font-bold transition-all ${selectedBloodType === type
                                                    ? 'bg-red-500 text-white'
                                                    : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Distance from Hospital (km)</label>
                                    <input
                                        type="number"
                                        value={distanceKm}
                                        onChange={(e) => setDistanceKm(e.target.value)}
                                        min="1"
                                        max="50"
                                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <Button
                                    onClick={handleAddDonor}
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    size="sm"
                                >
                                    Create Donor
                                </Button>
                            </div>
                        )}

                        {/* Donors List */}
                        {donors.length === 0 ? (
                            <p className="text-center text-zinc-500 text-sm py-4">No demo donors yet</p>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {donors.map((donor) => {
                                    const eta = calculateETA(donor.location, hospitalLocation);
                                    return (
                                        <div
                                            key={donor.id}
                                            className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                                                    {donor.bloodType}
                                                </span>
                                                <span className="text-zinc-300 text-sm">{donor.name}</span>
                                                <span className="text-zinc-500 text-xs">{eta.distance} km</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleLoginAsDonor(donor)}
                                                    className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-2"
                                                >
                                                    Login
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onRemoveDonor(donor.id)}
                                                    className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2"
                                                >
                                                    ×
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-zinc-500 pt-2 border-t border-zinc-700/50">
                        💡 Add demo donors and click "Login" to open the donor view in a new tab.
                    </div>
                </CardContent>
            </Card>
        </details>
    );
}
