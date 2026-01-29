import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { mobileNumber, countryCode } = body;

        if (!mobileNumber || !countryCode) {
            return NextResponse.json(
                { error: 'Mobile number and country code are required' },
                { status: 400 }
            );
        }

        const response = await fetch('https://etapisd.etabeb.com/api/AI/GetSessionByMobileNumber', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mobileNumber,
                countryCode,
            }),
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();

        // Check if user is registered (has sessionId)
        const isRegistered = data.sessionId && data.sessionId.trim() !== '';

        return NextResponse.json({
            isRegistered,
            sessionId: data.sessionId || null,
            data,
        });
    } catch (error) {
        console.error('Error checking session:', error);
        return NextResponse.json(
            { error: 'Failed to check session' },
            { status: 500 }
        );
    }
}
