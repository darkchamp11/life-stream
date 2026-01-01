/**
 * Health Check API Route
 * 
 * PURPOSE:
 * - Verifies that the Next.js API layer is functioning
 * - Required for Early Implementation validation
 * - Can be extended to check Firebase connectivity
 * 
 * ENDPOINT: GET /api/health
 * RESPONSE: { status: "ok", timestamp: ISO8601 }
 */

import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'life-stream',
        version: '1.0.0',
    });
}
