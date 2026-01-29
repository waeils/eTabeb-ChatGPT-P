import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { mobileNumber, countryId } = body;

        if (!mobileNumber) {
            return NextResponse.json(
                { error: 'Mobile number (cellNo) is required' },
                { status: 400 }
            );
        }

        console.log('🔍 Searching user with mobile:', mobileNumber);

        // Call real eTabeb SearchUser API to get user session
        const endpoint = 'https://etapisd.etabeb.com/api/AI/SearchUser';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                loginId: mobileNumber,  // API expects loginId, not mobileNo
            }),
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();

        console.log('========== SEARCH USER API RESPONSE ==========');
        console.log('Full Response:', JSON.stringify(data, null, 2));
        console.log('==============================================');

        // API returns an array with user data
        // Extract userSessionId from the response (field name: usersSessionId)
        const userData = Array.isArray(data) ? data[0] : data;
        const sessionId = userData?.usersSessionId || userData?.userSessionId || userData?.UserSessionId || null;
        const userId = userData?.userId || null;
        const userExists = !!sessionId;

        console.log('========== USER SEARCH RESULT ==========');
        console.log('User exists:', userExists);
        console.log('Session ID:', sessionId);
        console.log('User ID:', userId);
        console.log('========================================');

        return NextResponse.json({
            success: true,
            userExists: userExists,
            sessionId: sessionId,
            userId: userId,
            userData: userData
        });
    } catch (error) {
        console.error('Error searching user:', error);
        return NextResponse.json(
            { error: 'Failed to search user' },
            { status: 500 }
        );
    }
}
