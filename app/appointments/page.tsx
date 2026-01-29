"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    useWidgetProps,
    useMaxHeight,
    useDisplayMode,
    useRequestDisplayMode,
} from "../hooks";

type TimeSlot = {
    id: string;
    time: string;
    available: boolean;
    date: string;
    timeslotRTId?: number;
};

type Doctor = {
    id: string; // medicalFacilityDoctorSpecialityRTId
    doctorId: string;
    name: string;
    nameArabic?: string;
    specialty: string;
    specialtyArabic?: string;
    facility: string;
    facilityArabic?: string;
    image: string;
    rating: number;
    ratingText?: string;
    price?: string;
    currency?: string;
    medicalFacilityDoctorSpecialityRTId?: number;
};

type Country = {
    id: number;
    name: string;
    code: string;
    flag: string;
};

type IdentityType = {
    value: number;
    text: string;
    text2: string;
};

type Patient = {
    patientId: number;
    patientName: string;
    mobileNo: string;
};

type AppointmentData = {
    doctors?: Doctor[];
    selectedDoctor?: Doctor;
    availableSlots?: TimeSlot[];
    date?: string;
};

type AuthStep = "phone" | "otp" | "register" | "pick-patient" | "verified";

export default function AppointmentBooking() {
    const toolOutput = useWidgetProps<AppointmentData>();
    const maxHeight = useMaxHeight() ?? undefined;
    const displayMode = useDisplayMode();
    const requestDisplayMode = useRequestDisplayMode();

    // Booking States
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(toolOutput?.selectedDoctor || null);
    const [timeslots, setTimeslots] = useState<TimeSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [bookingConfirmed, setBookingConfirmed] = useState(false);
    const [confirmationId, setConfirmationId] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // Auth States
    const [countries, setCountries] = useState<Country[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const [mobileNumber, setMobileNumber] = useState("");
    const [authStep, setAuthStep] = useState<AuthStep>("phone");
    const [otpCode, setOtpCode] = useState("");
    const [signOTPId, setSignOTPId] = useState("");
    const [sessionId, setSessionId] = useState("");
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Registration States
    const [identityTypes, setIdentityTypes] = useState<IdentityType[]>([]);
    const [selectedIdentityType, setSelectedIdentityType] = useState<IdentityType | null>(null);
    const [identityNumber, setIdentityNumber] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");

    // Initial Data Fetching
    useEffect(() => {
        async function init() {
            setLoading(true);
            try {
                // Fetch Countries
                const cRes = await fetch('/api/auth/countries');
                const cData = await cRes.json();
                setCountries(cData);
                setSelectedCountry(cData.find((c: any) => c.code === "+966") || cData[0]);

                // Initial fetch for doctors (Jeddah by default)
                // The user mentioned the API is fixed to return all doctors
                const dRes = await fetch('/api/doctors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ CityId: 1 })
                });
                const dData = await dRes.json();
                setDoctors(dData);
            } catch (err) {
                console.error("Init error:", err);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, []);

    // Search doctors via API when user types
    useEffect(() => {
        if (!searchTerm) {
            // Load all doctors when search is cleared
            async function loadAllDoctors() {
                setLoading(true);
                try {
                    const res = await fetch('/api/doctors', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ CityId: 1 })
                    });
                    const data = await res.json();
                    setDoctors(data);
                } catch (err) {
                    console.error("Load doctors error:", err);
                } finally {
                    setLoading(false);
                }
            }
            loadAllDoctors();
            return;
        }

        // Debounce API call
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/doctors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        SearchText: searchTerm,
                        CityId: 1 
                    })
                });
                const data = await res.json();
                setDoctors(data);
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setLoading(false);
            }
        }, 500); // Wait 500ms after user stops typing

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Filtered Doctors (Client-side for instant feedback)
    const filteredDoctors = doctors;

    // Fetch Timeslots when doctor changes
    useEffect(() => {
        const docId = selectedDoctor?.medicalFacilityDoctorSpecialityRTId;
        if (!docId) return;

        async function fetchSlots() {
            setLoadingSlots(true);
            try {
                const res = await fetch('/api/timeslots', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        medicalFacilityDoctorSpecialityRTId: docId
                    }),
                });
                const data = await res.json();
                const slots = data.map((s: any) => ({
                    id: s.id?.toString() || s.timeslotRTId?.toString(),
                    time: s.time,
                    date: s.date,
                    available: s.available,
                    timeslotRTId: s.id || s.timeslotRTId
                }));
                setTimeslots(slots);

                // Auto-select first date with available slots
                if (slots.length > 0) {
                    const uniqueDates = Array.from(new Set(slots.map((s: any) => s.date))).sort() as string[];
                    setSelectedDate(uniqueDates[0]);
                }
            } catch (err) {
                console.error("Slots error:", err);
            } finally {
                setLoadingSlots(false);
            }
        }
        fetchSlots();
    }, [selectedDoctor]);

    // Fetch Identity Types for registration
    useEffect(() => {
        if (authStep === "register") {
            async function fetchIdTypes() {
                try {
                    const res = await fetch('/api/auth/identity-types');
                    const data = await res.json();
                    setIdentityTypes(data);
                    if (data.length > 0) setSelectedIdentityType(data[0]);
                } catch (err) {
                    console.error("ID types error:", err);
                }
            }
            fetchIdTypes();
        }
    }, [authStep]);

    // Auth Handlers
    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mobileNumber || !selectedCountry) return;

        setIsAuthLoading(true);
        setError(null);
        try {
            // Step 1: Search for user to get userSessionId
            const searchRes = await fetch('/api/auth/search-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobileNumber }),
            });
            const searchData = await searchRes.json();
            
            console.log('User search result:', searchData);
            
            // Store the userSessionId if user exists
            if (searchData.userExists && searchData.sessionId) {
                setSessionId(searchData.sessionId);
                console.log('User found with session ID:', searchData.sessionId);
            }
            
            // Step 2: Send OTP (whether user exists or not)
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mobileNumber,
                    countryId: selectedCountry.id
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSignOTPId(data.signOTPId);
                setAuthStep("otp");
            } else {
                setError(data.message || "Failed to send OTP");
            }
        } catch (err) {
            setError("Connection error. Please try again.");
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otpCode.length < 4) return;

        setIsAuthLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otpCode, signOTPId }),
            });
            const data = await res.json();
            if (data.isVerified) {
                // Check if we have a sessionId from SearchUser (stored in state)
                if (sessionId) {
                    console.log('User exists, fetching patients with session ID:', sessionId);
                    // User exists, fetch their patient list using the userSessionId from SearchUser
                    fetchPatients({ sessionId });
                } else {
                    // New user, go to registration
                    console.log('New user, redirecting to registration');
                    setAuthStep("register");
                }
            } else {
                setError("Invalid verification code");
            }
        } catch (err) {
            setError("Verification failed");
        } finally {
            setIsAuthLoading(false);
        }
    };

    const fetchPatients = async (params: { sessionId: string }) => {
        setIsAuthLoading(true);
        try {
            console.log('Fetching patients with session ID:', params.sessionId);
            const res = await fetch('/api/auth/patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: params.sessionId }),
            });
            const data = await res.json();

            console.log('Patient list response:', data);

            // Flexibly handle array or object with PatientList property
            const list = Array.isArray(data) ? data : (data.PatientList || data.patientList || []);

            if (list.length > 0) {
                // Normalize names and IDs
                const normalized = list.map((p: any) => ({
                    patientId: p.patientId || p.Id || p.id || p.userId,
                    patientName: p.patientName || p.name || p.Name || 'Patient',
                    mobileNo: p.mobileNo || p.mobileNumber || p.MobileNumber || ''
                }));
                setPatients(normalized);
                setAuthStep("pick-patient");
                if (normalized.length === 1) {
                    setSelectedPatientId(normalized[0].patientId);
                }
            } else {
                console.log('No patients found, redirecting to registration');
                setAuthStep("register");
            }
        } catch (err) {
            console.error("Failed to fetch patient list:", err);
            setAuthStep("register");
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleRegistrationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedIdentityType || !identityNumber || !firstName || !lastName) return;

        setIsAuthLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mobileNumber,
                    countryCode: selectedCountry?.code,
                    countryId: selectedCountry?.id,
                    identityType: selectedIdentityType.value,
                    identityNumber,
                    firstName,
                    lastName,
                    email
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSessionId(data.data.sessionId);
                const pid = data.data.userId;
                setSelectedPatientId(pid);
                confirmFinalBooking(pid);
            } else {
                setError(data.message || "Registration failed");
            }
        } catch (err) {
            setError("Registration failed. Please check your data.");
        } finally {
            setIsAuthLoading(false);
        }
    };

    const confirmFinalBooking = async (pid: number) => {
        if (!selectedSlot?.timeslotRTId) return;

        setAuthStep("verified");
        setIsAuthLoading(true);
        setError(null);
        try {
            console.log('Confirming booking for patient:', pid, 'timeslot:', selectedSlot.timeslotRTId, 'session:', sessionId);
            const res = await fetch('/api/appointments/reserve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timeslotRTId: selectedSlot.timeslotRTId,
                    patientId: pid,
                    sessionId: sessionId // Include session ID for validation
                }),
            });
            const data = await res.json();
            
            console.log('Booking response:', data);
            
            // Check for success - rpStatus > 0 means success in eTabeb API
            if (data.success && data.rpStatus && data.rpStatus > 0) {
                const confirmId = data.data?.rpValue || data.data?.reservationId || Math.floor(100000 + Math.random() * 900000);
                setConfirmationId(`ET-${confirmId}`);
                setBookingConfirmed(true);
            } else {
                // Show the actual error message from the API
                const errorMsg = data.data?.rpMsg || data.message || "Booking failed. The slot might have been taken.";
                setError(errorMsg);
                setAuthStep("pick-patient");
            }
        } catch (err) {
            console.error('Booking error:', err);
            setError("Booking failed. Please check your connection.");
            setAuthStep("pick-patient");
        } finally {
            setIsAuthLoading(false);
        }
    };

    if (bookingConfirmed) {
        return (
            <div className="min-h-screen bg-[#0F172A] p-6 flex items-center justify-center" style={{ maxHeight }}>
                <div className="max-w-md w-full bg-[#1E293B] rounded-3xl shadow-2xl p-8 text-center space-y-6 animate-fadeIn border border-[#334155]">
                    <div className="w-20 h-20 bg-[#3EBFA5]/20 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-10 h-10 text-[#3EBFA5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white mb-2">Booking Confirmed!</h2>
                        <p className="text-slate-400">Your appointment is secured with eTabeb</p>
                    </div>
                    <div className="bg-[#0F172A] rounded-2xl p-6 space-y-4 text-left border border-[#334155]">
                        <div className="flex justify-between border-b border-[#334155] pb-2">
                            <span className="text-slate-500 text-sm">Confirmation ID</span>
                            <span className="text-[#3EBFA5] font-bold">{confirmationId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 text-sm">Doctor</span>
                            <span className="text-white font-medium">{selectedDoctor?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 text-sm">Time</span>
                            <span className="text-white font-medium">{selectedSlot?.time}</span>
                        </div>
                    </div>
                    <button onClick={() => window.location.reload()} className="w-full bg-[#1976B2] hover:bg-[#1565C0] text-white font-bold py-4 rounded-2xl transition-all shadow-lg">
                        Done
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F172A] text-white p-4 sm:p-8" style={{ maxHeight }}>
            <div className="max-w-6xl mx-auto space-y-10">

                {/* Header */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <img
                        src="/etabeb-logo.png"
                        alt="eTabeb"
                        className="h-16 w-auto"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://etapisd.etabeb.com/Images/logo.png";
                        }}
                    />
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#1976B2] to-[#3EBFA5]">
                            Book Appointment
                        </h1>
                        <div className="flex items-center justify-center gap-2">
                            <span className="px-3 py-1 bg-[#3EBFA5]/20 text-[#3EBFA5] text-xs font-bold rounded-full border border-[#3EBFA5]/30">
                                📍 Operating in Jeddah
                            </span>
                        </div>
                    </div>
                </div>

                {/* Step 1: Doctor */}
                <div className="bg-[#1E293B] rounded-3xl p-6 shadow-xl border border-[#334155]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <span className="w-10 h-10 bg-[#1976B2] text-white rounded-full flex items-center justify-center font-black">1</span>
                            <h2 className="text-xl font-bold">Select Doctor</h2>
                        </div>
                        <div className="relative flex-1 max-w-md">
                            <input
                                type="text"
                                placeholder="Search by name, specialty, or hospital..."
                                className="w-full bg-[#0F172A] border border-[#334155] rounded-xl py-3 px-10 focus:border-[#1976B2] focus:outline-none text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <svg className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? <div className="col-span-full text-center py-20 opacity-50">Loading doctors...</div> :
                            filteredDoctors.length > 0 ? filteredDoctors.map((doc) => (
                                <button key={doc.id} onClick={() => setSelectedDoctor(doc)}
                                    className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${selectedDoctor?.id === doc.id ? 'border-[#1976B2] bg-[#1976B2]/10' : 'border-[#334155] hover:border-slate-500'}`}>
                                    <div className="w-14 h-14 rounded-full bg-slate-700 overflow-hidden flex-shrink-0 relative">
                                        {doc.image && doc.image.startsWith('http') ?
                                            <img src={doc.image} className="w-full h-full object-cover" /> :
                                            <div className="w-full h-full flex items-center justify-center text-2xl">👨‍⚕️</div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold truncate text-sm">{doc.name}</div>
                                        <div className="text-xs text-[#3EBFA5] truncate">{doc.specialty}</div>
                                        <div className="text-[11px] text-slate-400 truncate mt-0.5">🏥 {doc.facility}</div>
                                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-2">
                                            <span>⭐ {doc.rating.toFixed(1)}</span>
                                            <span className="font-bold text-white ml-auto">{doc.price} {doc.currency}</span>
                                        </div>
                                    </div>
                                </button>
                            )) : (
                                <div className="col-span-full text-center py-20 opacity-50 text-slate-400">
                                    No doctors found matching "{searchTerm}"
                                </div>
                            )}
                    </div>
                </div>

                {/* Step 2: Slot */}
                {selectedDoctor && (
                    <div className="bg-[#1E293B] rounded-3xl p-6 shadow-xl border border-[#334155] animate-fadeIn">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="w-10 h-10 bg-[#1976B2] text-white rounded-full flex items-center justify-center font-black">2</span>
                            <h2 className="text-xl font-bold">Available Slots</h2>
                        </div>
                        <div className="flex flex-col gap-6">
                            {/* Date Selector */}
                            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                {Array.from(new Set(timeslots.map(s => s.date))).sort().map((date) => (
                                    <button key={date} onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                                        className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all border-2 ${selectedDate === date ? 'bg-[#1976B2] border-[#1976B2] text-white' : 'bg-[#0F172A] border-[#334155] text-slate-400 hover:border-slate-500'}`}>
                                        {date ? new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Unknown'}
                                    </button>
                                ))}
                            </div>

                            {/* Time Selector */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                {loadingSlots ? <div className="col-span-full py-10 text-center opacity-50">Checking availability...</div> :
                                    timeslots.filter(s => s.date === selectedDate).map((slot) => (
                                        <button key={slot.id} disabled={!slot.available} onClick={() => setSelectedSlot(slot)}
                                            className={`p-3 rounded-xl font-bold text-xs transition-all ${!slot.available ? 'opacity-20 cursor-not-allowed' :
                                                selectedSlot?.id === slot.id ? 'bg-[#3EBFA5] text-[#0F172A] scale-105' : 'bg-[#0F172A] border border-[#334155] hover:border-[#3EBFA5]'}`}>
                                            {slot.time.split(' - ')[0]}
                                        </button>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Secure Auth & Book */}
                {selectedDoctor && selectedSlot && (
                    <div className="bg-[#1E293B] rounded-3xl p-8 shadow-2xl border border-[#1976B2]/30 animate-fadeIn text-center space-y-6">
                        <div className="flex items-center justify-center gap-4">
                            <span className="w-10 h-10 bg-[#3EBFA5] text-[#0F172A] rounded-full flex items-center justify-center font-black">3</span>
                            <h2 className="text-2xl font-black">Secure Verification</h2>
                        </div>

                        {error && <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-sm border border-red-500/20">{error}</div>}

                        {authStep === "phone" ? (
                            <form onSubmit={handlePhoneSubmit} className="max-w-md mx-auto space-y-4">
                                <p className="text-slate-400 text-sm">Please verify your mobile to confirm booking at eTabeb.</p>
                                <div className="flex h-14 bg-[#0F172A] rounded-2xl border border-[#334155] overflow-hidden focus-within:border-[#1976B2] transition-all">
                                    <select className="bg-transparent px-4 border-r border-[#334155] focus:outline-none text-sm font-bold"
                                        value={selectedCountry?.id} onChange={(e) => setSelectedCountry(countries.find(c => c.id === Number(e.target.value)) || null)}>
                                        {countries.map(c => <option key={c.id} value={c.id} className="bg-[#0F172A]">{c.flag} {c.code}</option>)}
                                    </select>
                                    <input type="tel" placeholder="5XXXXXXXX" required className="flex-1 bg-transparent px-4 focus:outline-none font-bold text-lg"
                                        value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
                                </div>
                                <button type="submit" disabled={isAuthLoading} className="w-full bg-[#1976B2] hover:bg-[#1565C0] h-14 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-95 disabled:opacity-50">
                                    {isAuthLoading ? "Sending Code..." : "Send Verification Code"}
                                </button>
                            </form>
                        ) : authStep === "otp" ? (
                            <form onSubmit={handleOtpSubmit} className="max-w-md mx-auto space-y-6">
                                <p className="text-slate-400 text-sm">Enter the code sent to <span className="text-white font-bold">{selectedCountry?.code} {mobileNumber}</span></p>
                                <input type="text" placeholder="● ● ● ●" maxLength={4} required autoFocus
                                    className="w-full text-center text-4xl font-black tracking-[0.5em] bg-[#0F172A] border border-[#334155] h-20 rounded-2xl focus:border-[#3EBFA5] transition-all"
                                    value={otpCode} onChange={(e) => setOtpCode(e.target.value)} />
                                <button type="submit" disabled={isAuthLoading || otpCode.length < 4}
                                    className="w-full bg-[#3EBFA5] hover:bg-[#32A892] text-[#0F172A] h-14 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-95 disabled:opacity-50">
                                    {isAuthLoading ? "Verifying..." : "Verify & Continue"}
                                </button>
                                <button type="button" onClick={() => setAuthStep("phone")} className="text-slate-500 text-sm hover:text-white transition-colors">Change Phone Number</button>
                            </form>
                        ) : authStep === "pick-patient" ? (
                            <div className="max-w-md mx-auto space-y-6">
                                <p className="text-[#3EBFA5] font-bold">Welcome back! Who is the appointment for?</p>
                                <div className="space-y-3">
                                    {patients.map(p => (
                                        <button key={p.patientId} onClick={() => setSelectedPatientId(p.patientId)}
                                            className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between ${selectedPatientId === p.patientId ? 'border-[#3EBFA5] bg-[#3EBFA5]/10' : 'border-[#334155] hover:border-slate-500'}`}>
                                            <div>
                                                <div className="font-bold">{p.patientName}</div>
                                                <div className="text-xs text-slate-400">{p.mobileNo}</div>
                                            </div>
                                            {selectedPatientId === p.patientId && <div className="w-6 h-6 bg-[#3EBFA5] rounded-full flex items-center justify-center"><svg className="w-4 h-4 text-[#0F172A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => selectedPatientId && confirmFinalBooking(selectedPatientId)} disabled={isAuthLoading || !selectedPatientId}
                                    className="w-full bg-[#3EBFA5] hover:bg-[#32A892] text-[#0F172A] h-14 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-95 disabled:opacity-50">
                                    {isAuthLoading ? "Booking..." : "Confirm Booking"}
                                </button>
                            </div>
                        ) : authStep === "register" ? (
                            <form onSubmit={handleRegistrationSubmit} className="max-w-xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                <div className="md:col-span-2 text-center mb-2">
                                    <p className="text-[#3EBFA5] font-bold">New to eTabeb? Let's complete your profile.</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 ml-1">Identity Type *</label>
                                    <select required className="w-full h-12 bg-[#0F172A] border border-[#334155] rounded-xl px-4 focus:border-[#1976B2] focus:outline-none"
                                        value={selectedIdentityType?.value || ''} onChange={(e) => setSelectedIdentityType(identityTypes.find(t => t.value === Number(e.target.value)) || null)}>
                                        {identityTypes.map(t => <option key={t.value} value={t.value} className="bg-[#0F172A]">{t.text}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 ml-1">Identity Number *</label>
                                    <input type="text" required placeholder="ID Number" className="w-full h-12 bg-[#0F172A] border border-[#334155] rounded-xl px-4 focus:border-[#1976B2] focus:outline-none"
                                        value={identityNumber} onChange={(e) => setIdentityNumber(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 ml-1">First Name *</label>
                                    <input type="text" required placeholder="Ahmed" className="w-full h-12 bg-[#0F172A] border border-[#334155] rounded-xl px-4 focus:border-[#1976B2] focus:outline-none"
                                        value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 ml-1">Last Name *</label>
                                    <input type="text" required placeholder="Mohamed" className="w-full h-12 bg-[#0F172A] border border-[#334155] rounded-xl px-4 focus:border-[#1976B2] focus:outline-none"
                                        value={lastName} onChange={(e) => setLastName(e.target.value)} />
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-xs text-slate-400 ml-1">Email (Optional)</label>
                                    <input type="email" placeholder="ahmed@example.com" className="w-full h-12 bg-[#0F172A] border border-[#334155] rounded-xl px-4 focus:border-[#1976B2] focus:outline-none"
                                        value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                                <button type="submit" disabled={isAuthLoading} className="md:col-span-2 w-full bg-[#3EBFA5] hover:bg-[#32A892] text-[#0F172A] h-14 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-95 disabled:opacity-50 mt-4">
                                    {isAuthLoading ? "Processing..." : "Complete Registration & Book"}
                                </button>
                            </form>
                        ) : (
                            <div className="py-10 animate-pulse text-white font-bold flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-[#3EBFA5] border-t-transparent rounded-full animate-spin" />
                                Confirming your booking in real-time...
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #475569;
                }
            `}</style>
        </div>
    );
}
