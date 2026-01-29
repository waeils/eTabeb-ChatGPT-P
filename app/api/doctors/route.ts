import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Use DoctorListWithSearchNames if SearchText contains a name (more than 2 words or specific patterns)
        // Otherwise use regular DoctorList for specialty/facility search
        const searchText = body.SearchText || '';
        const useNameSearch = searchText.split(' ').length >= 2 || /^dr\./i.test(searchText);
        
        const apiEndpoint = useNameSearch 
            ? 'https://etapisd.etabeb.com/api/AI/DoctorListWithSearchNames'
            : 'https://etapisd.etabeb.com/api/AI/DoctorList';

        console.log(`Using ${useNameSearch ? 'Name' : 'General'} search API for: "${searchText}"`);

        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const doctors = await response.json();

        // For web app: return all doctors for client-side filtering
        // For ChatGPT: limit to 10 (handled by query param)
        const limit = body.limit || doctors.length;
        const transformedDoctors = doctors
            .slice(0, limit)
            .map((doctor: any) => ({
                id: doctor.medicalFacilityDoctorSpecialityRTId.toString(),
                doctorId: doctor.doctorId.toString(),
                name: doctor.doctorName.trim(),
                nameArabic: doctor.doctorNameOTE,
                specialty: doctor.medicalSpecialityText,
                specialtyArabic: doctor.medicalSpecialityTextOTE,
                facility: doctor.medicalFacilityName,
                facilityArabic: doctor.medicalFacilityNameOTE,
                rating: doctor.ratingAvg || 0,
                price: doctor.priceRateMin,
                currency: doctor.currencyCode,
                timeslotCount: doctor.timeslotCount,
                image: doctor.picURL01,
                medicalFacilityDoctorSpecialityRTId: doctor.medicalFacilityDoctorSpecialityRTId,
            }));

        return NextResponse.json(transformedDoctors);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        return NextResponse.json(
            { error: 'Failed to fetch doctors' },
            { status: 500 }
        );
    }
}

export async function GET() {
    // Allow GET requests to fetch all doctors
    try {
        const response = await fetch('https://etapisd.etabeb.com/api/AI/DoctorList', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const doctors = await response.json();

        // Transform the API response
        const transformedDoctors = doctors.map((doctor: any) => ({
            id: doctor.medicalFacilityDoctorSpecialityRTId.toString(),
            doctorId: doctor.doctorId.toString(),
            name: doctor.doctorName.trim(),
            nameArabic: doctor.doctorNameOTE,
            specialty: doctor.medicalSpecialityText,
            specialtyArabic: doctor.medicalSpecialityTextOTE,
            facility: doctor.medicalFacilityName,
            facilityArabic: doctor.medicalFacilityNameOTE,
            rating: doctor.ratingAvg || 0,
            ratingText: doctor.ratingText,
            ratingCount: doctor.ratingCount,
            timeslotCount: doctor.timeslotCount,
            price: doctor.priceRateMin,
            currency: doctor.currencyCode,
            image: doctor.picURL01,
            isFavourite: doctor.isFavourite,
            medicalFacilityDoctorSpecialityRTId: doctor.medicalFacilityDoctorSpecialityRTId,
        }));

        return NextResponse.json(transformedDoctors);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        return NextResponse.json(
            { error: 'Failed to fetch doctors' },
            { status: 500 }
        );
    }
}
