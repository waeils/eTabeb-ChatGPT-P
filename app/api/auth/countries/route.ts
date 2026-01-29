import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const response = await fetch('https://etapisd.etabeb.com/api/AI/CountryListForContact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const countries = await response.json();

        // Transform the API response
        const transformedCountries = countries.map((country: any) => ({
            id: country.value,
            code: country.text,
            name: country.text2,
            nameArabic: country.text3,
            flag: country.text1,
        }));

        return NextResponse.json(transformedCountries);
    } catch (error) {
        console.error('Error fetching countries:', error);
        return NextResponse.json(
            { error: 'Failed to fetch countries' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const response = await fetch('https://etapisd.etabeb.com/api/AI/CountryListForContact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const countries = await response.json();

        const transformedCountries = countries.map((country: any) => ({
            id: country.value,
            code: country.text,
            name: country.text2,
            nameArabic: country.text3,
            flag: country.text1,
        }));

        return NextResponse.json(transformedCountries);
    } catch (error) {
        console.error('Error fetching countries:', error);
        return NextResponse.json(
            { error: 'Failed to fetch countries' },
            { status: 500 }
        );
    }
}
