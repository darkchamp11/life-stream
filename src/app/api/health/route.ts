/**
 * GET /api/health
 * 
 * Health check endpoint.
 * Verifies that the API layer is functioning.
 */

import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'life-stream',
        version: '2.0.0',
        architecture: 'MVVM',
    });
}
