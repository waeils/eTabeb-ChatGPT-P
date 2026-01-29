# eTabeb Booking Page - Testing Checklist

## Issues to Fix (Localhost Testing)

### 1. Search User API Error
- **Status**: FAILING
- **Error**: Console shows search-user API error
- **Fix Needed**: Verify parameter names match eTabeb API

### 2. OTP Verification
- **Status**: Shows "Invalid OTP code"
- **Fix Needed**: Verify signOTPId and signOTPCode are correctly passed

### 3. Timeslot ID Validation
- **Status**: NEEDS VERIFICATION
- **Concern**: User suspects timeslot ID might be fake/hardcoded
- **Fix Needed**: Verify timeslotRTId comes from real API response

## Test Flow (Must Pass Before Push)

1. **Send OTP**
   - [ ] Enter mobile number: +966 504334115
   - [ ] Click "Send OTP"
   - [ ] Verify OTP is received via SMS
   - [ ] Check console for API response

2. **Verify OTP**
   - [ ] Enter received OTP code
   - [ ] Click "Verify OTP"
   - [ ] Should proceed to patient selection
   - [ ] Check console for session ID

3. **Select Patient**
   - [ ] Patient list should load from API
   - [ ] Select a patient
   - [ ] Click "Confirm Booking"

4. **Booking Confirmation**
   - [ ] Should show success message
   - [ ] Verify appointment ID is real (from API)
   - [ ] Check console for booking response

## API Endpoints to Verify

- `/api/auth/search-user` - SearchUser
- `/api/auth/send-otp` - OTPRequestForSignUp
- `/api/auth/verify-otp` - SignOTPVerify
- `/api/auth/patients` - UserPatientList4Reserve
- `/api/appointments/reserve` - ReservaSlot

## Current Status
- **Last Updated**: Testing on localhost
- **Ready to Push**: NO - Waiting for local confirmation
