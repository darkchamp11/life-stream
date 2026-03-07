/**
 * API Key Authentication Helper
 * 
 * Validates x-api-key header for hospital authentication.
 * Returns HTTP 403 for unauthorized requests.
 */

import { NextResponse } from 'next/server';
import { validateApiKey } from '@/models/hospital';

export function authenticateRequest(request: Request): {
    authenticated: boolean;
    hospital: ReturnType<typeof validateApiKey>;
    errorResponse?: NextResponse;
} {
    const apiKey = request.headers.get('x-api-key');
    const hospital = validateApiKey(apiKey);

    if (!hospital) {
        return {
            authenticated: false,
            hospital: null,
            errorResponse: NextResponse.json(
                { error: 'Unauthorized. Valid x-api-key header required.' },
                { status: 403 }
            ),
        };
    }

    return { authenticated: true, hospital };
}
