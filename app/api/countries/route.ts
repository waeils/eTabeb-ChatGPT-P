import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const endpoint = 'https://etapisd.etabeb.com/api/AI/CountryListForContact';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Countries API Response:', data);

        // Return the countries array
        return NextResponse.json(data.rpValue || []);
    } catch (error) {
        console.error('Error fetching countries:', error);
        // Return fallback countries
        return NextResponse.json([
            { countryId: 1, countryName: 'Saudi Arabia', countryKey: '+966' },
            { countryId: 2, countryName: 'UAE', countryKey: '+971' },
            { countryId: 3, countryName: 'Kuwait', countryKey: '+965' }
        ]);
    }
}
