# Custom GPT - Production Configuration

## ✅ This is the Working Solution

The Custom GPT works perfectly and is production-ready. Use this instead of the ChatGPT App.

## Setup Instructions

### 1. Create Custom GPT
Go to: https://chatgpt.com/gpts/editor

### 2. Basic Info
- **Name**: eTabeb Medical Booking
- **Description**: Find and book medical appointments with top doctors in Jeddah, Saudi Arabia
- **Profile Picture**: Upload eTabeb logo

### 3. Instructions

```
You are an eTabeb medical booking assistant for patients in Jeddah, Saudi Arabia.

Your role:
1. Help users find doctors by specialty, name, or facility
2. Show available appointment timeslots
3. Provide a secure booking link for the selected appointment

Conversation Flow:
1. Ask what type of doctor they need (specialty, name, or facility)
2. Use searchDoctors action to search
3. Show results with doctor name, specialty, facility, rating, and price
4. When user selects a doctor, use getTimeslots action
5. Show available dates and times
6. When user selects a timeslot, provide the booking URL

Booking URL Format:
https://e-tabeb-chat-gpt-p.vercel.app/book?timeslotId=[ID]&doctorName=[NAME]&specialty=[SPECIALTY]&facility=[FACILITY]&dateTime=[DATETIME]&price=[PRICE]

IMPORTANT:
- NEVER ask for personal information (phone, ID, payment)
- NEVER handle authentication or booking directly
- ALWAYS hand off to the secure booking page
- The booking page handles: OTP verification, patient selection, booking confirmation

Example conversation:
User: "I need a cardiologist"
You: "I'll help you find a cardiologist in Jeddah. Do you have a preferred hospital?"
User: "Fakeeh Hospital"
You: [Use searchDoctors] "Here are cardiologists at Fakeeh Hospital:
1. Dr. Hussein Ahmad - Cardiology - ⭐ 4.5 - 500 SAR
2. Dr. Sarah Ali - Cardiology - ⭐ 4.8 - 600 SAR
Which doctor would you like to see?"
User: "Dr. Hussein Ahmad"
You: [Use getTimeslots] "Available appointments:
📅 Monday, Feb 15 - 09:30 AM
📅 Monday, Feb 15 - 11:30 AM
📅 Tuesday, Feb 16 - 10:00 AM
Which time works for you?"
User: "Monday at 9:30 AM"
You: "Perfect! To complete your booking securely, please click here:
[Booking Link]

You'll verify your phone number and select which patient this appointment is for. The booking is secure and your data is protected."
```

### 4. Actions Schema

Click "Create new action" and paste:

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
                  description: Maximum number of results (default 10)
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
                    name:
                      type: string
                    specialty:
                      type: string
                    facility:
                      type: string
                    rating:
                      type: number
                    price:
                      type: string
                    currency:
                      type: string
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
                    date:
                      type: string
                    time:
                      type: string
                    available:
                      type: boolean
```

### 5. Privacy Policy
Privacy Policy URL: `https://e-tabeb-chat-gpt-p.vercel.app`

### 6. Save and Publish
- Click "Save"
- Click "Publish" → "Only me" or "Anyone with link"
- Copy the GPT link to share

## Testing

### Test Conversation:
```
You: "I need a cardiologist"
GPT: [Searches] Shows results

You: "I want Dr. Hussein Ahmad"
GPT: [Gets timeslots] Shows available times

You: "Monday at 9:30 AM"
GPT: Provides booking link

You: [Click link] → Complete booking
```

## Production URLs

**Booking Page**: `https://e-tabeb-chat-gpt-p.vercel.app/book`
**Doctor Search API**: `https://e-tabeb-chat-gpt-p.vercel.app/api/doctors`
**Timeslots API**: `https://e-tabeb-chat-gpt-p.vercel.app/api/timeslots`

## Why Custom GPT is Better

✅ **Works reliably** - No platform caching issues
✅ **Custom instructions** - Full control over behavior
✅ **Proven** - You already tested it successfully
✅ **Production ready** - All APIs working
✅ **Better UX** - Conversational flow users expect

## Complete Booking Flow

1. User chats with Custom GPT
2. GPT searches doctors using `/api/doctors`
3. User selects doctor
4. GPT gets timeslots using `/api/timeslots`
5. User selects timeslot
6. GPT provides booking link with all parameters
7. User clicks link → Opens `/book` page
8. User enters phone → OTP verification
9. User selects patient
10. Booking confirmed ✅

## Summary

**Use the Custom GPT for production.** It's working, reliable, and provides the exact experience you want. The ChatGPT App has platform limitations that make it unreliable for multi-step workflows.
