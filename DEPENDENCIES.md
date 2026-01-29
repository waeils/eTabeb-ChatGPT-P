# 📦 eTabeb ChatGPT Integration - Dependencies & Architecture

## 📋 Complete Dependencies List

### Main Application (Next.js)

**package.json location:** `/package.json`

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^15.0.0"
  }
}
```

**Installation:**
```bash
cd /path/to/eTabeb-ChatGPT-P
npm install
```

---

### MCP Server (ChatGPT Integration)

**package.json location:** `/chatgpt-app/package.json`

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "zod": "^3.22.4"
  }
}
```

**Installation:**
```bash
cd /path/to/eTabeb-ChatGPT-P/chatgpt-app
npm install
```

---

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    ChatGPT (OpenAI)                          │
│  • Natural language processing                               │
│  • Intent recognition                                        │
│  • Multi-language support (EN/AR)                           │
│  • Connects to MCP Server                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              MCP Server (Port 3001)                          │
│  File: chatgpt-app/server.js                                │
│                                                              │
│  Tools Provided:                                            │
│  1. open_booking_widget_v2 - Opens booking interface        │
│  2. search_doctors - Search for doctors                     │
│  3. get_timeslots - Get available appointments              │
│                                                              │
│  Resources:                                                 │
│  • booking-widget.html - Interactive widget                 │
│                                                              │
│  Dependencies:                                              │
│  • @modelcontextprotocol/sdk - MCP protocol                │
│  • express - Web server                                     │
│  • cors - Cross-origin requests                            │
│  • zod - Schema validation                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js App (Port 3000)                         │
│                                                              │
│  API Routes:                                                │
│  • /api/doctors - Doctor search                             │
│  • /api/timeslots - Timeslot fetching                       │
│  • /api/auth/search-user - User lookup                      │
│  • /api/auth/send-otp - OTP sending                         │
│  • /api/auth/verify-otp - OTP verification                  │
│  • /api/auth/patients - Patient list                        │
│                                                              │
│  Pages:                                                     │
│  • /appointments - Main booking page                        │
│  • /book - Booking flow with OTP                           │
│                                                              │
│  Dependencies:                                              │
│  • next - React framework                                   │
│  • react - UI library                                       │
│  • typescript - Type safety                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  eTabeb API                                  │
│  Base: https://etapisd.etabeb.com/api/AI                   │
│                                                              │
│  Endpoints:                                                 │
│  • /DoctorList - Get doctors                                │
│  • /DoctorTimeslotList - Get timeslots                      │
│  • /SearchUser - Search user by phone                       │
│  • /OTPRequestForSignUp - Send OTP                          │
│  • /SignOTPVerify - Verify OTP                              │
│  • /PatientList - Get user's patients                       │
│  • /CountryListForContact - Get country codes               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### 1. Doctor Search Flow

```
User → ChatGPT → MCP Server → Next.js API → eTabeb API
                                    ↓
                            Returns doctor list
                                    ↓
                            Widget displays doctors
```

**Files involved:**
- `chatgpt-app/server.js` - MCP tool definition
- `app/api/doctors/route.ts` - API route
- `chatgpt-app/public/booking-widget.html` - UI display

### 2. Timeslot Fetching Flow

```
User selects doctor → Widget → Next.js API → eTabeb API
                                    ↓
                            Returns timeslots
                                    ↓
                            Widget displays slots grouped by date
```

**Files involved:**
- `chatgpt-app/public/booking-widget.html` - UI and API calls
- `app/api/timeslots/route.ts` - API route

### 3. OTP Authentication Flow

```
User enters phone → Widget → Next.js API → eTabeb SearchUser API
                                    ↓
                            Gets userSessionId (e.g., 62812)
                                    ↓
                            Stores in currentSessionId
                                    ↓
                            Sends OTP via SMS
                                    ↓
User enters OTP → Widget → Next.js API → eTabeb SignOTPVerify
                                    ↓
                            Verifies OTP
                                    ↓
                            Loads patients using stored sessionId
```

**Files involved:**
- `chatgpt-app/public/booking-widget.html` - OTP UI and logic
- `app/api/auth/search-user/route.ts` - User search
- `app/api/auth/send-otp/route.ts` - OTP sending
- `app/api/auth/verify-otp/route.ts` - OTP verification
- `app/api/auth/patients/route.ts` - Patient list

---

## 📂 File Structure & Purpose

### Core Application Files

