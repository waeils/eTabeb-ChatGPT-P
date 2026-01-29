"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Country = {
    id: number;
    code: string;
    name: string;
    nameArabic: string;
    flag: string;
};

type IdentityType = {
    value: number;
    text: string;
    text2: string;
};

type AuthStep = 'phone' | 'otp' | 'register' | 'success';

export default function AuthPage() {
    const router = useRouter();
    const [step, setStep] = useState<AuthStep>('phone');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Phone step
    const [countries, setCountries] = useState<Country[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const [phoneNumber, setPhoneNumber] = useState("");

    // OTP step
    const [otpCode, setOtpCode] = useState("");
    const [receivedOtpCode, setReceivedOtpCode] = useState<string | null>(null); // For testing - shows OTP from API
    const [signOTPId, setSignOTPId] = useState<number | null>(null); // ID from send OTP response
    const [isRegistered, setIsRegistered] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);

    // Registration step
    const [identityTypes, setIdentityTypes] = useState<IdentityType[]>([]);
    const [selectedIdentityType, setSelectedIdentityType] = useState<IdentityType | null>(null);
    const [identityNumber, setIdentityNumber] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");

    // Fetch countries on mount
    useEffect(() => {
        async function fetchCountries() {
            try {
                const response = await fetch('/api/auth/countries');
                const data = await response.json();
                setCountries(data);
                // Set Saudi Arabia as default
                const saudi = data.find((c: Country) => c.code === '+966');
                if (saudi) setSelectedCountry(saudi);
            } catch (err) {
                console.error('Error fetching countries:', err);
            }
        }
        fetchCountries();
    }, []);

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCountry || !phoneNumber) {
            setError('Please select country and enter phone number');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Check if user is registered
            const checkResponse = await fetch('/api/auth/check-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mobileNumber: phoneNumber,
                    countryCode: selectedCountry.code,
                }),
            });

            const checkData = await checkResponse.json();
            setIsRegistered(checkData.isRegistered);
            setSessionId(checkData.sessionId);

            // Send OTP
            const otpResponse = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mobileNumber: phoneNumber,
                    countryCode: selectedCountry.code,
                    countryId: selectedCountry.id,
                    isRegistered: checkData.isRegistered,
                }),
            });

            if (!otpResponse.ok) {
                throw new Error('Failed to send OTP');
            }

            const otpData = await otpResponse.json();

            // Store signOTPId for verification
            if (otpData.signOTPId) {
                setSignOTPId(otpData.signOTPId);
            }

            // Store OTP code for testing (from API response)
            if (otpData.otpCode) {
                setReceivedOtpCode(otpData.otpCode);
            }

            setStep('otp');
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otpCode || otpCode.length < 4) {
            setError('Please enter valid OTP code');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    otpCode,
                    signOTPId,  // Use the ID from send OTP response
                }),
            });

            const data = await response.json();

            if (!data.isVerified) {
                setError('Invalid OTP code. Please try again.');
                return;
            }

            // Check if user already has an eTabeb account
            if (data.hasAccount) {
                // User is verified and has an account - log them in
                setSessionId(data.sessionId);
                setStep('success');
                setTimeout(() => {
                    router.push('/appointments');
                }, 2000);
            } else {
                // User verified but needs to complete registration
                // Fetch identity types
                const identityResponse = await fetch('/api/auth/identity-types');
                const identityData = await identityResponse.json();
                setIdentityTypes(identityData);
                setStep('register');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to verify OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleRegistrationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedIdentityType || !identityNumber || !firstName || !lastName) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mobileNumber: phoneNumber,
                    countryCode: selectedCountry?.code,
                    countryId: selectedCountry?.id,
                    identityType: selectedIdentityType.value,
                    identityNumber,
                    firstName,
                    lastName,
                    email,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                setError(data.message || 'Registration failed');
                return;
            }

            setStep('success');
            setTimeout(() => {
                router.push('/appointments');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to register');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#E8F4F8] via-[#F0F9FC] to-[#E0F7F4] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 flex items-center justify-center">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Image
                            src="/etabeb-logo.png"
                            alt="eTabeb"
                            width={200}
                            height={80}
                            priority
                        />
                    </div>
                    <p className="text-[#1976B2] dark:text-[#3EBFA5] font-medium">
                        {step === 'phone' && 'Sign in to book appointments'}
                        {step === 'otp' && 'Enter verification code'}
                        {step === 'register' && 'Complete your registration'}
                        {step === 'success' && 'Welcome!'}
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Phone Step */}
                    {step === 'phone' && (
                        <form onSubmit={handlePhoneSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Country
                                </label>
                                <select
                                    value={selectedCountry?.id || ''}
                                    onChange={(e) => {
                                        const country = countries.find(c => c.id === parseInt(e.target.value));
                                        setSelectedCountry(country || null);
                                    }}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-[#1976B2] dark:focus:border-[#3EBFA5] focus:outline-none transition-colors"
                                >
                                    {countries.map((country) => (
                                        <option key={country.id} value={country.id}>
                                            {country.code} - {country.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Phone Number
                                </label>
                                <div className="flex gap-2">
                                    <div className="w-20 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex items-center justify-center font-semibold">
                                        {selectedCountry?.code || '+966'}
                                    </div>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-[#1976B2] dark:focus:border-[#3EBFA5] focus:outline-none transition-colors"
                                        placeholder="555 123 456"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-[#1976B2] to-[#3EBFA5] hover:from-[#155a8a] hover:to-[#2da88c] text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Sending...' : 'Send Verification Code'}
                            </button>
                        </form>
                    )}

                    {/* OTP Step */}
                    {step === 'otp' && (
                        <form onSubmit={handleOtpSubmit} className="space-y-4">
                            <div className="text-center mb-4">
                                <p className="text-slate-600 dark:text-slate-300">
                                    We sent a code to <span className="font-semibold">{selectedCountry?.code} {phoneNumber}</span>
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Verification Code
                                </label>
                                <input
                                    type="text"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-[#1976B2] dark:focus:border-[#3EBFA5] focus:outline-none transition-colors text-center text-2xl tracking-widest"
                                    placeholder="••••"
                                    maxLength={6}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-[#1976B2] to-[#3EBFA5] hover:from-[#155a8a] hover:to-[#2da88c] text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Verifying...' : 'Verify Code'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep('phone')}
                                className="w-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                Change Phone Number
                            </button>
                        </form>
                    )}

                    {/* Registration Step */}
                    {step === 'register' && (
                        <form onSubmit={handleRegistrationSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Identity Type *
                                </label>
                                <select
                                    value={selectedIdentityType?.value || ''}
                                    onChange={(e) => {
                                        const type = identityTypes.find(t => t.value === parseInt(e.target.value));
                                        setSelectedIdentityType(type || null);
                                    }}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-[#1976B2] dark:focus:border-[#3EBFA5] focus:outline-none transition-colors"
                                    required
                                >
                                    <option value="">Select ID Type</option>
                                    {identityTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.text}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Identity Number *
                                </label>
                                <input
                                    type="text"
                                    value={identityNumber}
                                    onChange={(e) => setIdentityNumber(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-[#1976B2] dark:focus:border-[#3EBFA5] focus:outline-none transition-colors"
                                    placeholder="1234567890"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        First Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-[#1976B2] dark:focus:border-[#3EBFA5] focus:outline-none transition-colors"
                                        placeholder="Ahmed"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Last Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-[#1976B2] dark:focus:border-[#3EBFA5] focus:outline-none transition-colors"
                                        placeholder="Mohammed"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Email (Optional)
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-[#1976B2] dark:focus:border-[#3EBFA5] focus:outline-none transition-colors"
                                    placeholder="ahmed@example.com"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-[#1976B2] to-[#3EBFA5] hover:from-[#155a8a] hover:to-[#2da88c] text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Registering...' : 'Complete Registration'}
                            </button>
                        </form>
                    )}

                    {/* Success Step */}
                    {step === 'success' && (
                        <div className="text-center space-y-6 py-8">
                            <div className="w-20 h-20 bg-[#E0F7F4] dark:bg-[#3EBFA5]/20 rounded-full flex items-center justify-center mx-auto">
                                <svg
                                    className="w-10 h-10 text-[#3EBFA5] dark:text-[#3EBFA5]"
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
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                    {sessionId ? 'Welcome Back!' : 'Registration Complete!'}
                                </h2>
                                <p className="text-slate-600 dark:text-slate-300">
                                    Redirecting to appointments...
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <Link
                        href="/"
                        className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
