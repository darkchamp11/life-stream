'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Donor, Location } from '@/types';
import { getH3Center, getH3Boundary, calculateETA } from '@/lib/geo';

interface HospitalMapProps {
  hospitalLocation: Location;
  donors: Donor[];
  donorLiveLocations: Record<string, Location>;
  showPreciseLocations: boolean;
  isScanning?: boolean;
  selectedDonorIds?: string[];
  onDonorClick?: (donor: Donor) => void;
}

// Hospital icon with radar animation
const createHospitalIcon = (isActive: boolean) => L.divIcon({
  className: 'hospital-marker',
  html: `
    <div style="position: relative; width: 60px; height: 60px;">
      ${isActive ? `
        <div style="position: absolute; inset: -30px; border: 3px solid rgba(239, 68, 68, 0.4); border-radius: 50%; animation: radar 2s ease-out infinite;"></div>
        <div style="position: absolute; inset: -50px; border: 2px solid rgba(239, 68, 68, 0.3); border-radius: 50%; animation: radar 2s ease-out infinite 0.4s;"></div>
        <div style="position: absolute; inset: -70px; border: 2px solid rgba(239, 68, 68, 0.2); border-radius: 50%; animation: radar 2s ease-out infinite 0.8s;"></div>
      ` : ''}
      <div style="
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #dc2626, #991b1b);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 30px rgba(220, 38, 38, 0.6);
        border: 4px solid white;
        position: relative;
        z-index: 100;
      ">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>
        </svg>
      </div>
    </div>
    <style>
      @keyframes radar { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
    </style>
  `,
  iconSize: [60, 60],
  iconAnchor: [30, 30],
});

