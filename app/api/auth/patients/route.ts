import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sessionId, userId } = body;

        console.log('Patients Request Params:', { sessionId, userId });

        if (!sessionId && !userId) {
            return NextResponse.json(
                { error: 'Session ID or User ID is required' },
                { status: 400 }
            );
        }

        // Try with SessionId first
        let endpoint = 'https://etapisd.etabeb.com/api/AI/UserPatientList4Reserve';
        let response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ SessionId: sessionId || userId?.toString() }),
        });

        let patients = await response.json();
        console.log('Patients Response (Primary):', JSON.stringify(patients));

        // If primary attempt returns empty, try with UserId specifically if different
        if ((!patients || patients.length === 0) && userId && sessionId !== userId.toString()) {
            console.log('Retrying patients fetch with UserId:', userId);
            response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ UserId: userId }),
            });
            patients = await response.json();
            console.log('Patients Response (UserId Retry):', JSON.stringify(patients));
        }

        return NextResponse.json(patients);
    } catch (error) {
        console.error('Error fetching patients:', error);
        return NextResponse.json(
            { error: 'Failed to fetch patients' },
            { status: 500 }
        );
    }
}
