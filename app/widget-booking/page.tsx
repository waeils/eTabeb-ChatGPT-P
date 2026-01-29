'use client';

import { useState } from 'react';
import Image from 'next/image';

declare global {
  interface Window {
    openai?: {
      callTool: (name: string, args: any) => Promise<any>;
      sendFollowUp?: (message: string) => void;
      closeWidget?: () => void;
    };
  }
}

export default function WidgetBooking() {
  const [step, setStep] = useState<'search' | 'doctors' | 'timeslots' | 'booking'>('search');
  const [searchText, setSearchText] = useState('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [timeslots, setTimeslots] = useState<any[]>([]);
  const [selectedTimeslot, setSelectedTimeslot] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchText.trim()) {
      setError('Please enter a doctor name, specialty, or facility');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call the private search_doctors tool via widget API
      const result = await window.openai?.callTool('search_doctors', {
        searchText: searchText,
        limit: 10
      });

      if (result && result.content && result.content[0]) {
        // Parse the doctor list from the text response
        const text = result.content[0].text;
        
        // For now, call the API directly since we need structured data
        const response = await fetch('/api/doctors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ SearchText: searchText, CityId: 1, limit: 10 })
        });
        const doctorData = await response.json();
        
        setDoctors(doctorData);
        setStep('doctors');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoctor = async (doctor: any) => {
    setSelectedDoctor(doctor);
    setLoading(true);
    setError('');

    try {
      // Call the private get_timeslots tool via widget API
      const result = await window.openai?.callTool('get_timeslots', {
        doctorId: doctor.id
      });

      // Call API directly for structured data
      const response = await fetch('/api/timeslots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicalFacilityDoctorSpecialityRTId: doctor.id })
      });
      const timeslotData = await response.json();
      
      setTimeslots(timeslotData);
      setStep('timeslots');
    } catch (err: any) {
      setError(err.message || 'Failed to get timeslots');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTimeslot = (timeslot: any) => {
    setSelectedTimeslot(timeslot);
    
    // Navigate to booking page with all details
    const params = new URLSearchParams({
      timeslotId: timeslot.timeslotRTId.toString(),
      doctorName: selectedDoctor.name,
      specialty: selectedDoctor.specialty,
      facility: selectedDoctor.facility,
      dateTime: `${timeslot.date} ${timeslot.time}`,
      price: selectedDoctor.price
    });
    
    window.location.href = `/book?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] to-[#1E293B] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Image
            src="/etabeb-logo.png"
            alt="eTabeb"
            width={120}
            height={40}
            className="mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-[#1976B2]">Book Appointment</h1>
          <p className="text-gray-600 mt-2">Find and book with top doctors in Jeddah</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Step 1: Search */}
        {step === 'search' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search for a doctor
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Doctor name, specialty, or facility..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1976B2] focus:border-transparent text-gray-900"
                disabled={loading}
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-3 bg-[#1976B2] text-white rounded-lg hover:bg-[#1565C0] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Doctor Results */}
        {step === 'doctors' && (
          <div>
            <button
              onClick={() => setStep('search')}
              className="text-[#1976B2] hover:underline mb-4 flex items-center gap-1"
            >
              ← Back to search
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Found {doctors.length} doctors
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  onClick={() => handleSelectDoctor(doctor)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-[#1976B2] hover:bg-blue-50 cursor-pointer transition-all"
                >
                  <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
                  <p className="text-sm text-gray-600">{doctor.specialty}</p>
                  <p className="text-sm text-gray-500">📍 {doctor.facility}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-yellow-600">⭐ {doctor.rating}</span>
                    <span className="text-[#1976B2] font-medium">{doctor.price} {doctor.currency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Timeslots */}
        {step === 'timeslots' && (
          <div>
            <button
              onClick={() => setStep('doctors')}
              className="text-[#1976B2] hover:underline mb-4 flex items-center gap-1"
            >
              ← Back to doctors
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Available appointments for {selectedDoctor?.name}
            </h2>
            <p className="text-sm text-gray-600 mb-4">{selectedDoctor?.facility}</p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {timeslots.map((slot, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectTimeslot(slot)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-[#1976B2] hover:bg-blue-50 cursor-pointer transition-all flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-gray-900">📅 {slot.date}</p>
                    <p className="text-sm text-gray-600">🕐 {slot.time}</p>
                  </div>
                  <span className="text-[#3EBFA5] font-medium">Book →</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && step !== 'search' && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1976B2]"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
}
