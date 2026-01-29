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
};

type Doctor = {
    id: string;
    name: string;
    nameArabic?: string;
    specialty: string;
    specialtyArabic?: string;
    facility?: string;
    facilityArabic?: string;
    image: string;
    rating: number;
    ratingText?: string;
    ratingCount?: number;
    timeslotCount?: number;
    price?: string;
    currency?: string;
    medicalFacilityDoctorSpecialityRTId?: number;
};

type AppointmentData = {
    doctors?: Doctor[];
    selectedDoctor?: Doctor;
    availableSlots?: TimeSlot[];
    date?: string;
};

export default function AppointmentBooking() {
    const toolOutput = useWidgetProps<AppointmentData>();
    const maxHeight = useMaxHeight() ?? undefined;
    const displayMode = useDisplayMode();
    const requestDisplayMode = useRequestDisplayMode();

    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(
        toolOutput?.selectedDoctor || null
    );
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [patientName, setPatientName] = useState("");
    const [patientEmail, setPatientEmail] = useState("");
    const [patientPhone, setPatientPhone] = useState("");
    const [reason, setReason] = useState("");
    const [bookingConfirmed, setBookingConfirmed] = useState(false);
    const [confirmationId, setConfirmationId] = useState("");

    // Fetch real doctors from API
    useEffect(() => {
        async function fetchDoctors() {
            try {
                setLoading(true);
                const response = await fetch('/api/doctors');
                if (!response.ok) {
                    throw new Error('Failed to fetch doctors');
                }
                const data = await response.json();
                // Take first 8 doctors for better UI
                setDoctors(data.slice(0, 8));
                setError(null);
            } catch (err) {
                console.error('Error fetching doctors:', err);
                setError('Failed to load doctors. Please try again.');
                // Fallback to mock data
                setDoctors([
                    {
                        id: "1",
                        name: "Dr. Sarah Johnson",
                        specialty: "Cardiologist",
                        image: "👩‍⚕️",
                        rating: 4.9,
                    },
                    {
                        id: "2",
                        name: "Dr. Michael Chen",
                        specialty: "General Practitioner",
                        image: "👨‍⚕️",
                        rating: 4.8,
                    },
                ]);
            } finally {
                setLoading(false);
            }
        }

        // Use doctors from toolOutput if available, otherwise fetch
        if (toolOutput?.doctors && toolOutput.doctors.length > 0) {
            setDoctors(toolOutput.doctors);
            setLoading(false);
        } else {
            fetchDoctors();
        }
    }, [toolOutput]);

    const [timeslots, setTimeslots] = useState<TimeSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Fetch real timeslots when a doctor is selected
    useEffect(() => {
        async function fetchTimeslots() {
            if (!selectedDoctor?.medicalFacilityDoctorSpecialityRTId) {
                // Use default slots if no ID available
                setTimeslots([
                    { id: "1", time: "09:00 - 09:29", available: true },
                    { id: "2", time: "10:00 - 10:29", available: true },
                    { id: "3", time: "11:00 - 11:29", available: false },
                    { id: "4", time: "14:00 - 14:29", available: true },
                    { id: "5", time: "15:00 - 15:29", available: true },
                    { id: "6", time: "16:00 - 16:29", available: true },
                ]);
                return;
            }

            try {
                setLoadingSlots(true);
                const response = await fetch('/api/timeslots', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        medicalFacilityDoctorSpecialityRTId: selectedDoctor.medicalFacilityDoctorSpecialityRTId,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch timeslots');
                }

                const data = await response.json();

                // Group by date and take first 12 slots
                const slots = data.slice(0, 12).map((slot: any) => ({
                    id: slot.id.toString(),
                    time: slot.time,
                    date: slot.date,
                    available: slot.available,
                    timeslotRTId: slot.id,
                }));

                setTimeslots(slots);
            } catch (err) {
                console.error('Error fetching timeslots:', err);
                // Fallback to default slots
                setTimeslots([
                    { id: "1", time: "09:00 - 09:29", available: true },
                    { id: "2", time: "10:00 - 10:29", available: true },
                    { id: "3", time: "14:00 - 14:29", available: true },
                    { id: "4", time: "15:00 - 15:29", available: true },
                ]);
            } finally {
                setLoadingSlots(false);
            }
        }

        if (selectedDoctor) {
            fetchTimeslots();
        }
    }, [selectedDoctor]);

    const handleBooking = async () => {
        if (!selectedDoctor || !selectedSlot || !patientName || !patientEmail) {
            alert("Please fill in all required fields");
            return;
        }

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const confirmId = `APT-${Date.now()}`;
        setConfirmationId(confirmId);
        setBookingConfirmed(true);

        // In real app, you would call your backend API here
        // const response = await fetch('/api/appointments', {
        //   method: 'POST',
        //   body: JSON.stringify({
        //     doctorId: selectedDoctor.id,
        //     slotId: selectedSlot.id,
        //     patientName,
        //     patientEmail,
        //     patientPhone,
        //     reason
        //   })
        // });
    };

    const resetBooking = () => {
        setBookingConfirmed(false);
        setSelectedDoctor(null);
        setSelectedSlot(null);
        setPatientName("");
        setPatientEmail("");
        setPatientPhone("");
        setReason("");
        setConfirmationId("");
    };

    if (bookingConfirmed) {
        return (
            <div
                className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 flex items-center justify-center"
                style={{ maxHeight }}
            >
                <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 text-center space-y-6 animate-fadeIn">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto">
                        <svg
                            className="w-10 h-10 text-emerald-600 dark:text-emerald-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>

                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                            Appointment Confirmed!
                        </h2>
                        <p className="text-slate-600 dark:text-slate-300">
                            Your appointment has been successfully booked
                        </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6 space-y-3 text-left">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400">
                                Confirmation ID
                            </span>
                            <span className="font-mono font-semibold text-slate-900 dark:text-white">
                                {confirmationId}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400">Doctor</span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                                {selectedDoctor?.name}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400">Time</span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                                {selectedSlot?.time}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400">
                                Patient
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                                {patientName}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={resetBooking}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                        >
                            Book Another Appointment
                        </button>
                        <Link
                            href="/"
                            className="block w-full text-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            Return to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div
                className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 flex items-center justify-center"
                style={{ maxHeight }}
            >
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-600 dark:text-slate-300 text-lg">Loading doctors...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6"
            style={{ maxHeight }}
        >
            {displayMode !== "fullscreen" && (
                <button
                    aria-label="Enter fullscreen"
                    className="fixed top-4 right-4 z-50 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-lg ring-1 ring-slate-900/10 dark:ring-white/10 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    onClick={() => requestDisplayMode("fullscreen")}
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                        />
                    </svg>
                </button>
            )}

            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-3">
                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                        Book Your Appointment
                    </h1>
                    <p className="text-slate-600 dark:text-slate-300 text-lg">
                        Choose your doctor and preferred time slot
                    </p>
                    {error && (
                        <p className="text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </p>
                    )}
                </div>

                {/* Step 1: Select Doctor */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            1
                        </span>
                        Select Your Doctor
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {doctors.map((doctor) => (
                            <button
                                key={doctor.id}
                                onClick={() => setSelectedDoctor(doctor)}
                                className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${selectedDoctor?.id === doctor.id
                                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105"
                                    : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md"
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 flex-shrink-0">
                                        {doctor.image.startsWith('http') ? (
                                            <img
                                                src={doctor.image}
                                                alt={doctor.name}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="text-5xl">{doctor.image || '👨‍⚕️'}</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">
                                            {doctor.name}
                                        </h3>
                                        <p className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                                            {doctor.specialty}
                                        </p>
                                        {doctor.facility && (
                                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 truncate">
                                                {doctor.facility}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                                            <span className="flex items-center gap-1">
                                                ⭐ {doctor.rating > 0 ? doctor.rating.toFixed(1) : doctor.ratingText || 'New'}
                                            </span>
                                            {doctor.timeslotCount && (
                                                <span>{doctor.timeslotCount} slots</span>
                                            )}
                                            {doctor.price && doctor.price !== '0' && (
                                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                    {doctor.price} {doctor.currency}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {selectedDoctor?.id === doctor.id && (
                                        <svg
                                            className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Step 2: Select Time Slot */}
                {selectedDoctor && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 space-y-6 animate-fadeIn">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                2
                            </span>
                            Choose Time Slot
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {loadingSlots ? (
                                <div className="col-span-full text-center py-8">
                                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    <p className="text-slate-600 dark:text-slate-300 mt-2">Loading slots...</p>
                                </div>
                            ) : timeslots.length === 0 ? (
                                <div className="col-span-full text-center py-8">
                                    <p className="text-slate-600 dark:text-slate-300">No available slots</p>
                                </div>
                            ) : (
                                timeslots.map((slot: TimeSlot) => (
                                    <button
                                        key={slot.id}
                                        onClick={() => slot.available && setSelectedSlot(slot)}
                                        disabled={!slot.available}
                                        className={`p-4 rounded-xl font-semibold transition-all duration-200 ${!slot.available
                                            ? "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                                            : selectedSlot?.id === slot.id
                                                ? "bg-blue-600 text-white shadow-lg scale-105"
                                                : "bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:shadow-md"
                                            }`}
                                    >
                                        {slot.time}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Step 3: Patient Information */}
                {selectedDoctor && selectedSlot && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 space-y-6 animate-fadeIn">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                3
                            </span>
                            Patient Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    value={patientName}
                                    onChange={(e) => setPatientName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-600 dark:focus:border-blue-400 focus:outline-none transition-colors"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={patientEmail}
                                    onChange={(e) => setPatientEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-600 dark:focus:border-blue-400 focus:outline-none transition-colors"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={patientPhone}
                                    onChange={(e) => setPatientPhone(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-600 dark:focus:border-blue-400 focus:outline-none transition-colors"
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Reason for Visit
                                </label>
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-600 dark:focus:border-blue-400 focus:outline-none transition-colors"
                                    placeholder="Annual checkup"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={handleBooking}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                            >
                                Confirm Appointment
                            </button>
                            <Link
                                href="/"
                                className="px-8 py-4 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
