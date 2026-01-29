# 🚀 eTabeb ChatGPT Integration - Complete Setup Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Installation Steps](#installation-steps)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Software

| Software | Version | Download Link | Purpose |
|----------|---------|---------------|---------|
| **Node.js** | 18.x or 20.x | https://nodejs.org | JavaScript runtime |
| **npm** | 9.x or higher | Comes with Node.js | Package manager |
| **Git** | Latest | https://git-scm.com | Version control |
| **ngrok** (optional) | Latest | https://ngrok.com | Local tunnel for ChatGPT |

### System Requirements
- **OS**: macOS, Linux, Windows (WSL2 recommended), or Windows native
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 500MB for dependencies

---

## 📁 Project Structure

```
chatgpt-app-with-next-js-main/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── doctors/route.ts      # Doctor search API
│   │   ├── timeslots/route.ts    # Timeslot fetching API
│   │   └── auth/                 # Authentication APIs
│   │       ├── search-user/route.ts    # User lookup
│   │       ├── send-otp/route.ts       # OTP sending
│   │       ├── verify-otp/route.ts     # OTP verification
│   │       └── patients/route.ts       # Patient list
│   ├── appointments/page.tsx     # Main booking page
│   ├── book/page.tsx            # Booking flow page
│   └── globals.css              # Global styles
│
├── chatgpt-app/                 # MCP Server for ChatGPT
│   ├── server.js                # MCP server implementation
│   ├── public/
│   │   └── booking-widget.html  # Interactive booking widget
│   └── package.json             # MCP server dependencies
│
├── public/                      # Static assets
│   ├── eTabeb.svg              # eTabeb logo (SVG)
│   └── eTabeb 4.png            # eTabeb logo (PNG)
│
├── package.json                 # Main app dependencies
├── next.config.js              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
└── .env.local                  # Environment variables (create this)
```

---

## 📦 Installation Steps

### Step 1: Clone the Repository

```bash
# Clone from GitHub
git clone https://github.com/waeils/eTabeb-ChatGPT-P.git

# Navigate to project directory
cd eTabeb-ChatGPT-P
```

### Step 2: Install Main App Dependencies

```bash
# Install Next.js app dependencies
npm install
```

**Dependencies installed:**
- `next` - React framework
- `react` & `react-dom` - UI library
- `typescript` - Type safety
- `@types/*` - TypeScript definitions
- `tailwindcss` - CSS framework (if used)

### Step 3: Install MCP Server Dependencies

```bash
# Navigate to MCP server directory
cd chatgpt-app

# Install MCP server dependencies
npm install

# Return to root
cd ..
```

**MCP Server dependencies:**
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `express` - Web server
- `cors` - Cross-origin resource sharing
- `zod` - Schema validation

---

## ⚙️ Configuration

### Step 1: Create Environment Variables

Create a `.env.local` file in the root directory:

```bash
# In project root
touch .env.local
```

Add the following configuration:

```env
# Next.js App Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_ETABEB_API_URL=https://etapisd.etabeb.com/api/AI

# MCP Server Configuration (for chatgpt-app)
BOOKING_APP_URL=http://localhost:3000
PORT=3001

# Optional: ngrok configuration (if using)
NGROK_AUTHTOKEN=your_ngrok_token_here
```

### Step 2: Verify eTabeb API Access

The application connects to these eTabeb API endpoints:

```
Base URL: https://etapisd.etabeb.com/api/AI

Endpoints used:
- /DoctorList                    # Get doctors
- /DoctorTimeslotList           # Get available timeslots
- /SearchUser                   # Search for user by phone
- /OTPRequestForSignUp          # Send OTP
- /SignOTPVerify                # Verify OTP
- /PatientList                  # Get user's patients
- /CountryListForContact        # Get country codes
```

**No API key required** - These are public endpoints.

---

## 🏃 Running the Application

### Option 1: Run Both Servers (Recommended for Development)

**Terminal 1: Next.js App**
```bash
# In project root
npm run dev
```
- Runs on: `http://localhost:3000`
- Hot reload enabled
- Access booking page: `http://localhost:3000/appointments`

**Terminal 2: MCP Server**
```bash
# In chatgpt-app directory
cd chatgpt-app
npm start
```
- Runs on: `http://localhost:3001`
- MCP endpoint: `http://localhost:3001/mcp-v2`
- Widget: `http://localhost:3001/chatgpt-app/public/booking-widget.html`

### Option 2: Production Build

```bash
# Build Next.js app
npm run build

# Start production server
npm start
```

### Option 3: Run with ngrok (For ChatGPT Integration)

**Terminal 1: Start MCP Server**
```bash
cd chatgpt-app
npm start
```

**Terminal 2: Start ngrok**
```bash
# For SSH/remote access (non-interactive)
ngrok http 3001 --log=stdout

# For local access (interactive UI)
ngrok http 3001
```

**Get ngrok URL:**
- Interactive: Look for `Forwarding https://xxxx.ngrok-free.app`
- Non-interactive: Copy the HTTPS URL from output
- Or visit: `http://localhost:4040` (ngrok web interface)

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Deploy**
```bash
# In project root
vercel

# Follow prompts:
# - Link to existing project or create new
# - Select project settings
# - Deploy
```

**Step 3: Set Environment Variables in Vercel**
```bash
# Via CLI
vercel env add NEXT_PUBLIC_ETABEB_API_URL

# Or via Vercel Dashboard:
# Settings → Environment Variables
```