```
app/
├── api/
│   ├── doctors/
│   │   └── route.ts
│   │       Purpose: Fetch doctors from eTabeb API
│   │       Input: { SearchText, CityId, limit }
│   │       Output: Array of doctor objects
│   │
│   ├── timeslots/
│   │   └── route.ts
│   │       Purpose: Fetch available timeslots
│   │       Input: { medicalFacilityDoctorSpecialityRTId }
│   │       Output: Array of timeslot objects
│   │
│   └── auth/
│       ├── search-user/
│       │   └── route.ts
│       │       Purpose: Search user by phone number
│       │       Input: { mobileNumber, countryId }
│       │       Output: { sessionId, userId, userExists }
│       │
│       ├── send-otp/
│       │   └── route.ts
│       │       Purpose: Send OTP to user's phone
│       │       Input: { mobileNumber, countryId }
│       │       Output: { signOTPId }
│       │
│       ├── verify-otp/
│       │   └── route.ts
│       │       Purpose: Verify OTP code
│       │       Input: { signOTPId, signOTPCode }
│       │       Output: { success, message }
│       │
│       └── patients/
│           └── route.ts
│               Purpose: Get user's patient list
│               Input: { sessionId, mobileNumber }
│               Output: Array of patient objects
│
├── appointments/
│   └── page.tsx
│       Purpose: Main booking page (browse doctors)
│       Features: Search, filter, view profiles
│
├── book/
│   └── page.tsx
│       Purpose: Complete booking flow
│       Features: OTP, patient selection, confirmation
│
└── globals.css
    Purpose: Global styles and branding
```

### MCP Server Files

```
chatgpt-app/
├── server.js
│   Purpose: MCP server implementation
│   Port: 3001
│   Endpoints:
│   • POST /mcp - MCP protocol handler
│   • POST /mcp-v2 - Cache-busted endpoint
│   • GET /mcp - Server info
│   
│   Tools:
│   • open_booking_widget_v2 - Opens widget
│   • search_doctors - Searches doctors
│   • get_timeslots - Gets timeslots
│   
│   Resources:
│   • resource://booking-widget - Widget HTML
│
├── public/
│   └── booking-widget.html
│       Purpose: Interactive booking widget
│       Features:
│       • Doctor search and display
│       • Timeslot selection (grouped by date)
│       • OTP authentication flow
│       • Patient selection
│       • Inline SVG logo
│       • Dark mode UI
│       • Global sessionId management
│
└── package.json
    Purpose: MCP server dependencies
```

---

## 🔑 Key Variables & State Management

### Global State (booking-widget.html)

```javascript
// State management
let doctors = [];              // Stores search results
let selectedDoctor = null;     // Currently selected doctor
let timeslots = [];           // Available timeslots
let currentSessionId = null;   // User session ID (CRITICAL!)

// Base URL for API calls
const baseUrl = '{{BOOKING_APP_URL}}';  // Replaced by server
```

### Session Management Flow

```javascript
// 1. Search user (only once)
if (!currentSessionId) {
  const searchData = await fetch('/api/auth/search-user');
  currentSessionId = searchData.sessionId;  // e.g., 62812
}

// 2. Send OTP (uses existing sessionId)
await fetch('/api/auth/send-otp', {
  body: JSON.stringify({ mobileNumber, countryId })
});

// 3. Verify OTP (uses stored sessionId)
await fetch('/api/auth/verify-otp', {
  body: JSON.stringify({ signOTPId, signOTPCode })
});

// 4. Load patients (uses stored sessionId)
await fetch('/api/auth/patients', {
  body: JSON.stringify({ sessionId: currentSessionId })
});
```

---

## 🎨 UI Components & Styling

### Widget Styling

```css
/* Dark mode theme */
background: #1a2332;
color: #ffffff;

/* Brand colors */
--etabeb-blue: #1976B2;
--etabeb-teal: #3EBFA5;

/* Components */
.header - Logo and title
.search-box - Doctor search input
.doctor-card - Doctor profile display
.timeslot-grid - Timeslot selection
.date-accordion - Collapsible date groups
.form-group - Input fields
.btn - Action buttons
```

### Logo Implementation

```html
<!-- Inline SVG (no external dependencies) -->
<svg width="140" height="40" viewBox="0 0 140 40">
  <text x="70" y="25" fill="#3EBFA5">eTabeb</text>
  <circle cx="20" cy="20" r="8" fill="#1976B2"/>
  <path d="M20 15 L20 25 M15 20 L25 20" stroke="white"/>
</svg>
```

