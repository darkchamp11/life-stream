/**
 * GET /api/donors
 * 
 * Return list of all registered donors.
 */

import { NextResponse } from 'next/server';
import { getAllDonors } from '@/services/realtime';

export async function GET() {
    try {
        const donors = await getAllDonors();

        return NextResponse.json({
            count: donors.length,
            donors,
        });

    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch donors' },
            { status: 500 }
        );
    }
}
