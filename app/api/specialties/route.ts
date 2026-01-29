import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const response = await fetch('https://etapisd.etabeb.com/api/AI/SpecialitiesList', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const specialties = await response.json();

        // Transform the API response
        const transformedSpecialties = specialties.map((specialty: any) => ({
            id: specialty.value,
            code: specialty.code,
            name: specialty.text,
            nameArabic: specialty.text2,
        }));

        return NextResponse.json(transformedSpecialties);
    } catch (error) {
        console.error('Error fetching specialties:', error);
        return NextResponse.json(
            { error: 'Failed to fetch specialties' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const response = await fetch('https://etapisd.etabeb.com/api/AI/SpecialitiesList', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const specialties = await response.json();

        const transformedSpecialties = specialties.map((specialty: any) => ({
            id: specialty.value,
            code: specialty.code,
            name: specialty.text,
            nameArabic: specialty.text2,
        }));

        return NextResponse.json(transformedSpecialties);
    } catch (error) {
        console.error('Error fetching specialties:', error);
        return NextResponse.json(
            { error: 'Failed to fetch specialties' },
            { status: 500 }
        );
    }
}
