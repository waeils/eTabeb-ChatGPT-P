# Test ChatGPT App - Complete Flow

## MCP Server Status
✅ Running on `http://localhost:3001/mcp`

## Available Tools
1. **search_doctors** - Search by name, specialty, or facility
2. **get_timeslots** - Get available appointment slots
3. **open_booking** - Open widget with appointment details

## Test Conversation Flow

### Step 1: Search for Doctor
**You say:** "I need a cardiologist at Fakeeh Hospital"

**ChatGPT will:**
- Call `search_doctors` with searchText: "cardiologist Fakeeh Hospital"
- Show list of doctors with names, specialties, facilities, ratings, prices, and IDs

### Step 2: Get Timeslots
**You say:** "I want Dr. Hussein Ahmad" (or provide the doctor ID)

**ChatGPT will:**
- Call `get_timeslots` with the doctor ID
- Show available appointment dates and times with timeslot IDs

### Step 3: Open Booking Widget
**You say:** "Book the first slot" or "Monday at 9:30 AM"

**ChatGPT will:**
- Call `open_booking` with:
  - timeslotId
  - doctorName
  - specialty
  - facilityName
  - dateTime
  - price
- Widget opens inline with `/book` page pre-filled

### Step 4: Complete Booking in Widget
**In the widget:**
1. See appointment details (doctor, specialty, facility, date/time, price)
2. Enter mobile number
3. Send OTP
4. Enter OTP code
5. Select patient
6. Confirm booking ✅

## Example Test Commands

```
You: "Find me a cardiologist"
ChatGPT: [Calls search_doctors, shows results]

You: "Show me times for doctor ID 298"
ChatGPT: [Calls get_timeslots, shows available slots]

You: "Book timeslot 7762646 for Dr. Hussein Ahmad at Fakeeh Hospital on 15-Feb-2026 09:30-09:45"
ChatGPT: [Calls open_booking, opens widget]
```

## What to Check

✅ Search returns real doctors from eTabeb API
✅ Timeslots show real available appointments
✅ Widget opens with appointment details pre-filled
✅ All fields populated: doctor, specialty, facility, date/time, price
✅ OTP flow works
✅ Patient selection works
✅ Booking confirmation works

## If Widget Still Shows Old Page

The widget might still load `/appointments` instead of `/book` if `window.openai.toolOutput` is not being populated.

**Workaround:** ChatGPT can provide a direct link instead:
```
https://e-tabeb-chat-gpt-p.vercel.app/book?timeslotId=7762646&doctorName=Dr.%20Hussein%20Ahmad&specialty=Cardiology&facility=Fakeeh%20Hospital&dateTime=15-Feb-2026%2009:30-09:45&price=500
```

## Next Steps

1. **Refresh ChatGPT App connection** to MCP server
2. **Start conversation** with "I need to book a doctor appointment"
3. **Follow the flow** - search, select, book
4. **Report results** - does the widget open with details?
