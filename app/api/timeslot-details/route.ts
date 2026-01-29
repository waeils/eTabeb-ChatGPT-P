import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { timeslotId } = body;

        if (!timeslotId) {
            return NextResponse.json(
                { error: 'timeslotId is required' },
                { status: 400 }
            );
        }

        // Call eTabeb API to get timeslot details
        const endpoint = 'https://etapisd.etabeb.com/api/AI/TimeslotDetails';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                timeslotRTId: parseInt(timeslotId),
            }),
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();

        console.log('========== TIMESLOT DETAILS API RESPONSE ==========');
        console.log('Full Response:', JSON.stringify(data, null, 2));
        console.log('==================================================');

        // Extract appointment details from response
        const details = {
            timeslotId: data.timeslotRTId,
            doctorId: data.doctorId,
            doctorName: data.doctorName,
            facility: data.medicalFacilityName,
            facilityArabic: data.medicalFacilityNameOTE,
            specialty: data.medicalSpecialityText,
            specialtyArabic: data.medicalSpecialityTextOTE,
            date: data.timeslotDateStart,
            timeStart: data.timeslotTimeStart,
            timeEnd: data.timeslotTimeEnd,
            dateTime: `${data.timeslotDateStart} - ${data.timeslotTimeStart}`,
            price: data.priceRateMin,
            currency: data.currencyCode,
        };

        return NextResponse.json(details);
    } catch (error) {
        console.error('Error fetching timeslot details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch timeslot details' },
            { status: 500 }
        );
    }
}
