# Apps SDK Best Practices - Implementation Complete

## What We Fixed

Applied Apps SDK best practices to make the ChatGPT App work without custom instructions:

### 1. Tool Descriptions with "Use this when..." Pattern ✅

**search_doctors:**
```
"Use this when the user wants to find a doctor or book an appointment. 
Search for doctors by name, specialty, or facility in Jeddah. 
Always call this FIRST before get_timeslots or open_booking. 
Show the user the results with doctor names, specialties, facilities, 
ratings, and prices so they can choose."
```

**get_timeslots:**
```
"Use this AFTER the user has selected a doctor from search results. 
Gets available appointment timeslots for the selected doctor. 
Show the user the available dates and times so they can choose. 
Never call this before search_doctors."
```

**open_booking:**
```
"Use this ONLY AFTER the user has selected a specific timeslot from 
get_timeslots results. Opens the secure booking widget where the user 
will verify their phone number, select a patient, and confirm the booking. 
Never ask for phone numbers, OTP codes, or patient information in chat - 
the widget handles all sensitive data securely. 
Never call this before search_doctors and get_timeslots."
```

### 2. InputSchema Guardrails ✅

- **Required fields**: `searchText`, `doctorId`, `timeslotId`, `doctorName`, `facilityName`, `dateTime`
- **Validation**: `limit` has min/max (1-20)
- **Clear descriptions**: Each field explains what it is and where it comes from

### 3. Server-Side Validation ✅

**search_doctors:**
- Rejects empty searchText
- Returns helpful error if no results found
- Tells model what to do next in response

**get_timeslots:**
- Rejects missing doctorId
- Returns helpful error if no slots available
- Tells model to use search_doctors first if doctorId missing

**open_booking:**
- Rejects if required fields missing
- **Rejects sensitive data** (phone, OTP, password, patientId, etc.)
- Returns clear error telling model to use search/timeslots first
- Explains what the widget will handle

### 4. Helpful Error Messages ✅

All errors tell the model exactly what to do:
- "Use search_doctors first to find a doctor"
- "Ask the user which doctor they'd like to see, then use get_timeslots"
- "Never include sensitive data - the widget handles phone/OTP/patient"

## How It Works Now

### Expected Flow:

1. **User**: "I need to book appointment with Dr. Hanan Faruqui"

2. **ChatGPT**: Reads tool description → Sees "Use this when user wants to find a doctor" → Calls `search_doctors`

3. **Server**: Returns doctor results with "Ask the user which doctor they'd like to see, then use get_timeslots"

4. **ChatGPT**: Shows results to user

5. **User**: "I want the first one"

6. **ChatGPT**: Reads tool description → Sees "Use this AFTER user selected a doctor" → Calls `get_timeslots`

7. **Server**: Returns timeslots with "Ask the user which time works for them, then use open_booking"

8. **ChatGPT**: Shows timeslots to user

9. **User**: "Book the first slot"

10. **ChatGPT**: Reads tool description → Sees "Use this ONLY AFTER user selected a timeslot" → Calls `open_booking`

11. **Server**: Opens widget with appointment details

12. **Widget**: User completes booking (phone, OTP, patient, confirm)

## Widget UI Instructions

The widget itself shows:
```
"Opening secure booking for Dr. [Name] at [Facility] on [DateTime].

The widget will guide you through:
1. Phone number verification (OTP)
2. Patient selection
3. Booking confirmation

Never share your phone number or OTP in chat."
```

This tells the user what to expect and reinforces security.

## Security Enforcement

The server **rejects** any tool call that includes:
- phone, phoneNumber, mobileNumber
- otp, otpCode
- password
- patientId, nationalId

Error message explains:
```
"Never include sensitive data in tool calls. 
The secure booking widget will collect: phone number, OTP verification, 
and patient selection. Only pass timeslotId, doctorName, facilityName, 
dateTime, specialty, and price."
```

## Testing

**MCP Server**: Running on `http://localhost:3001/mcp` ✅

**Test conversation:**
```
You: "I need a cardiologist"
ChatGPT: [Should call search_doctors]
ChatGPT: [Shows doctor results]

You: "I want Dr. Hussein Ahmad"
ChatGPT: [Should call get_timeslots with doctor ID]
ChatGPT: [Shows available times]

You: "Book Monday at 9:30 AM"
ChatGPT: [Should call open_booking with timeslot details]
ChatGPT: [Opens widget]
```

## Key Differences from Custom GPT

**Custom GPT:**
- Uses custom instructions field
- Provides clickable links
- User clicks → Opens booking page in new tab

**ChatGPT App (Apps SDK):**
- Uses tool descriptions + metadata
- Server enforces behavior via validation
- Widget opens inline in chat
- More integrated experience

## Next Steps

1. **Refresh ChatGPT App** connection to MCP server
2. **Test the conversation** - ChatGPT should now:
   - Search doctors first
   - Get timeslots second
   - Open widget last
3. **Verify widget** receives appointment details

The tool descriptions and server validation now guide the model's behavior without needing custom instructions!
