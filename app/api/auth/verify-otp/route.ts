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

        // Exhaustive search for session identifiers in the response
        const findSid = (obj: any): any => {
            if (!obj || typeof obj !== 'object') return null;
            const keys = ['sessionId', 'UserSessionId', 'UsersSessionId', 'sessionID', 'd_sessionid', 'UserSessionID', 'usersessionid', 'SessionId', 'UsersSessionID'];
            for (const key of keys) {
                if (obj[key]) return obj[key];
            }
            if (obj.data) return findSid(obj.data);
            return null;
        };

        const returnedSid = findSid(data);
        // If the API returns a sessionId, use it. Otherwise, use the signOTPId from the request.
        // We avoid using rpValue if it is 1, as that is likely just a success flag.
        const sid = (returnedSid && returnedSid !== 1) ? returnedSid : signOTPId;

        // User has an account if verified and we have a valid SessionId (not 1)
        const hasAccount = isVerified && !!sid && Number(sid) > 1;

        console.log('Account Detection (Final):', {
            isVerified,
            hasAccount,
            sid,
            returnedSid,
            signOTPId,
            rpValue: data.rpValue,
            keysInRange: Object.keys(data)
        });

        return NextResponse.json({
            isVerified,
            hasAccount,
            rpStatus: data.rpStatus,
            message: isVerified ? 'OTP verified successfully' : (data.rpMsg || 'Invalid OTP code'),
            sessionId: sid,
            userId: (data.rpValue && data.rpValue > 1) ? data.rpValue : null,
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
