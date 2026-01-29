import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('Patients Request Body:', JSON.stringify(body));

        const sessionId = body.sessionId || body.data?.sessionId || body.data?.UserSessionId || body.signOTPId;
        const userId = body.userId || body.data?.userId || body.data?.rpValue || body.userId;

        // Try with various possible parameter names
        const payloads = [
            { SessionId: sessionId, isSystem: 0 },
            { SessionId: userId?.toString(), isSystem: 0 },
            { UserId: userId, isSystem: 0 }
        ];

        let patients: any[] = [];
        const endpoint = 'https://etapisd.etabeb.com/api/AI/UserPatientList4Reserve';

        for (const payload of payloads) {
            if (!payload.SessionId && !payload.UserId) continue;

            console.log('Trying Patients API with payload:', JSON.stringify(payload));
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('API Result for payload:', JSON.stringify(result));
                // Handle both array and { PatientList: [] }
                const list = Array.isArray(result) ? result : (result.PatientList || result.patientList || []);
                if (list && list.length > 0) {
                    patients = list;
                    break;
                }
            }
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
