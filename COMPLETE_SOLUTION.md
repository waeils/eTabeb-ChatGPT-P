# Complete eTabeb Booking Solution

## Understanding the Hybrid Architecture

### Phase 1: Custom GPT (Discovery)
**Purpose**: Help users find doctors and timeslots
**Tools**: 
- `searchDoctors` - Search by name, specialty, facility
- `getTimeslots` - Get available appointment slots

**Flow**:
1. User: "I need a cardiologist"
2. GPT searches doctors using `/api/doctors`
3. GPT shows results with doctor details
4. User selects a doctor
5. GPT gets timeslots using `/api/timeslots`
6. GPT shows available slots
7. User selects a timeslot
8. **GPT provides booking link OR calls ChatGPT App**

### Phase 2: ChatGPT App (Booking Widget)
**Purpose**: Secure booking with authentication
**Widget**: Opens `/book` page in iframe

**Flow**:
1. Widget receives: timeslotId, doctorName, facility, dateTime
2. User enters mobile number
3. User verifies OTP
4. User selects patient
5. Booking confirmed

## Current Issues & Solutions

### Issue 1: ChatGPT App Shows Wrong Page
**Problem**: Widget shows `/appointments` (full page) instead of `/book`
**Root Cause**: Widget HTML still points to `/appointments`
**Solution**: Already fixed - widget uses `/book` page

### Issue 2: Fake Timeslot ID (12345)
**Problem**: Test URL uses fake ID
**Root Cause**: This is just for testing
**Solution**: Real flow will have:
- Custom GPT gets real timeslot from `/api/timeslots`
- Custom GPT passes real `timeslotRTId` to widget
- Widget uses real ID for booking

### Issue 3: "No patients found" Error
**Problem**: OTP verify returns different sessionId than search-user
**Root Cause**: 
- search-user returns: sessionId 62811
- verify-otp returns: sessionId 8032 (the signOTPId)
**Solution**: Use the search-user sessionId, not the verify-otp one

## Fix for Patient Loading

The issue is that after OTP verification, we're using the wrong sessionId. The verify-otp API returns the signOTPId as sessionId, but we should use the original search-user sessionId.

**Current Code** (line 131-133):
```typescript
if (data.isVerified) {
    const verifiedSessionId = data.sessionId || sessionId;
    setSessionId(verifiedSessionId);
```

**Problem**: `data.sessionId` from verify-otp is 8032 (signOTPId), not the user session
**Solution**: Always use the sessionId from search-user (62811)

## Testing with Real Data

### Step 1: Get Real Timeslot
```bash
# Search for a doctor
curl -X POST http://localhost:3000/api/doctors \
  -H "Content-Type: application/json" \
  -d '{"SearchText":"Hussein Ahmad","CityId":1}'

# Get timeslots for that doctor
curl -X POST http://localhost:3000/api/timeslots \
  -H "Content-Type: application/json" \
  -d '{"doctorId":"[medicalFacilityDoctorSpecialityRTId]"}'
```

### Step 2: Use Real Timeslot in URL
```
http://localhost:3000/book?timeslotId=[REAL_ID]&doctorName=Dr.%20Hussein%20Ahmad&facility=Fakeeh%20Hospital&dateTime=Monday,%20Feb%203%20-%2010:00%20AM
```

### Step 3: Complete Booking
1. Enter mobile: 504334115
2. Send OTP (receives SMS)
3. Enter OTP code
4. Select patient (should show 6 patients)
5. Confirm booking

## Deployment Strategy

### Option A: Custom GPT Only (Current)
- User interacts with Custom GPT
- GPT provides booking link
- User clicks link → Opens `/book` page
- User completes booking

### Option B: ChatGPT App Integration (Future)
- User interacts with Custom GPT
- GPT calls ChatGPT App's `open_booking` tool
- Widget opens inline in chat
- User completes booking without leaving chat

**Recommendation**: Start with Option A (simpler), migrate to Option B later

## Next Steps

1. Fix sessionId handling in `/book` page
2. Test with real timeslot ID from API
3. Verify complete booking flow works
4. Deploy to production
5. Configure Custom GPT with proper instructions
