/**
 * POST /api/emergency/request
 * 
 * Create emergency request and run donor selection algorithm.
 * REQUIRES x-api-key header for hospital authentication.
 * Returns ranked donors and pipeline execution logs.
 */

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/app/api/auth';
import { getAllDonors } from '@/services/realtime';
import { broadcastRequest, storeEmergencyResults } from '@/services/realtime';
import { getPrioritizedDonors, calculateDistance } from '@/services/geo';
import { encodeGeohash, GEOHASH_PRECISION } from '@/services/geohash';
import type { BloodType, Location } from '@/models/donor';
import type { EmergencyRequest } from '@/models/emergency';

export async function POST(request: Request) {
    // Step 1: Authenticate
    const { authenticated, hospital, errorResponse } = authenticateRequest(request);
    if (!authenticated || !hospital) {
        return errorResponse;
    }

    try {
        const body = await request.json();
        const { hospital_name, required_blood, latitude, longitude, search_radius } = body;

        // Validate required fields
        if (!required_blood || latitude === undefined || longitude === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: required_blood, latitude, longitude' },
                { status: 400 }
            );
        }

        const hospitalLocation: Location = { lat: latitude, lng: longitude };
        const bloodType = required_blood as BloodType;
        const radius = search_radius || 15;

        // Get registered donors from Firebase
        const rawDonors = await getAllDonors();

        // Convert raw donors to typed donors
        const donors = rawDonors.map((d: Record<string, unknown>) => ({
            id: d.id as string,
            name: d.name as string,
            bloodType: (d.bloodType || d.blood_group) as BloodType,
            status: 'active' as const,
            availability: d.availability !== false,
            location: {
                lat: (d.latitude as number) || (d.location as { lat: number })?.lat || 0,
                lng: (d.longitude as number) || (d.location as { lng: number })?.lng || 0,
            },
            geohash: encodeGeohash({
                lat: (d.latitude as number) || (d.location as { lat: number })?.lat || 0,
                lng: (d.longitude as number) || (d.location as { lng: number })?.lng || 0,
            }, GEOHASH_PRECISION),
        }));

        // Run donor selection pipeline
        const { prioritized, log, pipelineLogs } = getPrioritizedDonors(
            donors, hospitalLocation, bloodType, radius
        );

        // Build emergency request
        const requestId = `req-${Date.now()}`;
        const emergencyRequest: EmergencyRequest = {
            id: requestId,
            hospitalId: hospital.id,
            hospitalName: hospital_name || hospital.name,
            hospitalLocation,
            hospitalGeohash: encodeGeohash(hospitalLocation, GEOHASH_PRECISION),
            bloodType,
            searchRadius: radius,
            urgency: 'critical',
            status: 'active',
            createdAt: new Date(),
            respondingDonors: [],
        };

        // Broadcast to Firebase for real-time notifications
        broadcastRequest(emergencyRequest);

        // Build ranked donor list for response
        const rankedDonors = prioritized.map((donor, index) => ({
            rank: index + 1,
            donorId: donor.id,
            donorName: donor.name,
            bloodGroup: donor.bloodType,
            distance: Math.round((donor.distance ?? 0) * 100) / 100,
            availability: donor.availability ?? donor.status === 'active',
        }));

        // Store results for GET /api/emergency/:id/results
        const results = {
            requestId,
            hospitalName: hospital_name || hospital.name,
            requiredBlood: bloodType,
            searchRadius: radius,
            rankedDonors,
            pipelineLogs,
            selectionLog: log,
        };

        storeEmergencyResults(requestId, results);

        return NextResponse.json(results);

    } catch (error) {
        console.error('[API] Emergency request error:', error);
        return NextResponse.json(
            { error: 'Failed to process emergency request' },
            { status: 500 }
        );
    }
}
