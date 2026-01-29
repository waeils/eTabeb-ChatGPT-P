import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const response = await fetch('https://etapisd.etabeb.com/api/AI/ResidentIdentityTypes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const identityTypes = await response.json();

        return NextResponse.json(identityTypes);
    } catch (error) {
        console.error('Error fetching identity types:', error);
        return NextResponse.json(
            { error: 'Failed to fetch identity types' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const response = await fetch('https://etapisd.etabeb.com/api/AI/ResidentIdentityTypes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const identityTypes = await response.json();

        return NextResponse.json(identityTypes);
    } catch (error) {
        console.error('Error fetching identity types:', error);
        return NextResponse.json(
            { error: 'Failed to fetch identity types' },
            { status: 500 }
        );
    }
}
