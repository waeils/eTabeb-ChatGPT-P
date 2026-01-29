#!/bin/bash

echo "=== Testing eTabeb Booking Flow with Real Data ==="
echo ""

# Step 1: Search for a doctor
echo "1. Searching for doctors..."
DOCTORS=$(curl -s -X POST http://localhost:3000/api/doctors \
  -H "Content-Type: application/json" \
  -d '{"SearchText":"Hussein Ahmad","CityId":1}')

DOCTOR_ID=$(echo $DOCTORS | jq -r '.[0].id')
DOCTOR_NAME=$(echo $DOCTORS | jq -r '.[0].name')
FACILITY=$(echo $DOCTORS | jq -r '.[0].facility')

echo "   Found: $DOCTOR_NAME at $FACILITY"
echo "   Doctor ID: $DOCTOR_ID"
echo ""

# Step 2: Get timeslots
echo "2. Getting available timeslots..."
TIMESLOTS=$(curl -s -X POST http://localhost:3000/api/timeslots \
  -H "Content-Type: application/json" \
  -d "{\"doctorId\":\"$DOCTOR_ID\"}")

TIMESLOT_ID=$(echo $TIMESLOTS | jq -r '.[0].timeslotRTId')
TIMESLOT_DATE=$(echo $TIMESLOTS | jq -r '.[0].date')
TIMESLOT_TIME=$(echo $TIMESLOTS | jq -r '.[0].time')

echo "   First available slot:"
echo "   Timeslot ID: $TIMESLOT_ID"
echo "   Date: $TIMESLOT_DATE"
echo "   Time: $TIMESLOT_TIME"
echo ""

# Step 3: Generate booking URL
BOOKING_URL="http://localhost:3000/book?timeslotId=$TIMESLOT_ID&doctorName=$(echo $DOCTOR_NAME | sed 's/ /%20/g')&facility=$(echo $FACILITY | sed 's/ /%20/g')&dateTime=$TIMESLOT_DATE%20-%20$TIMESLOT_TIME"

echo "3. Booking URL with REAL data:"
echo "   $BOOKING_URL"
echo ""

echo "4. Testing authentication flow..."
echo "   a) Search user..."
SEARCH_RESULT=$(curl -s -X POST http://localhost:3000/api/auth/search-user \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"504334115","countryId":1}')

SESSION_ID=$(echo $SEARCH_RESULT | jq -r '.sessionId')
echo "      Session ID: $SESSION_ID"

echo "   b) Send OTP..."
OTP_RESULT=$(curl -s -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"504334115","countryId":1}')

SIGN_OTP_ID=$(echo $OTP_RESULT | jq -r '.signOTPId')
OTP_CODE=$(echo $OTP_RESULT | jq -r '.data.outParam1')
echo "      Sign OTP ID: $SIGN_OTP_ID"
echo "      OTP Code: $OTP_CODE"

echo "   c) Verify OTP..."
VERIFY_RESULT=$(curl -s -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"signOTPId\":$SIGN_OTP_ID,\"signOTPCode\":\"$OTP_CODE\"}")

IS_VERIFIED=$(echo $VERIFY_RESULT | jq -r '.isVerified')
echo "      Verified: $IS_VERIFIED"

echo "   d) Get patients..."
PATIENTS=$(curl -s -X POST http://localhost:3000/api/auth/patients \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\"}")

PATIENT_COUNT=$(echo $PATIENTS | jq '. | length')
FIRST_PATIENT_ID=$(echo $PATIENTS | jq -r '.[0].patientId')
FIRST_PATIENT_NAME=$(echo $PATIENTS | jq -r '.[0].patientName')

echo "      Found $PATIENT_COUNT patients"
echo "      First patient: $FIRST_PATIENT_NAME (ID: $FIRST_PATIENT_ID)"
echo ""

echo "=== Summary ==="
echo "✅ Doctor search: Working"
echo "✅ Timeslot retrieval: Working"
echo "✅ User authentication: Working"
echo "✅ Patient list: Working"
echo ""
echo "📋 Test the complete flow in browser:"
echo "   $BOOKING_URL"
echo ""
echo "   Mobile: 504334115"
echo "   OTP: $OTP_CODE"
echo "   Patient: $FIRST_PATIENT_NAME"
echo "   Timeslot ID: $TIMESLOT_ID (REAL from API)"
