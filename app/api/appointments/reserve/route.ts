import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { timeslotRTId, patientId, sessionId } = body;

        console.log('========== RESERVE APPOINTMENT REQUEST ==========');
        console.log('Request Body:', JSON.stringify(body, null, 2));
        console.log('timeslotRTId:', timeslotRTId);
        console.log('patientId:', patientId);
        console.log('sessionId:', sessionId);
        console.log('================================================');

        if (!timeslotRTId || !patientId) {
            console.error('Missing required parameters:', { timeslotRTId, patientId });
            return NextResponse.json(
                { error: 'Timeslot ID and Patient ID are required' },
                { status: 400 }
            );
        }

        // Build payload exactly as Postman - no SessionId needed
        const payload = {
            TimeslotRTId4Reserve: timeslotRTId,
            PatientId: patientId,
            TimeslotStatusMapId4Reserve: 1002  // Fixed: was TimeslotStatusMapId4Rese
        };

        console.log('========== CALLING RESERVE API ==========');
        console.log('Endpoint: https://etapisd.etabeb.com/api/AI/ReserveSlot');
        console.log('Payload:', JSON.stringify(payload, null, 2));
        console.log('=========================================');

        // Call real eTabeb ReserveSlot API
        const response = await fetch('https://etapisd.etabeb.com/api/AI/ReserveSlot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'eTabeb-Web-App',
            },
            body: JSON.stringify(payload),
        });

        console.log('========== RESERVE API RESPONSE ==========');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('==========================================');

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();
        
        console.log('========== RESERVE API RESULT ==========');
        console.log('Full Response:', JSON.stringify(data, null, 2));
        console.log('rpStatus:', data.rpStatus);
        console.log('rpStatus type:', typeof data.rpStatus);
        console.log('rpMsg:', data.rpMsg);
        console.log('========================================');

        // Check if reservation was successful
        // rpStatus can be a number (> 0 for success) or string ("Success" or "Fail")
        const isSuccess = (typeof data.rpStatus === 'number' && data.rpStatus > 0) || 
                         (typeof data.rpStatus === 'string' && data.rpStatus.toLowerCase() === 'success');

        // Parse error message - API returns messages separated by ¦
        let errorMessage = data.rpMsg || 'Reservation failed';
        if (!isSuccess && data.rpMsg) {
            // Split by ¦ and take the first unique message
            const messages = data.rpMsg.split('¦').filter((msg: string, index: number, arr: string[]) => 
                arr.indexOf(msg) === index
            );
            errorMessage = messages[0] || errorMessage;
        }

        console.log('========== BOOKING RESULT ==========');
        console.log('Success:', isSuccess);
        console.log('Error Message:', errorMessage);
        console.log('====================================');

        return NextResponse.json({
            success: isSuccess,
            rpStatus: data.rpStatus,
            message: isSuccess ? 'Appointment reserved successfully' : errorMessage,
            reservationId: data.rpValue || data.reservationId,
            data: data
        });
    } catch (error) {
        console.error('Error reserving slot:', error);
        return NextResponse.json(
            { error: 'Failed to reserve appointment' },
            { status: 500 }
        );
    }
}
