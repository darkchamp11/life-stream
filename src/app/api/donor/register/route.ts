/**
 * POST /api/donor/register
 * 
 * Register a new donor.
 * Stores donor in Firebase RTDB.
 */

import { NextResponse } from 'next/server';
import { registerDonor } from '@/services/realtime';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const { name, blood_group, latitude, longitude, availability } = body;

        // Validate required fields
        if (!name || !blood_group || latitude === undefined || longitude === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: name, blood_group, latitude, longitude' },
                { status: 400 }
            );
        }

        const donorId = `donor-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        const donor = {
            id: donorId,
            name,
            bloodType: blood_group,
            latitude,
            longitude,
            availability: availability ?? true,
        };

        registerDonor(donor);

        return NextResponse.json({
            message: 'Donor registered successfully',
            donor: {
                id: donorId,
                name,
                blood_group,
                latitude,
                longitude,
                availability: availability ?? true,
            },
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to register donor' },
            { status: 500 }
        );
    }
}
