/**
 * EmergencyRequestView — Page 1
 * 
 * Hospital emergency request form with:
 * - Hospital selector (dropdown of 3 demo hospitals)
 * - API Key input for authentication
 * - Blood type selector
 * - Hospital latitude/longitude display
 * - Search radius control
 * - "Find Donors" button
 */

'use client';

import { useState } from 'react';
import type { BloodType, Location } from '@/models/donor';
import { HOSPITAL_API_KEYS, validateApiKey } from '@/models/hospital';
import BloodTypeSelector from '@/views/components/BloodTypeSelector';

interface EmergencyRequestViewProps {
    hospitalLocation: Location;
    searchRadius: number;
    onSearchRadiusChange: (radius: number) => void;
    onRequestBlood: (bloodType: BloodType, searchRadius: number, apiKey: string, hospitalName: string) => void;
}

const DEMO_HOSPITALS = Object.entries(HOSPITAL_API_KEYS).map(([key, hospital]) => ({
    apiKey: key,
    id: hospital.id,
    name: hospital.name,
    location: hospital.location,
}));

export default function EmergencyRequestView({
    hospitalLocation,
    searchRadius,
    onSearchRadiusChange,
    onRequestBlood,
}: EmergencyRequestViewProps) {
    const [selectedBloodType, setSelectedBloodType] = useState<BloodType>('O+');
    const [selectedHospitalIndex, setSelectedHospitalIndex] = useState(0);
    const [apiKeyInput, setApiKeyInput] = useState(DEMO_HOSPITALS[0].apiKey);
    const [authError, setAuthError] = useState<string | null>(null);
    const [isKeyVisible, setIsKeyVisible] = useState(false);

    const selectedHospital = DEMO_HOSPITALS[selectedHospitalIndex];

    const handleHospitalChange = (index: number) => {
        setSelectedHospitalIndex(index);
        setApiKeyInput(DEMO_HOSPITALS[index].apiKey);
        setAuthError(null);
    };

    const handleFindDonors = () => {
        // Validate API key
        const hospital = validateApiKey(apiKeyInput);
        if (!hospital) {
            setAuthError('Invalid API key. Please enter a valid hospital API key.');
            return;
        }
        setAuthError(null);
        onRequestBlood(selectedBloodType, searchRadius, apiKeyInput, hospital.name);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-950/30 via-zinc-950 to-zinc-950 p-4 flex flex-col">
            {/* Header */}
            <div className="text-center mb-6 pt-4">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-red-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <h1 className="text-xl font-bold text-white">{selectedHospital.name}</h1>
                <p className="text-zinc-500 text-sm">Emergency Blood Request Dashboard</p>
            </div>

            {/* Hospital Selector */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 mb-4">
                <label className="block text-xs text-zinc-500 mb-2 uppercase tracking-wider font-semibold">
                    Select Hospital
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {DEMO_HOSPITALS.map((hospital, index) => (
                        <button
                            key={hospital.id}
                            onClick={() => handleHospitalChange(index)}
                            className={`px-3 py-3 rounded-lg text-sm font-medium transition-all border ${selectedHospitalIndex === index
                                ? 'bg-red-500/20 border-red-500/50 text-red-400'
                                : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                                }`}
                        >
                            {hospital.name.replace(' Hospital', '')}
                        </button>
                    ))}
                </div>

                {/* API Key Input */}
                <div className="mt-4">
                    <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider font-semibold">
                        API Key
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type={isKeyVisible ? 'text' : 'password'}
                                value={apiKeyInput}
                                onChange={(e) => {
                                    setApiKeyInput(e.target.value);
                                    setAuthError(null);
                                }}
                                placeholder="Enter hospital API key"
                                className={`w-full bg-zinc-800 rounded-lg px-3 py-2.5 text-zinc-300 text-sm font-mono border ${authError ? 'border-red-500/50' : 'border-zinc-700'
                                    } focus:outline-none focus:border-zinc-500`}
                            />
                        </div>
                        <button
                            onClick={() => setIsKeyVisible(!isKeyVisible)}
                            className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 text-xs hover:text-zinc-300 transition-colors"
                        >
                            {isKeyVisible ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    {authError && (
                        <p className="text-red-400 text-xs mt-1.5">{authError}</p>
                    )}
                    <p className="text-zinc-600 text-xs mt-1.5">
                        Demo keys: API_APOLLO_123, API_CARE_456, API_GANDHI_789
                    </p>
                </div>
            </div>

            {/* Request Form */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 mb-4">
                <BloodTypeSelector
                    selectedType={selectedBloodType}
                    onSelect={setSelectedBloodType}
                />

                {/* Hospital Location Display */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-zinc-500 mb-1">Latitude</label>
                        <div className="bg-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm font-mono">
                            {hospitalLocation.lat.toFixed(6)}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-500 mb-1">Longitude</label>
                        <div className="bg-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm font-mono">
                            {hospitalLocation.lng.toFixed(6)}
                        </div>
                    </div>
                </div>

                {/* Search Radius */}
                <div className="mt-4">
                    <label className="block text-xs text-zinc-500 mb-1">
                        Search Radius: {searchRadius} km
                    </label>
                    <input
                        type="range"
                        min="5"
                        max="50"
                        value={searchRadius}
                        onChange={(e) => onSearchRadiusChange(Number(e.target.value))}
                        className="w-full accent-red-500"
                    />
                    <div className="flex justify-between text-xs text-zinc-600">
                        <span>5 km</span>
                        <span>50 km</span>
                    </div>
                </div>

                {/* Find Donors Button */}
                <button
                    onClick={handleFindDonors}
                    className="w-full mt-4 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-red-500/25 transition-all"
                >
                    🚨 Find Donors
                </button>
            </div>

            {/* Privacy Note */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 text-xs font-medium mt-0.5">
                        Privacy
                    </span>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                        Donor locations are processed only during emergency request evaluation.
                        Exact coordinates are processed only inside the selection algorithm.
                        Only minimal donor attributes are stored.
                    </p>
                </div>
            </div>
        </div>
    );
}
