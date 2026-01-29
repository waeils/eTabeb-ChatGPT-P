import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { mobileNumber, countryId } = body;

        if (!mobileNumber || !countryId) {
            return NextResponse.json(
                { error: 'Mobile number and country ID are required' },
                { status: 400 }
            );
        }

        // Use OTPRequestForSignUp with correct parameter names
        const endpoint = 'https://etapisd.etabeb.com/api/AI/OTPRequestForSignUp';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                countryid: countryId,    // Correct parameter name
                mobileno: mobileNumber,  // Correct parameter name
            }),
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();

        // Check if OTP was sent successfully (rpStatus >= 1)
        if (data.rpStatus && data.rpStatus >= 1) {
            return NextResponse.json({
                success: true,
                message: 'OTP sent successfully to your mobile',
                signOTPId: data.rpValue,  // This is the ID needed for verification
                // OTP code removed for production - user receives it via SMS
                data,
            });
        } else {
            return NextResponse.json(
                { error: data.rpMsg || 'Failed to send OTP' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error sending OTP:', error);
        return NextResponse.json(
            { error: 'Failed to send OTP' },
            { status: 500 }
        );
    }
}
