'use client';

/**
 * Hospital Settings Panel
 * 
 * Allows hospital staff to configure:
 * - Demo location presets or custom coordinates
 * - Search radius for donor discovery
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Location } from '@/types';

// Demo location presets for demonstration
export const DEMO_LOCATIONS = [
    {
        id: 'current',
        name: 'Current Location',
        location: null as Location | null
    },
    {
        id: 'city-general',
        name: 'City General Hospital',
        location: { lat: 28.6139, lng: 77.2090 } // Delhi
    },
    {
        id: 'downtown-medical',
        name: 'Downtown Medical Center',
        location: { lat: 19.0760, lng: 72.8777 } // Mumbai
    },
    {
        id: 'university-hospital',
        name: 'University Hospital',
        location: { lat: 12.9716, lng: 77.5946 } // Bangalore
    },
    {
        id: 'custom',
        name: 'Custom Coordinates',
        location: null as Location | null
    },
];

interface HospitalSettingsProps {
    searchRadius: number;
    onSearchRadiusChange: (radius: number) => void;
    selectedLocationId: string;
    onLocationChange: (locationId: string, location: Location | null) => void;
    currentLocation?: Location | null;
}

export default function HospitalSettings({
    searchRadius,
    onSearchRadiusChange,
    selectedLocationId,
    onLocationChange,
    currentLocation,
}: HospitalSettingsProps) {
    const [customLat, setCustomLat] = useState('');
    const [customLng, setCustomLng] = useState('');
    const [coordError, setCoordError] = useState<string | null>(null);

    const handleLocationSelect = (locationId: string) => {
        if (locationId === 'custom') {
            // Just select custom mode, don't apply yet
            onLocationChange('custom', null);
        } else {
            const preset = DEMO_LOCATIONS.find(l => l.id === locationId);
            if (preset) {
                onLocationChange(locationId, preset.location);
            }
        }
    };

    const handleApplyCustomCoords = () => {
        console.log('[HospitalSettings] Apply clicked, raw:', { customLat, customLng });
        const lat = parseFloat(customLat);
        const lng = parseFloat(customLng);
        console.log('[HospitalSettings] Parsed:', { lat, lng });

        if (isNaN(lat) || isNaN(lng)) {
            setCoordError('Please enter valid numbers');
            return;
        }
        if (lat < -90 || lat > 90) {
            setCoordError('Latitude must be between -90 and 90');
            return;
        }
        if (lng < -180 || lng > 180) {
            setCoordError('Longitude must be between -180 and 180');
            return;
        }

        setCoordError(null);
        console.log('[HospitalSettings] Calling onLocationChange with:', { lat, lng });
        onLocationChange('custom', { lat, lng });
    };

    return (
        <details className="group mb-4">
            <summary className="flex items-center justify-between cursor-pointer text-zinc-300 text-sm p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 transition-colors">
                <div className="flex items-center gap-2">
                    <span className="text-lg">⚙️</span>
                    <span className="font-medium">Hospital Settings (Demo)</span>
                </div>
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </summary>

            <Card className="mt-2 bg-zinc-900/80 border-zinc-700/50">
                <CardContent className="p-4 space-y-4">
                    {/* Current Location Display */}
                    {currentLocation && (
                        <div className="text-xs text-zinc-400 bg-zinc-800/50 p-2 rounded-lg">
                            📍 Current: <span className="text-white font-mono">{currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</span>
                        </div>
                    )}

                    {/* Demo Location Selector */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Demo Location</label>
                        <div className="grid grid-cols-2 gap-2">
                            {DEMO_LOCATIONS.map((loc) => (
                                <button
                                    key={loc.id}
                                    onClick={() => handleLocationSelect(loc.id)}
                                    className={`px-3 py-2 rounded-lg text-sm text-left transition-all ${selectedLocationId === loc.id
                                        ? 'bg-red-500/20 border-2 border-red-500 text-red-400'
                                        : 'bg-zinc-800 border-2 border-transparent text-zinc-300 hover:border-zinc-600'
                                        }`}
                                >
                                    {loc.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Coordinates Input */}
                    {selectedLocationId === 'custom' && (
                        <div className="space-y-2 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                            <label className="block text-sm text-zinc-400">Enter Coordinates</label>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="Latitude"
                                        value={customLat}
                                        onChange={(e) => setCustomLat(e.target.value)}
                                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-red-500"
                                    />
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="Longitude"
                                        value={customLng}
                                        onChange={(e) => setCustomLng(e.target.value)}
                                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-red-500"
                                    />
                                </div>
                            </div>
                            {coordError && (
                                <p className="text-red-400 text-xs">{coordError}</p>
                            )}
                            <Button
                                onClick={handleApplyCustomCoords}
                                size="sm"
                                className="w-full bg-red-600 hover:bg-red-700"
                            >
                                Apply Coordinates
                            </Button>
                        </div>
                    )}

                    {/* Search Radius Slider */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">
                            Search Radius: <span className="text-white font-bold">{searchRadius} km</span>
                        </label>
                        <input
                            type="range"
                            min={5}
                            max={50}
                            step={5}
                            value={searchRadius}
                            onChange={(e) => onSearchRadiusChange(Number(e.target.value))}
                            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                        <div className="flex justify-between text-xs text-zinc-500 mt-1">
                            <span>5 km</span>
                            <span>25 km</span>
                            <span>50 km</span>
                        </div>
                    </div>

                    <div className="text-xs text-zinc-500 pt-2 border-t border-zinc-700/50">
                        💡 Adjust these settings for demo purposes. Changes take effect immediately.
                    </div>
                </CardContent>
            </Card>
        </details>
    );
}
