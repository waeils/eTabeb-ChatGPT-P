import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Require medicalFacilityDoctorSpecialityRTId
        if (!body.medicalFacilityDoctorSpecialityRTId) {
            return NextResponse.json(
                { error: 'medicalFacilityDoctorSpecialityRTId is required' },
                { status: 400 }
            );
        }

        const response = await fetch('https://etapisd.etabeb.com/api/AI/DoctorTimeslotList', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const timeslots = await response.json();

        console.log('========== TIMESLOTS API RESPONSE ==========');
        console.log('First slot sample:', JSON.stringify(timeslots[0], null, 2));
        console.log('Total slots:', timeslots.length);
        console.log('===========================================');

        // Filter by date if provided, otherwise show next 7 days
        const today = new Date();
        const maxDate = new Date();
        maxDate.setDate(today.getDate() + 7);

        const filteredSlots = timeslots.filter((slot: any) => {
            const slotDate = new Date(slot.timeslotDateStart);
            return slotDate >= today && slotDate <= maxDate;
        });

        // Limit to 50 slots to avoid ResponseTooLargeError
        const limitedSlots = filteredSlots.slice(0, 50);

        // Transform to minimal fields for ChatGPT (avoid ResponseTooLargeError)
        const transformedTimeslots = limitedSlots.map((slot: any) => ({
            date: slot.timeslotDateStart,
            time: `${slot.timeslotTimeStart} - ${slot.timeslotTimeEnd}`,
            available: true,
        }));

        return NextResponse.json(transformedTimeslots);
    } catch (error) {
        console.error('Error fetching timeslots:', error);
        return NextResponse.json(
            { error: 'Failed to fetch timeslots' },
            { status: 500 }
        );
    }
}
