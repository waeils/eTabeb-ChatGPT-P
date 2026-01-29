import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { mobileNumber } = body;

        if (!mobileNumber) {
            return NextResponse.json(
                { error: 'Mobile number (cellNo) is required' },
                { status: 400 }
            );
        }

        // Call real eTabeb SearchUser API to get user session
        const response = await fetch('https://etapisd.etabeb.com/api/AI/SearchUser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                loginId: mobileNumber // As per user screenshot: loginId maps to cellNo
            }),
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();

        // data is likely an array or object containing userSessionId
        // As per user screenshot: $[0].usersSessionId
        const sessionId = data[0]?.usersSessionId || data.usersSessionId || null;

        return NextResponse.json({
            success: !!sessionId,
            sessionId: sessionId,
            data: data
        });
    } catch (error) {
        console.error('Error searching user:', error);
        return NextResponse.json(
            { error: 'Failed to search user' },
            { status: 500 }
        );
    }
}
