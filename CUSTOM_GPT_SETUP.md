# Custom GPT Setup for eTabeb

## Step 1: Create Custom GPT

1. Go to https://chatgpt.com/gpts/editor
2. Click "Create a GPT"
3. Name: **eTabeb Medical Booking**
4. Description: **Find doctors and book medical appointments in Jeddah, Saudi Arabia**

## Step 2: Instructions

```
You are an eTabeb medical booking assistant for patients in Jeddah, Saudi Arabia.

Your role:
1. Help users find doctors by specialty, name, or facility
2. Show available appointment timeslots
3. Provide a secure booking link for the selected appointment

Conversation Flow:
1. Ask what type of doctor they need (specialty, name, or facility)
2. Search using the searchDoctors action
3. Show top results with doctor name, specialty, facility, rating, and price
4. When user selects a doctor, get timeslots using getTimeslots action
5. Show available dates and times
6. When user selects a timeslot, provide the booking URL

IMPORTANT:
- NEVER ask for personal information (phone, ID, payment)
- NEVER handle authentication or booking directly
- ALWAYS hand off to the secure booking page for sensitive operations
- The booking page handles: OTP verification, patient selection, payment

Booking URL Format:
https://e-tabeb-chat-gpt-p.vercel.app/book?timeslotId=[ID]&doctorName=[NAME]&specialty=[SPECIALTY]&facility=[FACILITY]&dateTime=[DATETIME]&price=[PRICE]

Example conversation:
User: "I need a cardiologist"
You: "I'll help you find a cardiologist in Jeddah. Do you have a preferred hospital?"
User: "Fakeeh Hospital"
You: [Search doctors] "Here are cardiologists at Fakeeh Hospital:
1. Dr. Hussein Ahmad - Cardiology - ⭐ 4.5 - 500 SAR
2. Dr. Sarah Ali - Cardiology - ⭐ 4.8 - 600 SAR
Which doctor would you like to see?"
User: "Dr. Hussein Ahmad"
You: [Get timeslots] "Available appointments:
📅 Monday, Feb 15 - 09:30 AM
📅 Monday, Feb 15 - 11:30 AM
📅 Tuesday, Feb 16 - 10:00 AM
Which time works for you?"
User: "Monday at 9:30 AM"
You: "Perfect! To complete your booking securely, please click here:
[Booking Link]

You'll verify your phone number and select which patient this appointment is for. The booking is secure and your data is protected."
```

## Step 3: Actions Schema

Click "Create new action" and paste this OpenAPI schema:

```yaml
openapi: 3.1.0
info:
  title: eTabeb Medical Booking API
  description: API for searching doctors and getting appointment timeslots
  version: 1.0.0
servers:
  - url: https://e-tabeb-chat-gpt-p.vercel.app
paths:
  /api/doctors:
    post:
      operationId: searchDoctors
      summary: Search for doctors by name, specialty, or facility
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                SearchText:
                  type: string
                  description: Doctor name, specialty, or facility to search for
                CityId:
                  type: integer
                  description: City ID (1 for Jeddah)
                  default: 1
                limit:
                  type: integer
                  description: Maximum number of results (default 10 for GPT)
                  default: 10
      responses:
        '200':
          description: List of doctors
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    id:
                      type: string
                      description: Doctor ID (medicalFacilityDoctorSpecialityRTId)
                    name:
                      type: string
                      description: Doctor name
                    specialty:
                      type: string
                      description: Medical specialty
                    facility:
                      type: string
                      description: Hospital/facility name
                    rating:
                      type: number
                      description: Average rating
                    price:
                      type: string
                      description: Minimum price
                    currency:
                      type: string
                      description: Currency code
  /api/timeslots:
    post:
      operationId: getTimeslots
      summary: Get available appointment timeslots for a doctor
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - medicalFacilityDoctorSpecialityRTId
              properties:
                medicalFacilityDoctorSpecialityRTId:
                  type: string
                  description: Doctor ID from search results
      responses:
        '200':
          description: List of available timeslots
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    timeslotRTId:
                      type: integer
                      description: Timeslot ID (needed for booking)
                    date:
                      type: string
                      description: Appointment date
                    time:
                      type: string
                      description: Appointment time range
                    available:
                      type: boolean
                      description: Whether slot is available
```

## Step 4: Privacy Policy (Required)

Privacy Policy URL: `https://e-tabeb-chat-gpt-p.vercel.app`

(You can create a simple privacy policy page later)

## Step 5: Test the GPT

Test conversation:
1. "I need a cardiologist at Fakeeh Hospital"
2. GPT searches and shows results
3. "I want Dr. Hussein Ahmad"
4. GPT gets timeslots
5. "Monday at 9:30 AM"
6. GPT provides booking URL

Click the booking URL and complete:
- Enter phone number
- Verify OTP
- Select patient
- Confirm booking

## Complete Flow

```
User → Custom GPT → Search Doctors → Show Results
                  ↓
              User Selects Doctor
                  ↓
              Get Timeslots → Show Available Slots
                  ↓
              User Selects Timeslot
                  ↓
              Generate Booking URL
                  ↓
              User Clicks URL → Booking Page
                  ↓
              OTP Verification → Patient Selection → Booking Confirmed
```

## Notes

- The Custom GPT handles discovery (search, browse, select)
- The booking page handles sensitive operations (auth, payment, booking)
- This separation ensures security and privacy
- All personal data stays on the secure booking page
- GPT never sees phone numbers, OTP codes, or patient information
