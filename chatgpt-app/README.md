# eTabeb Medical Booking Assistant

Book medical appointments with doctors across Saudi Arabia directly from ChatGPT.

## 🌟 Features

- 🔍 **Smart Doctor Search** - Find doctors by specialty, name, or facility
- 📅 **Real-Time Availability** - View live appointment slots with AM/PM times
- 🏥 **Comprehensive Profiles** - Doctor ratings, specialties, and facility information
- 📱 **OTP Verification** - Secure 4-digit OTP authentication
- 👥 **Patient Management** - Select from registered patients via dropdown
- ✅ **Instant Confirmation** - Immediate booking confirmation with details
- 🎨 **Professional UI** - Booking.com-inspired design with smooth navigation

## Architecture

**MCP Server with Interactive Widget:**
- **MCP Tools**: Doctor search and booking widget launcher
- **Interactive Widget**: Full-featured booking interface with real-time updates
- **Secure Backend**: OTP verification and appointment reservation

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

## 💬 Usage Examples

**Search by Specialty:**
```
"I need to book an endocrinology appointment"
"Find me a cardiologist"
```

**Search by Doctor Name:**
```
"I want to book with Dr. Hanan Faruqui"
"Book appointment with Hanan Mohammed Faruqui"
```

**Search by Facility:**
```
"Show me doctors at Dr. Soliman Fakeeh Hospital"
```

## 🔒 Privacy & Security

- **Data Encryption**: All sensitive data encrypted in transit and at rest
- **OTP Authentication**: 4-digit OTP verification for secure booking
- **HIPAA Compliant**: Follows healthcare data protection standards
- **No Data Selling**: Patient information never shared with third parties
- **Minimal Collection**: Only collects data necessary for booking

## 🌍 Supported Regions

Currently available for healthcare facilities in **Saudi Arabia**.

## 📋 MCP Store Submission

### Prerequisites Checklist

- ✅ HTTPS endpoint configured
- ✅ MCP manifest file created
- ✅ Comprehensive documentation
- ✅ Privacy policy published
- ✅ Support contact provided
- ✅ End-to-end testing completed

### Submission Process

1. **Review Guidelines**: [OpenAI MCP Submission](https://platform.openai.com/mcp)
2. **Test Thoroughly**: Complete booking flow in developer mode
3. **Prepare Assets**: Screenshots, demo video, documentation
4. **Submit**: Via OpenAI Developer Portal

### Required Information

- Server URL: `https://mcp.etabeb.sa/mcp`
- Category: Healthcare & Booking
- Privacy Policy: [Link to policy]
- Terms of Service: [Link to terms]
- Support Email: support@etabeb.com

## 🛠️ Technical Details

### MCP Tools

1. **search_doctors**
   - Searches by specialty, doctor name, or facility
   - Returns: Doctor profiles with availability, ratings, pricing
   - Handles titles (Dr., Doctor, Prof.) automatically

2. **open_booking_widget_v2**
   - Opens interactive booking widget
   - Features: Date selection, timeslot picker, OTP verification
   - Returns: Booking confirmation with appointment details

### API Endpoints

- `POST /mcp` - MCP protocol handler
- `POST /api/timeslots` - Fetch available appointment times
- `POST /api/auth/search-user` - User lookup
- `POST /api/auth/send-otp` - Send OTP code
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/patients` - Get patient list
- `POST /api/appointments/reserve` - Reserve appointment

## 📁 Project Structure

```
chatgpt-app/
├── server.js                    # MCP server with tool handlers
├── public/
│   └── booking-widget.html      # Interactive booking widget
├── package.json                 # Dependencies
├── mcp-manifest.json           # MCP store metadata
└── README.md                    # Documentation
```

## 🚀 Deployment

Server is deployed and running via PM2:

```bash
pm2 status etabeb-mcp
pm2 logs etabeb-mcp
pm2 restart etabeb-mcp
```

## 📞 Support

- **Email**: support@etabeb.com
- **Website**: https://etabeb.com
- **Documentation**: https://etabeb.com/docs

## 📄 License

MIT License - See LICENSE file for details
