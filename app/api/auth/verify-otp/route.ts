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
        console.log('OTP Verify Raw:', JSON.stringify(data));

        // Check rpStatus for verification success (>= 1 means verified)
        const isVerified = data.rpStatus && data.rpStatus >= 1;

        // If verified and has any form of identifier, user is already registered
        const hasAccount = isVerified && (!!data.sessionId || !!data.UserSessionId || (data.rpValue && data.rpValue > 0));

        console.log('Account Detection:', { isVerified, hasAccount, sid: !!data.sessionId, usid: !!data.UserSessionId, uid: data.rpValue });

        return NextResponse.json({
            isVerified,
            hasAccount,
            rpStatus: data.rpStatus,
            message: isVerified ? 'OTP verified successfully' : (data.rpMsg || 'Invalid OTP code'),
            sessionId: data.sessionId || data.UserSessionId,
            userId: data.rpValue,
            data, // Pass full object so patients API can find everything
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return NextResponse.json(
            { error: 'Failed to verify OTP' },
            { status: 500 }
        );
    }
}