**Step 4: Get Deployment URL**
```
Your app will be at: https://your-project.vercel.app
```

### Deploy MCP Server

**Option 1: Deploy to Vercel as separate project**
```bash
cd chatgpt-app
vercel
```

**Option 2: Use ngrok (for testing)**
```bash
ngrok http 3001
# Use the HTTPS URL for ChatGPT integration
```

---

## 🔗 ChatGPT Integration Setup

### Step 1: Get MCP Server URL

**Local with ngrok:**
```
https://xxxx.ngrok-free.app/mcp-v2
```

**Deployed to Vercel:**
```
https://your-mcp-server.vercel.app/mcp-v2
```

### Step 2: Connect to ChatGPT

1. Open ChatGPT
2. Go to Settings → Personalization → Custom instructions
3. Click "Add connector"
4. Enter your MCP server URL
5. Test the connection

### Step 3: Test the Integration

In ChatGPT, try:
```
"I need to book a doctor appointment"
"Find me a cardiologist in Jeddah"
"Show me available doctors"
```

---

## 🐛 Troubleshooting

### Issue: npm install fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Port 3000 or 3001 already in use

**Solution:**
```bash
# Find process using port
lsof -ti:3000  # or 3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 npm run dev
```

### Issue: ngrok stuck or not showing UI (SSH access)

**Solution:**
```bash
# Use non-interactive mode
ngrok http 3001 --log=stdout

# Or get URL via API
curl http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok-free\.app'
```

### Issue: "Module not found" errors

**Solution:**
```bash
# Ensure you're in correct directory
pwd

# Install dependencies in both locations
npm install                    # Root directory
cd chatgpt-app && npm install  # MCP server
```

### Issue: CORS errors in browser

**Solution:**
The MCP server already has CORS configured. If you still see errors:

```javascript
// In chatgpt-app/server.js, verify CORS is enabled:
app.use(cors({
  origin: '*',
  credentials: true
}));
```

### Issue: OTP verification fails

**Check console logs:**
```javascript
// Should see:
// Extracted sessionId: 62812
// Loading patients with sessionId: 62812
```

**If sessionId changes, restart MCP server:**
```bash
cd chatgpt-app
lsof -ti:3001 | xargs kill -9
npm start
```

### Issue: Logo not showing in widget

**Solution:**
Logo is now inline SVG. If still not showing:
1. Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)
2. Restart MCP server
3. Check browser console for errors

---

## 📝 Quick Reference Commands

### Development
```bash
# Start Next.js app
npm run dev

# Start MCP server
cd chatgpt-app && npm start

# Start ngrok
ngrok http 3001
```

### Production
```bash
# Build
npm run build

# Start
npm start

# Deploy to Vercel
vercel --prod
```

### Maintenance
```bash
# Update dependencies
npm update

# Check for outdated packages
npm outdated

# Clean install
rm -rf node_modules package-lock.json && npm install
```

---

## 🔐 Security Notes

1. **Never commit `.env.local`** - It's in `.gitignore`
2. **Use HTTPS in production** - Vercel provides this automatically
3. **Rotate ngrok URLs** - Free ngrok URLs change on restart
4. **Keep dependencies updated** - Run `npm audit` regularly

---

## 📊 System Architecture

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│   ChatGPT (OpenAI)          │
│   - Natural language        │
│   - Intent recognition      │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│   MCP Server (Port 3001)    │
│   - Tool definitions        │
│   - Widget serving          │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│   Next.js App (Port 3000)   │
│   - API routes              │
│   - Booking pages           │
│   - Authentication          │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│   eTabeb API                │
│   - Doctor data             │
│   - Booking system          │
│   - OTP service             │
└─────────────────────────────┘
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] `npm run dev` starts without errors
- [ ] Can access `http://localhost:3000`
- [ ] Can access `http://localhost:3001`
- [ ] MCP server shows "running on port 3001"
- [ ] Widget loads at `/chatgpt-app/public/booking-widget.html`
- [ ] Can search for doctors
- [ ] Can view timeslots
- [ ] OTP flow works (if testing with real phone)
- [ ] Logo displays in widget
- [ ] No console errors in browser

---

## 🎯 Next Steps After Setup

1. **Test locally** - Verify all features work
2. **Deploy to Vercel** - Get production URL
3. **Setup ngrok** - Connect ChatGPT to local MCP server
4. **Test ChatGPT integration** - Try natural language booking
5. **Monitor logs** - Check for errors
6. **Go live!** - Share with users

---

## 📞 Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review console logs for errors
3. Verify all dependencies are installed
4. Ensure ports 3000 and 3001 are available
5. Check that eTabeb API is accessible

---

## 🎉 Success!

You're ready to run the eTabeb ChatGPT integration on any machine!

**Quick start:**
```bash
git clone https://github.com/waeils/eTabeb-ChatGPT-P.git
cd eTabeb-ChatGPT-P
npm install
cd chatgpt-app && npm install && cd ..
npm run dev  # Terminal 1
cd chatgpt-app && npm start  # Terminal 2
```

**Access:**
- Main app: http://localhost:3000
- MCP server: http://localhost:3001
- Widget: http://localhost:3001/chatgpt-app/public/booking-widget.html

---

**Built with ❤️ for eTabeb**
