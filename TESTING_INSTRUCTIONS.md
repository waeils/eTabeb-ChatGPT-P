# Testing Instructions - ChatGPT App

## ✅ Everything is Ready

**MCP Server**: Running on `http://localhost:3001/mcp` ✅
**Next.js App**: Running on `http://localhost:3000` ✅
**Tools Available**: 
- `open_booking_widget` (public - model can call)
- `search_doctors` (private - widget only)
- `get_timeslots` (private - widget only)

## How to Disconnect and Reconnect ChatGPT App

### Step 1: Open ChatGPT App Settings
1. In ChatGPT, look for the **eTabeb Booking** app in your chat
2. Click on the app name or settings icon
3. You should see the settings page you showed me earlier

### Step 2: Disconnect
1. Click the **"Disconnect"** button (you showed this in your screenshot)
2. Wait for confirmation that it's disconnected

### Step 3: Reconnect
1. Click **"Connect"** or **"Add connection"**
2. Enter the MCP endpoint: `http://localhost:3001/mcp`
3. Click **"Connect"** or **"Save"**
4. Wait for "Connected" status

### Step 4: Verify Connection
You should see:
- Connected status
- URL: `http://localhost:3001/mcp`
- Under "Actions" you should see: `open_booking_widget`

## Testing the App

### Test 1: Start New Conversation
1. **Start a NEW conversation** (important - don't use old one)
2. **Say**: "I need to book appointment"
3. **Expected**: ChatGPT calls `open_booking_widget` and widget opens

### Test 2: Interactive Widget Flow
Once widget opens, you should see:
1. **Search box** with eTabeb branding
2. Enter "cardiologist" or "Dr. Hanan Faruqui"
3. Click "Search"
4. **See doctor results** in the widget
5. Click on a doctor
6. **See timeslots** for that doctor
7. Click on a timeslot
8. **Navigate to booking page** with all details filled
9. Complete OTP, patient selection, booking

## What to Look For

### ✅ Good Signs:
- Widget opens immediately when you say "book appointment"
- Search box appears in widget
- Doctor results show in widget
- Timeslots show in widget
- Booking page opens with all details

### ❌ If Something Goes Wrong:
- Widget doesn't open → Check connection status
- Widget shows error → Check browser console (F12)
- Search doesn't work → Let me know the error message

## Alternative: If Connection Issues Persist

If you can't get the ChatGPT App to connect to localhost:

**Use the Custom GPT instead** - it's already working perfectly:
1. Go to https://chatgpt.com/gpts/editor
2. Configure Custom GPT with the setup from `CUSTOM_GPT_SETUP.md`
3. Use production URLs: `https://e-tabeb-chat-gpt-p.vercel.app`

The Custom GPT works great and is production-ready!

## Quick Troubleshooting

**Problem**: Can't find disconnect button
**Solution**: Look in the ChatGPT App settings (the screen with "eTabeb Booking" title)

**Problem**: Connection fails
**Solution**: Make sure MCP server is running (check terminal for "🚀 eTabeb ChatGPT App running")

**Problem**: Widget shows old page
**Solution**: Hard refresh after reconnecting (Cmd+Shift+R on Mac)

## Ready to Test!

Everything is set up and running. Just:
1. Disconnect ChatGPT App
2. Reconnect to `http://localhost:3001/mcp`
3. Start new conversation
4. Say "I need to book appointment"
5. Use the interactive widget!
