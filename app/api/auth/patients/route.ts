import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sessionId } = body;

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            );
        }

        // Call real eTabeb UserPatientList4Reserve API
        const response = await fetch('https://etapisd.etabeb.com/api/AI/UserPatientList4Reserve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                SessionId: sessionId
            }),
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const patients = await response.json();

        return NextResponse.json(patients);
    } catch (error) {
        console.error('Error fetching patients:', error);
        return NextResponse.json(
            { error: 'Failed to fetch patients' },
            { status: 500 }
        );
    }
}
