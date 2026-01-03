'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Location } from '@/types';

interface DonorMapProps {
    donorLocation: Location;
    hospitalLocation: Location | null;
    isSharing: boolean;
}

// Custom donor icon (self)
const donorSelfIcon = L.divIcon({
    className: 'custom-donor-self-icon',
    html: `<div style="
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.5);
    border: 3px solid white;
  ">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  </div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
});

// Hospital icon (destination)
const hospitalDestIcon = L.divIcon({
    className: 'custom-hospital-dest-icon',
    html: `<div style="
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #dc2626, #991b1b);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(220, 38, 38, 0.5);
    border: 3px solid white;
  ">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>
    </svg>
  </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

export default function DonorMap({ donorLocation, hospitalLocation, isSharing }: DonorMapProps) {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const donorMarkerRef = useRef<L.Marker | null>(null);
    const hospitalMarkerRef = useRef<L.Marker | null>(null);
    const routeLineRef = useRef<L.Polyline | null>(null);

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        mapRef.current = L.map(mapContainerRef.current, {
            center: [donorLocation.lat, donorLocation.lng],
            zoom: 15,
            zoomControl: false,
        });

        // Dark theme tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 19,
        }).addTo(mapRef.current);

        // Add zoom control to bottom right
        L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

        // Add donor marker
        donorMarkerRef.current = L.marker([donorLocation.lat, donorLocation.lng], { icon: donorSelfIcon })
            .addTo(mapRef.current)
            .bindPopup('<b>Your Location</b>');

        return () => {
            mapRef.current?.remove();
            mapRef.current = null;
        };
    }, []);

    // Update donor position
    useEffect(() => {
        if (!mapRef.current || !donorMarkerRef.current) return;

        donorMarkerRef.current.setLatLng([donorLocation.lat, donorLocation.lng]);

        if (isSharing) {
            mapRef.current.panTo([donorLocation.lat, donorLocation.lng]);
        }
    }, [donorLocation, isSharing]);

    // Handle hospital marker and route
    useEffect(() => {
        if (!mapRef.current) return;

        // Remove existing hospital marker and route
        if (hospitalMarkerRef.current) {
            hospitalMarkerRef.current.remove();
            hospitalMarkerRef.current = null;
        }
        if (routeLineRef.current) {
            routeLineRef.current.remove();
            routeLineRef.current = null;
        }

        if (hospitalLocation) {
            // Add hospital marker
            hospitalMarkerRef.current = L.marker([hospitalLocation.lat, hospitalLocation.lng], { icon: hospitalDestIcon })
                .addTo(mapRef.current)
                .bindPopup('<b>Hospital</b><br>Your destination');

            // Draw route line
            routeLineRef.current = L.polyline(
                [
                    [donorLocation.lat, donorLocation.lng],
                    [hospitalLocation.lat, hospitalLocation.lng],
                ],
                {
                    color: '#3b82f6',
                    weight: 4,
                    opacity: 0.8,
                    dashArray: '10, 10',
                }
            ).addTo(mapRef.current);

            // Fit bounds to show both markers
            const bounds = L.latLngBounds(
                [donorLocation.lat, donorLocation.lng],
                [hospitalLocation.lat, hospitalLocation.lng]
            );
            mapRef.current.fitBounds(bounds, { padding: [80, 80] });
        }
    }, [hospitalLocation, donorLocation]);

    return (
        <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '256px' }} />
    );
}
