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

        // Transform and group timeslots by date
        const transformedTimeslots = timeslots.map((slot: any) => ({
            id: slot.timeslotRTId,
            doctorId: slot.doctorId,
            doctorName: slot.doctorName,
            doctorNameArabic: slot.doctorNameOTE,
            specialty: slot.medicalSpecialityTextEng,
            specialtyArabic: slot.medicalSpecialityTextOTE,
            facility: slot.medicalFacilityName,
            facilityId: slot.medicalFacilityId,
            medicalFacilityDoctorSpecialityRTId: slot.medicalFacilityDoctorSpecialityRTId,
            dateStart: slot.timeslotDateStart,
            dateEnd: slot.timeslotDateEnd,
            timeStart: slot.timeslotTimeStart,
            timeEnd: slot.timeslotTimeEnd,
            // Format for display
            date: slot.timeslotDateStart,
            time: `${slot.timeslotTimeStart} - ${slot.timeslotTimeEnd}`,
            // Temporarily set all to available - will fix based on actual API field
            available: true,
            timeslotStatusMapId: slot.timeslotStatusMapId,
            timeslotStatus: slot.timeslotStatus,
            timeslotStatusText: slot.timeslotStatusText,
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
