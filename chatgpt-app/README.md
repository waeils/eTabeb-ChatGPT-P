# eTabeb ChatGPT App

This is a ChatGPT App built with the Apps SDK that provides an embedded booking widget.

## Architecture

**Hybrid Approach:**
- **Custom GPT**: Handles doctor search and timeslot discovery (existing)
- **ChatGPT App**: Provides embedded iframe widget for secure booking flow

## Setup

### 1. Install Dependencies

```bash
cd chatgpt-app
npm install
```

### 2. Environment Variables

Create `.env` file:

```
PORT=3001
BASE_URL=http://localhost:3001
BOOKING_APP_URL=https://e-tabeb-chat-gpt-p.vercel.app
```

### 3. Run Locally

```bash
npm run dev
```

### 4. Expose to Internet (for testing)

Use ngrok or similar:

```bash
ngrok http 3001
```

### 5. Add to ChatGPT

1. Enable **Developer Mode** in ChatGPT:
   - Settings → Apps & Connectors → Advanced settings
   
2. Create Connector:
   - Settings → Connectors → Create
   - URL: `https://your-ngrok-url.ngrok.app/mcp`
   - Name: "eTabeb Booking"
   - Description: "Book medical appointments with eTabeb"

3. Test:
   - Open new chat
   - Add connector from More menu (+)
   - Say: "Open booking for Dr. [name]"
   - Widget should appear inline

## Deployment

Deploy to a platform that supports Node.js:

```bash
# Vercel
vercel

# Railway
railway up

# Render
# Connect GitHub repo
```

Update `BOOKING_APP_URL` to your production URL.

## Submission

Before submitting to OpenAI:

1. Review [App Submission Guidelines](https://developers.openai.com/apps-sdk/deploy/submission-guidelines)
2. Test thoroughly in developer mode
3. Ensure privacy policy is in place
4. Submit through ChatGPT settings

## How It Works

1. User searches for doctor in **Custom GPT** (existing)
2. User selects doctor and says "book appointment"
3. Custom GPT calls **ChatGPT App** `open_booking` tool
4. Widget opens inline with embedded iframe
5. User completes OTP, patient selection, booking
6. Widget sends confirmation back to chat
7. Widget closes automatically

## Files

- `server.js` - MCP server with Apps SDK
- `public/booking-widget.html` - Widget HTML with iframe
- `package.json` - Dependencies and scripts
