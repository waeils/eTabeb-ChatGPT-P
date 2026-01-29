import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { otpCode, signOTPId } = body;

        if (!otpCode || !signOTPId) {
            return NextResponse.json(
                { error: 'OTP code and sign OTP ID are required' },
                { status: 400 }
            );
        }

        // Use SignOTPVerify endpoint with correct parameter names
        const endpoint = 'https://etapisd.etabeb.com/api/AI/SignOTPVerify';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                signOTPId: signOTPId,      // Correct parameter name (from rpValue of send OTP)
                signOTPCode: otpCode,       // Correct parameter name
                isSystem: 0,                // Static value as per your screenshot
            }),
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();

        // Check rpStatus for verification success (>= 1 means verified)
        const isVerified = data.rpStatus && data.rpStatus >= 1;

        // If verified and has sessionId, user is already registered
        const hasAccount = isVerified && data.sessionId;

        return NextResponse.json({
            isVerified,
            hasAccount,  // True if user already has an eTabeb account
            rpStatus: data.rpStatus,
            message: isVerified ? 'OTP verified successfully' : (data.rpMsg || 'Invalid OTP code'),
            sessionId: data.sessionId,
            userId: data.rpValue,  // User ID after successful verification
            data,
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return NextResponse.json(
            { error: 'Failed to verify OTP' },
            { status: 500 }
        );
    }
}
