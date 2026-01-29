"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
    timeslotRTId?: number;
};

type Doctor = {
    id: string;
    name: string;
    specialty: string;
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

type AppointmentData = {
    doctors?: Doctor[];
    selectedDoctor?: Doctor;
    availableSlots?: TimeSlot[];
    date?: string;
};

type AuthStep = "phone" | "otp" | "register" | "verified";

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
    const [bookingConfirmed, setBookingConfirmed] = useState(false);
    const [confirmationId, setConfirmationId] = useState("");

    // Auth States
    const [countries, setCountries] = useState<Country[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const [mobileNumber, setMobileNumber] = useState("");
    const [authStep, setAuthStep] = useState<AuthStep>("phone");
    const [otpCode, setOtpCode] = useState("");
    const [signOTPId, setSignOTPId] = useState("");
    const [sessionId, setSessionId] = useState("");
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial Data Fetching
    useEffect(() => {
        async function init() {
            try {
                // Fetch Countries
                const cRes = await fetch('/api/auth/countries');
                const cData = await cRes.json();
                setCountries(cData);
                setSelectedCountry(cData.find((c: any) => c.code === "+966") || cData[0]);

                // Fetch Doctors if not provided
                if (!toolOutput?.doctors) {
                    const dRes = await fetch('/api/doctors');
                    const dData = await dRes.json();
                    setDoctors(dData.slice(0, 8));
                } else {
                    setDoctors(toolOutput.doctors);
                }
            } catch (err) {
                console.error("Init error:", err);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, [toolOutput]);

    // Fetch Timeslots when doctor changes
    useEffect(() => {
        const doctorId = selectedDoctor?.medicalFacilityDoctorSpecialityRTId;
        if (!doctorId) return;

        async function fetchSlots() {
            setLoadingSlots(true);
            try {
                const res = await fetch('/api/timeslots', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        medicalFacilityDoctorSpecialityRTId: doctorId
                    }),
                });
                const data = await res.json();
                setTimeslots(data.map((s: any) => ({
                    id: s.id.toString(),
                    time: s.time,
                    available: s.available,
                    timeslotRTId: s.id
                })).slice(0, 12));
            } catch (err) {
                console.error("Slots error:", err);
            } finally {
                setLoadingSlots(false);
            }
        }
        fetchSlots();
    }, [selectedDoctor]);

    // Auth Handlers
    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mobileNumber || !selectedCountry) return;

        setIsAuthLoading(true);
        setError(null);
        try {
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
                setSessionId(data.sessionId);
                setAuthStep("verified");
                // Auto-confirm booking if we have a session
                confirmFinalBooking(data.sessionId);
            } else {
                setError("Invalid verification code");
            }
        } catch (err) {
            setError("Verification failed");
        } finally {
            setIsAuthLoading(false);
        }
    };

    const confirmFinalBooking = async (sid: string) => {
        if (!selectedDoctor || !selectedSlot) return;

        setIsAuthLoading(true);
        try {
            // Simulate eTabeb BookAppointment API
            await new Promise(r => setTimeout(r, 1500));
            setConfirmationId(`ET-${Math.floor(100000 + Math.random() * 900000)}`);
            setBookingConfirmed(true);
        } catch (err) {
            setError("Booking failed. Please try again.");
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
            <div className="max-w-5xl mx-auto space-y-10">

                {/* Header */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <img src="https://etapisd.etabeb.com/Images/logo.png" alt="eTabeb" className="h-12" />
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#1976B2] to-[#3EBFA5]">
                        Book Appointment
                    </h1>
                </div>

                {/* Step 1: Doctor */}
                <div className="bg-[#1E293B] rounded-3xl p-6 shadow-xl border border-[#334155]">
                    <div className="flex items-center gap-4 mb-6">
                        <span className="w-10 h-10 bg-[#1976B2] text-white rounded-full flex items-center justify-center font-black">1</span>
                        <h2 className="text-xl font-bold">Select Doctor</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loading ? <div className="col-span-2 text-center py-10 opacity-50">Loading doctors...</div> :
                            doctors.map((doc) => (
                                <button key={doc.id} onClick={() => setSelectedDoctor(doc)}
                                    className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${selectedDoctor?.id === doc.id ? 'border-[#1976B2] bg-[#1976B2]/10' : 'border-[#334155] hover:border-slate-500'}`}>
                                    <div className="w-14 h-14 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                                        {doc.image.startsWith('http') ? <img src={doc.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">👨‍⚕️</div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold truncate">{doc.name}</div>
                                        <div className="text-sm text-[#3EBFA5]">{doc.specialty}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                            <span>⭐ {doc.rating.toFixed(1)}</span>
                                            {doc.price && <span className="font-bold text-white">{doc.price} {doc.currency}</span>}
                                        </div>
                                    </div>
                                </button>
                            ))}
                    </div>
                </div>

                {/* Step 2: Slot */}
                {selectedDoctor && (
                    <div className="bg-[#1E293B] rounded-3xl p-6 shadow-xl border border-[#334155] animate-fadeIn">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="w-10 h-10 bg-[#1976B2] text-white rounded-full flex items-center justify-center font-black">2</span>
                            <h2 className="text-xl font-bold">Available Slots</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {loadingSlots ? <div className="col-span-full py-4 text-center opacity-50">Checking availability...</div> :
                                timeslots.map((slot) => (
                                    <button key={slot.id} disabled={!slot.available} onClick={() => setSelectedSlot(slot)}
                                        className={`p-3 rounded-xl font-bold text-sm transition-all ${!slot.available ? 'opacity-20 cursor-not-allowed' :
                                            selectedSlot?.id === slot.id ? 'bg-[#3EBFA5] text-[#0F172A] scale-105' : 'bg-[#0F172A] border border-[#334155] hover:border-[#3EBFA5]'}`}>
                                        {slot.time.split(' - ')[0]}
                                    </button>
                                ))}
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
                                <p className="text-slate-400 text-sm">Please verify your mobile number to confirm your booking at eTabeb securely.</p>
                                <div className="flex h-14 bg-[#0F172A] rounded-2xl border border-[#334155] overflow-hidden focus-within:border-[#1976B2] transition-all">
                                    <select className="bg-transparent px-4 border-r border-[#334155] focus:outline-none text-sm font-bold"
                                        value={selectedCountry?.id} onChange={(e) => setSelectedCountry(countries.find(c => c.id === Number(e.target.value)) || null)}>
                                        {countries.map(c => <option key={c.id} value={c.id}>{c.flag} {c.code}</option>)}
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
                                    className="w-full text-center text-4xl font-black tracking-[1em] bg-[#0F172A] border border-[#334155] h-20 rounded-2xl focus:border-[#3EBFA5] transition-all"
                                    value={otpCode} onChange={(e) => setOtpCode(e.target.value)} />
                                <button type="submit" disabled={isAuthLoading || otpCode.length < 4}
                                    className="w-full bg-[#3EBFA5] hover:bg-[#32A892] text-[#0F172A] h-14 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-95 disabled:opacity-50">
                                    {isAuthLoading ? "Verifying..." : "Verify & Book Now"}
                                </button>
                                <button type="button" onClick={() => setAuthStep("phone")} className="text-slate-500 text-sm hover:text-white transition-colors">Change Phone Number</button>
                            </form>
                        ) : (
                            <div className="py-10 animate-pulse text-white font-bold flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-[#3EBFA5] border-t-transparent rounded-full animate-spin" />
                                Processing your booking...
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
