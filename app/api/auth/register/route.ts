import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            mobileNumber,
            countryCode,
            countryId,
            identityType,
            identityNumber,
            firstName,
            lastName,
            email,
        } = body;

        if (!mobileNumber || !countryCode || !identityType || !identityNumber) {
            return NextResponse.json(
                { error: 'Required fields are missing' },
                { status: 400 }
            );
        }

        const response = await fetch('https://etapisd.etabeb.com/api/AI/RegisterUser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mobileNumber,
                countryCode,
                countryId,
                identityType,
                identityNumber,
                firstName,
                lastName,
                email,
            }),
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();

        // Check rpStatus for registration success (> 0 means successful)
        const isSuccess = data.rpStatus && data.rpStatus > 0;

        return NextResponse.json({
            success: isSuccess,
            rpStatus: data.rpStatus,
            message: isSuccess ? 'Registration successful' : 'Registration failed',
            data,
        });
    } catch (error) {
        console.error('Error registering user:', error);
        return NextResponse.json(
            { error: 'Failed to register user' },
            { status: 500 }
        );
    }
}
