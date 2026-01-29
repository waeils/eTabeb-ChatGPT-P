import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('========== PATIENTS API REQUEST ==========');
        console.log('Full Request Body:', JSON.stringify(body, null, 2));
        console.log('body.sessionId:', body.sessionId);
        console.log('body.userId:', body.userId);
        console.log('body.data:', body.data);
        console.log('==========================================');

        // Extract the ID from all possible sources
        const rawData = body.data || {};
        
        // Avoid using rpValue if it's 1 (success flag, not a session ID)
        const rpValueCandidate = rawData.rpValue && rawData.rpValue > 1 ? rawData.rpValue : null;
        const rawId = body.sessionId || body.userId || rawData.sessionId || rawData.UserSessionId || rpValueCandidate;
        
        console.log('========== SESSION ID EXTRACTION ==========');
        console.log('rawData.rpValue:', rawData.rpValue);
        console.log('rpValueCandidate:', rpValueCandidate);
        console.log('rawId (before conversion):', rawId);
        console.log('rawId type:', typeof rawId);
        console.log('==========================================');
        
        // Strictly convert to Number as per PROJECT_STATUS fix
        const sessionId = typeof rawId === 'string' ? parseInt(rawId, 10) : Number(rawId);

        console.log('========== SESSION ID VALIDATION ==========');
        console.log('sessionId (after conversion):', sessionId);
        console.log('sessionId type:', typeof sessionId);
        console.log('isNaN(sessionId):', isNaN(sessionId));
        console.log('sessionId <= 1:', sessionId <= 1);
        console.log('==========================================');

        // Validate we have a valid numeric session ID
        if (!sessionId || isNaN(sessionId) || sessionId <= 1) {
            console.error('❌ INVALID SESSION ID - Returning empty patient list');
            console.error('Session ID value:', sessionId);
            console.error('Full body:', JSON.stringify(body, null, 2));
            return NextResponse.json([]);
        }

        // Use only the strict Number format as per Postman alignment
        const payload = { "SessionId": sessionId };

        let patients: any[] = [];
        const endpoint = 'https://etapisd.etabeb.com/api/AI/UserPatientList4Reserve';

        console.log('Calling Patients API with payload:', JSON.stringify(payload));
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('API Result:', JSON.stringify(result));
                // Postman shows a flat array, but we handle { PatientList: [] } just in case
                const list = Array.isArray(result) ? result : (result.PatientList || result.patientList || []);
                if (list && list.length > 0) {
                    patients = list;
                }
            } else {
                console.error('API returned non-OK status:', response.status);
            }
        } catch (apiErr) {
            console.error('API call failed:', apiErr);
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
