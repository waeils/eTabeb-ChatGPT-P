import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const response = await fetch('https://etapisd.etabeb.com/api/AI/GetLstHospital', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const hospitals = await response.json();

        // Transform the API response
        const transformedHospitals = hospitals.map((hospital: any) => ({
            id: hospital.medicalFacilityId,
            name: hospital.medicalFacilityNameEng,
            nameArabic: hospital.medicalFacilityNameOTE,
        }));

        return NextResponse.json(transformedHospitals);
    } catch (error) {
        console.error('Error fetching hospitals:', error);
        return NextResponse.json(
            { error: 'Failed to fetch hospitals' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const response = await fetch('https://etapisd.etabeb.com/api/AI/GetLstHospital', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const hospitals = await response.json();

        const transformedHospitals = hospitals.map((hospital: any) => ({
            id: hospital.medicalFacilityId,
            name: hospital.medicalFacilityNameEng,
            nameArabic: hospital.medicalFacilityNameOTE,
        }));

        return NextResponse.json(transformedHospitals);
    } catch (error) {
        console.error('Error fetching hospitals:', error);
        return NextResponse.json(
            { error: 'Failed to fetch hospitals' },
            { status: 500 }
        );
    }
}
