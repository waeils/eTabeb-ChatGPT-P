"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Country = {
    id: number;
    name: string;
    code: string;
    flag: string;
};

type Patient = {
    patientId: number;
    patientName: string;
    mobileNo: string;
};

function BookingContent() {
    const searchParams = useSearchParams();
    
    // URL Parameters
    const timeslotId = searchParams.get('timeslotId') || '';
    const doctorName = searchParams.get('doctorName') || '';
    const facility = searchParams.get('facility') || '';
    const dateTime = searchParams.get('dateTime') || '';
    
    // Auth States
    const [countries, setCountries] = useState<Country[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const [mobileNumber, setMobileNumber] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [signOTPId, setSignOTPId] = useState("");
    const [sessionId, setSessionId] = useState("");
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'phone' | 'otp' | 'patient' | 'confirmed'>('phone');
    const [confirmationMessage, setConfirmationMessage] = useState("");

    // Load countries
    useEffect(() => {
        async function loadCountries() {
            try {
                const res = await fetch('/api/auth/countries');
                const data = await res.json();
                setCountries(data);
                setSelectedCountry(data.find((c: any) => c.code === "+966") || data[0]);
            } catch (err) {
                console.error("Load countries error:", err);
            }
        }
        loadCountries();
    }, []);

    // Send OTP
    const handleSendOTP = async () => {
        if (!mobileNumber || !selectedCountry) {
            setError("Please enter mobile number");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Search user first
            const searchRes = await fetch('/api/auth/search-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mobileNo: mobileNumber,
                    countryId: selectedCountry.id
                })
            });
            const searchData = await searchRes.json();
            
            if (searchData.sessionId) {
                setSessionId(searchData.sessionId);
            }

            // Send OTP
            const otpRes = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mobileNo: mobileNumber,
                    countryId: selectedCountry.id
                })
            });
            const otpData = await otpRes.json();
            
            if (otpData.signOTPId) {
                setSignOTPId(otpData.signOTPId);
                setStep('otp');
            } else {
                setError("Failed to send OTP");
            }
        } catch (err) {
            setError("Error sending OTP");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Verify OTP
    const handleVerifyOTP = async () => {
        if (!otpCode) {
            setError("Please enter OTP code");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    signOTPId,
                    otpCode,
                    mobileNo: mobileNumber,
                    countryId: selectedCountry?.id
                })
            });
            const data = await res.json();

            if (data.verified) {
                const verifiedSessionId = data.sessionId || sessionId;
                setSessionId(verifiedSessionId);

                // Fetch patients
                const patientsRes = await fetch('/api/auth/patients', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: verifiedSessionId })
                });
                const patientsData = await patientsRes.json();

                if (patientsData && patientsData.length > 0) {
                    setPatients(patientsData);
                    setStep('patient');
                } else {
                    setError("No patients found for this account");
                }
            } else {
                setError("Invalid OTP code");
            }
        } catch (err) {
            setError("Error verifying OTP");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Confirm Booking
    const handleConfirmBooking = async () => {
        if (!selectedPatientId) {
            setError("Please select a patient");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/appointments/reserve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timeslotRTId: parseInt(timeslotId),
                    patientId: selectedPatientId,
                    sessionId
                })
            });
            const data = await res.json();

            if (data.success) {
                setConfirmationMessage(data.message || "Booking confirmed successfully!");
                setStep('confirmed');
                
                // Notify parent window if in iframe
                if (window.parent !== window) {
                    window.parent.postMessage({
                        type: 'BOOKING_COMPLETE',
                        appointmentId: timeslotId
                    }, '*');
                }
            } else {
                setError(data.error || "Booking failed");
            }
        } catch (err) {
            setError("Error confirming booking");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
                    <p className="text-sm text-gray-500 mt-1">Complete your booking securely</p>
                </div>

                {/* Appointment Summary */}
                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                    <h2 className="font-semibold text-gray-900 mb-3">Appointment Details</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Doctor:</span>
                            <span className="font-medium text-gray-900">{doctorName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Facility:</span>
                            <span className="font-medium text-gray-900">{facility}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Date & Time:</span>
                            <span className="font-medium text-gray-900">{dateTime}</span>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {/* Step 1: Phone Number */}
                {step === 'phone' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mobile Number
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={selectedCountry?.id || ''}
                                    onChange={(e) => setSelectedCountry(countries.find(c => c.id === parseInt(e.target.value)) || null)}
                                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {countries.map(country => (
                                        <option key={country.id} value={country.id}>
                                            {country.code}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="tel"
                                    value={mobileNumber}
                                    onChange={(e) => setMobileNumber(e.target.value)}
                                    placeholder="5XXXXXXXX"
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleSendOTP}
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {isLoading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </div>
                )}

                {/* Step 2: OTP Verification */}
                {step === 'otp' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Enter OTP Code
                            </label>
                            <input
                                type="text"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                placeholder="Enter 6-digit code"
                                maxLength={6}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                            />
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                OTP sent to {selectedCountry?.code} {mobileNumber}
                            </p>
                        </div>
                        <button
                            onClick={handleVerifyOTP}
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {isLoading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                    </div>
                )}

                {/* Step 3: Patient Selection */}
                {step === 'patient' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Patient
                            </label>
                            <div className="space-y-2">
                                {patients.map(patient => (
                                    <label
                                        key={patient.patientId}
                                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                                            selectedPatientId === patient.patientId
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-300 hover:border-blue-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="patient"
                                            value={patient.patientId}
                                            checked={selectedPatientId === patient.patientId}
                                            onChange={() => setSelectedPatientId(patient.patientId)}
                                            className="mr-3"
                                        />
                                        <div>
                                            <div className="font-medium text-gray-900">{patient.patientName}</div>
                                            <div className="text-sm text-gray-500">{patient.mobileNo}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={handleConfirmBooking}
                            disabled={isLoading || !selectedPatientId}
                            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {isLoading ? 'Confirming...' : 'Confirm Booking'}
                        </button>
                    </div>
                )}

                {/* Step 4: Confirmation */}
                {step === 'confirmed' && (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                        <p className="text-gray-600 mb-4">{confirmationMessage}</p>
                        <div className="bg-green-50 rounded-lg p-4 text-left">
                            <p className="text-sm text-gray-700">
                                <strong>Doctor:</strong> {doctorName}<br />
                                <strong>Facility:</strong> {facility}<br />
                                <strong>Date & Time:</strong> {dateTime}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function QuickBooking() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading booking...</p>
                </div>
            </div>
        }>
            <BookingContent />
        </Suspense>
    );
}
