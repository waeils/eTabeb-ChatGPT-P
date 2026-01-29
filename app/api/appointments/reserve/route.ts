import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { timeslotRTId, patientId } = body;

        if (!timeslotRTId || !patientId) {
            return NextResponse.json(
                { error: 'Timeslot ID and Patient ID are required' },
                { status: 400 }
            );
        }

        // Call real eTabeb ReserveSlot API
        const response = await fetch('https://etapisd.etabeb.com/api/AI/ReserveSlot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                TimeslotRTId4Reserve: timeslotRTId,
                PatientId: patientId,
                TimeslotStatusMapId4Rese: 1002, // Static value from user screenshot
            }),
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();

        // Check if reservation was successful
        // Typical eTabeb response has rpStatus > 0 for success
        const isSuccess = data.rpStatus && data.rpStatus > 0;

        return NextResponse.json({
            success: isSuccess,
            rpStatus: data.rpStatus,
            message: isSuccess ? 'Appointment reserved successfully' : (data.rpMsg || 'Reservation failed'),
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
