/**
 * useEmergencyAlerts ViewModel
 * 
 * Subscribes to Firebase for emergency blood requests.
 * Filters by blood type compatibility.
 * Handles accept/decline flow.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { EmergencyRequest } from '../models/emergency';
import type { Location } from '../models/donor';
import {
    subscribeToRequests,
    sendDonorResponse,
    updateLiveLocation,
    subscribeToSelection,
} from '../services/realtime';
import { getCurrentLocation, watchLocation } from '../services/location';

// Blood type compatibility (donor → recipient)
function canDonateTo(donorType: string, requestedType: string): boolean {
    if (donorType === 'O-') return true;
    if (donorType === requestedType) return true;
    if (donorType === 'O+' && requestedType.includes('+')) return true;
    if (donorType === 'A-' && ['A+', 'A-', 'AB+', 'AB-'].includes(requestedType)) return true;
    if (donorType === 'A+' && ['A+', 'AB+'].includes(requestedType)) return true;
    if (donorType === 'B-' && ['B+', 'B-', 'AB+', 'AB-'].includes(requestedType)) return true;
    if (donorType === 'B+' && ['B+', 'AB+'].includes(requestedType)) return true;
    if (donorType === 'AB-' && ['AB+', 'AB-'].includes(requestedType)) return true;
    if (donorType === 'AB+' && requestedType === 'AB+') return true;
    return false;
}

export function useEmergencyAlerts(donorId: string, donorBloodType: string) {
    const [activeRequest, setActiveRequest] = useState<EmergencyRequest | null>(null);
    const [isCompatible, setIsCompatible] = useState(false);
    const [responseStatus, setResponseStatus] = useState<'accepted' | 'declined' | null>(null);
    const [isSelected, setIsSelected] = useState<boolean | null>(null);
    const locationWatchRef = useRef<{ remove: () => void } | null>(null);

    // Subscribe to emergency requests
    useEffect(() => {
        const unsubscribe = subscribeToRequests((request) => {
            setActiveRequest(request);
            setResponseStatus(null);
            setIsSelected(null);

            if (request) {
                setIsCompatible(canDonateTo(donorBloodType, request.bloodType));
            } else {
                setIsCompatible(false);
                // Stop watching location when no active request
                if (locationWatchRef.current) {
                    locationWatchRef.current.remove();
                    locationWatchRef.current = null;
                }
            }
        });

        return unsubscribe;
    }, [donorBloodType]);

    // Subscribe to selection results
    useEffect(() => {
        if (!donorId) return;

        const unsubscribe = subscribeToSelection(donorId, (result) => {
            if (result) {
                setIsSelected(result.isSelected);
            }
        });

        return unsubscribe;
    }, [donorId]);

    // Accept emergency request
    const acceptRequest = useCallback(async () => {
        if (!activeRequest || !donorId) return;

        // Get current location
        const locResult = await getCurrentLocation();
        const liveLocation = locResult.success ? locResult.location : undefined;

        // Send response to Firebase
        sendDonorResponse({
            donorId,
            requestId: activeRequest.id,
            accepted: true,
            liveLocation,
        });

        setResponseStatus('accepted');

        // Start live location tracking
        if (liveLocation) {
            updateLiveLocation(donorId, liveLocation);
        }

        const subscription = await watchLocation((location) => {
            updateLiveLocation(donorId, location);
        });
        locationWatchRef.current = subscription;
    }, [activeRequest, donorId]);

    // Decline emergency request
    const declineRequest = useCallback(() => {
        if (!activeRequest || !donorId) return;

        sendDonorResponse({
            donorId,
            requestId: activeRequest.id,
            accepted: false,
        });

        setResponseStatus('declined');
    }, [activeRequest, donorId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (locationWatchRef.current) {
                locationWatchRef.current.remove();
            }
        };
    }, []);

    return {
        activeRequest,
        isCompatible,
        responseStatus,
        isSelected,
        acceptRequest,
        declineRequest,
    };
}