---

## 🔒 Security Architecture

### Data Privacy

```
┌─────────────────────────────────────────────────┐
│              ChatGPT (OpenAI)                   │
│  ✅ Sees: Intent, specialty, location           │
│  ❌ Never sees: Phone, OTP, ID, medical data   │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│         Widget (Sandboxed iframe)               │
│  🔒 All sensitive data stays here               │
│  • Phone number                                 │
│  • OTP code                                     │
│  • Patient information                          │
│  • Booking details                              │
└─────────────────────────────────────────────────┘
                     │
                     ▼ (Direct HTTPS)
┌─────────────────────────────────────────────────┐
│              eTabeb API                         │
│  • Stores all data securely                     │
│  • Processes bookings                           │
│  • Sends confirmations                          │
└─────────────────────────────────────────────────┘
```

### CSP Configuration

```javascript
// In server.js
'openai/widgetCSP': {
  connect_domains: [
    'https://e-tabeb-chat-gpt-p.vercel.app',
    'https://etapisd.etabeb.com'
  ],
  resource_domains: [
    'https://e-tabeb-chat-gpt-p.vercel.app'
  ],
  redirect_domains: [
    'https://e-tabeb-chat-gpt-p.vercel.app'
  ]
}
```

---

## 🐛 Common Issues & Solutions

### Issue: sessionId keeps changing

**Cause:** `search-user` API called multiple times  
**Solution:** Check for existing `currentSessionId` before calling API

```javascript
// ✅ Correct
if (!currentSessionId) {
  currentSessionId = await searchUser();
}

// ❌ Wrong
currentSessionId = await searchUser();  // Called every time
```

### Issue: Patient list not showing

**Cause:** Wrong sessionId passed to patients API  
**Solution:** Use globally stored `currentSessionId`

```javascript
// ✅ Correct
loadPatients(phone, currentSessionId);

// ❌ Wrong
loadPatients(phone, data.sessionId);  // From verify-otp response
```

### Issue: Logo not visible

**Cause:** External image blocked by CSP or dark mode  
**Solution:** Use inline SVG (already implemented)

---

## 📊 Performance Considerations

### API Response Times

| Endpoint | Typical Response | Notes |
|----------|-----------------|-------|
| /api/doctors | 500-1000ms | Depends on search |
| /api/timeslots | 300-800ms | Varies by doctor |
| /api/auth/search-user | 200-500ms | Fast lookup |
| /api/auth/send-otp | 1000-2000ms | SMS delivery |
| /api/auth/verify-otp | 300-600ms | Quick validation |

### Optimization Tips

1. **Cache doctor searches** - Store recent searches
2. **Lazy load timeslots** - Only fetch when needed
3. **Debounce search input** - Wait for user to stop typing
4. **Minimize API calls** - Reuse sessionId
5. **Use loading indicators** - Show user progress

---

## 🚀 Deployment Checklist

- [ ] All dependencies installed (`npm install` in both directories)
- [ ] Environment variables configured (`.env.local`)
- [ ] Next.js app builds successfully (`npm run build`)
- [ ] MCP server starts without errors (`npm start`)
- [ ] Widget loads and displays correctly
- [ ] Doctor search works
- [ ] Timeslot fetching works
- [ ] OTP flow completes successfully
- [ ] Patient list displays after OTP
- [ ] Logo visible in widget
- [ ] No console errors
- [ ] Deployed to Vercel (optional)
- [ ] ngrok configured (if using ChatGPT)
- [ ] ChatGPT connector added and tested

---

## 📞 Quick Reference

### Start Development

```bash
# Terminal 1: Next.js app
npm run dev

# Terminal 2: MCP server
cd chatgpt-app && npm start

# Terminal 3: ngrok (optional)
ngrok http 3001
```

### Access Points

- Next.js app: http://localhost:3000
- MCP server: http://localhost:3001
- Widget: http://localhost:3001/chatgpt-app/public/booking-widget.html
- MCP endpoint: http://localhost:3001/mcp-v2
- ngrok dashboard: http://localhost:4040

### Important Files

- Main config: `package.json`, `.env.local`
- MCP server: `chatgpt-app/server.js`
- Widget: `chatgpt-app/public/booking-widget.html`
- API routes: `app/api/*/route.ts`
- Booking page: `app/book/page.tsx`

---

**This document provides everything needed to understand and run the eTabeb ChatGPT integration on any machine!**