// Donor icon - anonymous appearance
const createDonorIcon = (bloodType: string, status: string, isSelected: boolean, isLive: boolean) => {
  const getColor = () => {
    if (isSelected) return '#22c55e';
    if (status === 'accepted') return '#3b82f6';
    if (status === 'declined') return '#ef4444';
    return '#6366f1';
  };

  const color = getColor();
  const size = isSelected ? 48 : 40;

  return L.divIcon({
    className: 'donor-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px ${color}80;
        border: 3px solid white;
        font-weight: bold;
        font-size: 12px;
        color: white;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
      ">
        ${bloodType}
        ${isLive ? `<div style="position: absolute; top: -3px; right: -3px; width: 14px; height: 14px; background: #3b82f6; border-radius: 50%; border: 2px solid white; animation: pulse 1.5s infinite;"></div>` : ''}
      </div>
      <style>
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .donor-marker:hover > div { transform: scale(1.15); }
      </style>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Generate anonymous ID
const getAnonymousId = (donorId: string) => `Donor_${donorId.slice(-5).toUpperCase()}`;

// Get display name for consent-based reveal
const getDisplayName = (donor: Donor, isSelected: boolean) => {
  // If donor is confirmed (selected) and has real name (not starting with Donor_), show it
  if (isSelected && donor.name && !donor.name.startsWith('Donor_')) {
    return donor.name;
  }
  // Otherwise show anonymous ID
  return getAnonymousId(donor.id);
};

export default function HospitalMap({
  hospitalLocation,
  donors,
  donorLiveLocations,
  showPreciseLocations,
  isScanning = false,
  selectedDonorIds = [],
  onDonorClick
}: HospitalMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const hospitalMarkerRef = useRef<L.Marker | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const hexagonsRef = useRef<L.LayerGroup | null>(null);
  const searchRadiusRef = useRef<L.Circle | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      center: [hospitalLocation.lat, hospitalLocation.lng],
      zoom: 14,
      zoomControl: false,
    });

    // Dark theme tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(mapRef.current);

    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

    // Add hospital marker
    hospitalMarkerRef.current = L.marker([hospitalLocation.lat, hospitalLocation.lng], {
      icon: createHospitalIcon(false),
      zIndexOffset: 1000
    }).addTo(mapRef.current);

    // Add search radius circle (15km emergency response zone)
    searchRadiusRef.current = L.circle([hospitalLocation.lat, hospitalLocation.lng], {
      radius: 15000,  // 15km in meters
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 0.05,
      weight: 2,
      dashArray: '10, 10',
    }).addTo(mapRef.current);

    // Initialize layer groups
    markersRef.current = L.layerGroup().addTo(mapRef.current);
    hexagonsRef.current = L.layerGroup().addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [hospitalLocation]);

  // Update hospital marker animation
  useEffect(() => {
    if (!mapRef.current || !hospitalMarkerRef.current) return;
    hospitalMarkerRef.current.setIcon(createHospitalIcon(isScanning || showPreciseLocations));
  }, [isScanning, showPreciseLocations]);

  // Update donor markers
  useEffect(() => {
    if (!mapRef.current || !markersRef.current || !hexagonsRef.current) return;

    markersRef.current.clearLayers();
    hexagonsRef.current.clearLayers();

    donors.forEach((donor) => {
      const liveLocation = donorLiveLocations[donor.id];
      const isAccepted = donor.status === 'accepted';
      const isSelected = selectedDonorIds.includes(donor.id);
      const isLive = !!liveLocation;
      const location = liveLocation || donor.location;
      const eta = calculateETA(location, hospitalLocation);
      const anonymousId = getAnonymousId(donor.id);

      if (liveLocation || (showPreciseLocations && isAccepted)) {
        // Precise location marker
        const marker = L.marker([location.lat, location.lng], {
          icon: createDonorIcon(donor.bloodType, donor.status, isSelected, isLive)
        }).addTo(markersRef.current!);

        // Get display name (consent-based reveal)
        const displayName = getDisplayName(donor, isSelected);

        // Popup with donor details (anonymous or real name based on consent)
        marker.bindPopup(`
                    <div style="min-width: 160px; font-family: system-ui;">
                        <div style="font-weight: bold; font-size: 15px; margin-bottom: 6px; color: #fff;">
                            ${displayName}
                        </div>
                        <div style="display: flex; gap: 6px; margin-bottom: 10px;">
                            <span style="background: #ef4444; color: white; padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: bold;">
                                ${donor.bloodType}
                            </span>
                            ${isLive ? '<span style="background: #3b82f6; color: white; padding: 3px 8px; border-radius: 6px; font-size: 11px;">📍 LIVE</span>' : ''}
                            ${isSelected ? '<span style="background: #22c55e; color: white; padding: 3px 8px; border-radius: 6px; font-size: 11px;">✓ CONFIRMED</span>' : ''}
                        </div>
                        <div style="font-size: 13px; color: #aaa; line-height: 1.6;">
                            <div>🕐 ETA: <strong style="color: #fff;">${eta.time} min</strong></div>
                            <div>📏 Distance: <strong style="color: #fff;">${eta.distance} km</strong></div>
                            <div>🚦 Traffic: <span style="color: ${eta.trafficStatus === 'heavy' ? '#ef4444' : eta.trafficStatus === 'moderate' ? '#eab308' : '#22c55e'};">${eta.trafficStatus}</span></div>
                        </div>
                    </div>
                `, { className: 'dark-popup' });

        if (onDonorClick) {
          marker.on('click', () => onDonorClick(donor));
        }
      } else {
        // H3 hexagon for privacy
        const h3Center = getH3Center(donor.h3Index);
        const h3Boundary = getH3Boundary(donor.h3Index);

        const hexColor = donor.status === 'declined' ? '#ef4444' : '#6366f1';
        L.polygon(h3Boundary as [number, number][], {
          color: hexColor,
          fillColor: hexColor,
          fillOpacity: 0.15,
          weight: 2,
        }).addTo(hexagonsRef.current!);

        L.circleMarker([h3Center.lat, h3Center.lng], {
          radius: 10,
          color: hexColor,
          fillColor: hexColor,
          fillOpacity: 0.8,
          weight: 2,
        }).addTo(hexagonsRef.current!).bindPopup(`
                    <div style="min-width: 100px; font-family: system-ui;">
                        <div style="font-weight: bold; margin-bottom: 4px; color: #fff;">Donor in Area</div>
                        <span style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                            ${donor.bloodType}
                        </span>
                        <div style="font-size: 11px; color: #888; margin-top: 8px;">
                            Approximate location<br/>(Privacy protected)
                        </div>
                    </div>
                `, { className: 'dark-popup' });
      }
    });
  }, [donors, donorLiveLocations, showPreciseLocations, selectedDonorIds, hospitalLocation, onDonorClick]);

  return (
    <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '300px' }} />
  );
}
