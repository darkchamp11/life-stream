/**
 * GET /api/emergency/[id]/results
 * 
 * Return ranked donors and execution logs for a given emergency request.
 */

import { NextResponse } from 'next/server';
import { getEmergencyResults } from '@/services/realtime';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const results = await getEmergencyResults(id);

        if (!results) {
            return NextResponse.json(
                { error: `Emergency request ${id} not found` },
                { status: 404 }
            );
        }

        return NextResponse.json(results);

    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch emergency results' },
            { status: 500 }
        );
    }
}
