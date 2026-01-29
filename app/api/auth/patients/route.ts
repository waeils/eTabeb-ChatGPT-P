import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('Patients Request Body:', JSON.stringify(body));

        // Extract the ID from all possible sources
        const rawData = body.data || {};
        const rawId = body.sessionId || body.userId || rawData.sessionId || rawData.rpValue || rawData.UserSessionId;
        const sessionId = typeof rawId === 'string' ? parseInt(rawId) : rawId;

        // Payloads to try, starting with the exact Postman format
        const payloads = [
            { "SessionId": sessionId },
            { "SessionId": sessionId?.toString() },
            { "SessionId": parseInt(body.userId) },
            { "SessionId": body.userId }
        ].filter(p => p.SessionId !== undefined && p.SessionId !== null && !isNaN(Number(p.SessionId)));

        let patients: any[] = [];
        const endpoint = 'https://etapisd.etabeb.com/api/AI/UserPatientList4Reserve';

        for (const payload of payloads) {
            console.log('Trying Patients API with payload:', JSON.stringify(payload));
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('API Result for payload:', JSON.stringify(result));
                    // Postman shows a flat array, but we handle { PatientList: [] } just in case
                    const list = Array.isArray(result) ? result : (result.PatientList || result.patientList || []);
                    if (list && list.length > 0) {
                        patients = list;
                        break;
                    }
                }
            } catch (pErr) {
                console.error('Payload attempt failed:', pErr);
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
