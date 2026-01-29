import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('Patients Request Body:', JSON.stringify(body));

        const { sessionId, userId } = body;

        // Try with various possible parameter names
        const payload = {
            SessionId: sessionId || userId?.toString() || body.SessionId || body.signOTPId,
            UserId: userId || body.userId,
            isSystem: 0
        };

        console.log('Patients API Call Payload:', JSON.stringify(payload));

        const endpoint = 'https://etapisd.etabeb.com/api/AI/UserPatientList4Reserve';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error(`eTabeb Patients API Error: ${response.status}`);
            return NextResponse.json([]);
        }

        const patients = await response.json();
        console.log('Patients API Result:', JSON.stringify(patients));

        return NextResponse.json(patients || []);
    } catch (error) {
        console.error('Error fetching patients:', error);
        return NextResponse.json(
            { error: 'Failed to fetch patients' },
            { status: 500 }
        );
    }
}
