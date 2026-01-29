# ChatGPT App Testing Guide

## Current Status

The ChatGPT App MCP server is running on `http://localhost:3001/mcp` but the widget is showing the old `/appointments` page instead of the `/book` page with appointment details.

## What We Fixed

1. ✅ Updated MCP server tool schema to accept: `timeslotId`, `doctorName`, `specialty`, `facilityName`, `dateTime`, `price`
2. ✅ Updated widget HTML to pass these parameters to `/book` page
3. ✅ Added `toolOutput` metadata to pass data from MCP server to widget

## How ChatGPT App Should Work

### Flow:
1. User chats with ChatGPT App
2. ChatGPT searches doctors using your Custom GPT actions
3. User selects doctor and timeslot
4. ChatGPT calls `open_booking` tool with appointment details
5. Widget opens inline with `/book` page pre-filled
6. User completes booking (OTP, patient selection, confirm)

### Tool Call Example:
```json
{
  "name": "open_booking",
  "arguments": {
    "timeslotId": "7722952",
    "doctorName": "Dr. Hanan Mohammed Faruqui",
    "specialty": "Endocrinology",
    "facilityName": "Dr. Soliman Fakeeh Medical Center Basateen",
    "dateTime": "05-Feb-2026 03:00-03:15",
    "price": "0"
  }
}
```

## Testing Steps

### 1. Restart MCP Server (if needed)
```bash
cd chatgpt-app
# Kill existing process
lsof -ti:3001 | xargs kill -9
# Start server
npm start
```

### 2. Update ChatGPT App Connector
In ChatGPT App settings:
- MCP endpoint: `http://localhost:3001/mcp`
- Refresh the connection

### 3. Test Conversation
```
You: "I need to book appointment with Dr. Hanan Faruqui"
ChatGPT: [Opens widget with appointment details]
```

## Expected Widget Behavior

The widget should load:
```
https://e-tabeb-chat-gpt-p.vercel.app/book?timeslotId=7722952&doctorName=Dr.%20Hanan%20Mohammed%20Faruqui&specialty=Endocrinology&facility=Dr.%20Soliman%20Fakeeh%20Medical%20Center%20Basateen&dateTime=05-Feb-2026%2003:00-03:15&price=0
```

And show:
- ✅ Doctor name
- ✅ Specialty
- ✅ Facility
- ✅ Date & Time
- ✅ Price
- ✅ Phone number input
- ✅ OTP verification
- ✅ Patient selection
- ✅ Booking confirmation

## Current Issue

The widget is loading but showing the old `/appointments` page (doctor search) instead of the `/book` page with pre-filled details.

**Possible causes:**
1. `window.openai.toolOutput` is not being populated by ChatGPT
2. Widget HTML is not receiving the tool arguments
3. MCP server `_meta.toolOutput` is not being passed correctly

## Alternative: Use Custom GPT Instead

The **Custom GPT** approach is working perfectly:
- User chats with Custom GPT
- GPT provides clickable booking link
- User clicks → Opens `/book` page in new tab
- User completes booking

**This is production-ready and working now!**

The ChatGPT App widget is an enhancement that would embed the booking inline in chat, but it requires proper `toolOutput` passing which may need ChatGPT platform updates.

## Recommendation

**For immediate production use:** Deploy the Custom GPT
- It's working perfectly
- Provides booking links
- Users complete booking on secure page
- No widget integration issues

**For future enhancement:** Continue debugging ChatGPT App widget
- Requires understanding how `window.openai.toolOutput` is populated
- May need ChatGPT platform support
- Would provide inline booking experience
