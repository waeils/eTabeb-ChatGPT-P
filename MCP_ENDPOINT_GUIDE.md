# 🔌 MCP Endpoint Configuration Guide

## 📍 Available Endpoints

The MCP server provides **two endpoints** for ChatGPT integration:

### 1. `/mcp` - Standard Endpoint
```
URL: http://localhost:3001/mcp
Purpose: Original MCP endpoint
Status: ✅ Active
```

### 2. `/mcp-v2` - Cache-Busted Endpoint (Recommended)
```
URL: http://localhost:3001/mcp-v2
Purpose: Cache-busted version for ChatGPT
Status: ✅ Active
```

---

## 🔧 How /mcp-v2 Works

### Server Configuration

Both endpoints are defined in `chatgpt-app/server.js`:

```javascript
// Line 568-852: POST /mcp-v2 - Main MCP protocol handler
app.post('/mcp-v2', async (req, res) => {
  // Handles all MCP protocol requests:
  // - resources/list
  // - resources/read
  // - tools/list
  // - tools/call
  // - initialize
  // - notifications/initialized
});

// Line 854-860: GET /mcp-v2 - Server info endpoint
app.get('/mcp-v2', (req, res) => {
  res.json({
    name: 'eTabeb Booking App v2',
    version: '2.0.0',
    description: 'Medical appointment booking with eTabeb (cache-busted)'
  });
});
```

### Why Two Endpoints?

**`/mcp`** - Original endpoint
- May be cached by ChatGPT
- Tool definitions might not update

**`/mcp-v2`** - Cache-busted version
- Forces ChatGPT to reload tool definitions
- Ensures latest widget code is served
- Recommended for production

---

## 🚀 Setup on New Server

### Step 1: Verify Server is Running

```bash
# Navigate to project
cd /path/to/eTabeb-ChatGPT-P/chatgpt-app

# Install dependencies (if not done)
npm install

# Start MCP server
npm start
```

**Expected output:**
```
🚀 eTabeb ChatGPT App running on port 3001
📍 MCP endpoint: http://localhost:3001/mcp
📍 MCP v2 endpoint (cache-busted): http://localhost:3001/mcp-v2
```

### Step 2: Test Endpoints Locally

**Test GET endpoint:**
```bash
curl http://localhost:3001/mcp-v2
```

**Expected response:**
```json
{
  "name": "eTabeb Booking App v2",
  "version": "2.0.0",
  "description": "Medical appointment booking with eTabeb (cache-busted)"
}
```

**Test POST endpoint (MCP protocol):**
```bash
curl -X POST http://localhost:3001/mcp-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'
```

**Expected response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "open_booking_widget_v2",
        "description": "Use this when the user wants to book...",
        ...
      },
      {
        "name": "search_doctors",
        ...
      },
      {
        "name": "get_timeslots",
        ...
      }
    ]
  }
}
```

### Step 3: Expose Server to Internet

**Option A: Using ngrok (Recommended for Testing)**

```bash
# In a new terminal
ngrok http 3001 --log=stdout

# Or for interactive UI (if not SSH)
ngrok http 3001
```

**Get the HTTPS URL:**
```
Forwarding: https://abc123.ngrok-free.app -> http://localhost:3001
```

**Your MCP endpoint will be:**
```
https://abc123.ngrok-free.app/mcp-v2
```

**Option B: Deploy to Production Server**

If your server has a public IP or domain:
```
https://your-domain.com:3001/mcp-v2
```

Make sure:
- Port 3001 is open in firewall
- HTTPS is configured (required by ChatGPT)
- Server is running continuously (use PM2 or systemd)

---

## 🔗 Connect to ChatGPT

### Step 1: Get Your MCP URL

**Format:**
```
https://YOUR_SERVER/mcp-v2
```

**Examples:**
- ngrok: `https://abc123.ngrok-free.app/mcp-v2`
- Production: `https://api.etabeb.com:3001/mcp-v2`
- Local (won't work): `http://localhost:3001/mcp-v2`

### Step 2: Add Connector in ChatGPT

1. Open ChatGPT
2. Click your profile → Settings
3. Go to **Personalization** → **Custom instructions**
4. Scroll to **Connectors**
5. Click **Add connector**
6. Enter your MCP URL: `https://YOUR_SERVER/mcp-v2`
7. Click **Connect**

### Step 3: Verify Connection

ChatGPT should show:
```
✅ Connected to eTabeb Booking App v2
```

If you see an error, check:
- Server is running (`npm start`)
- URL is correct (includes `/mcp-v2`)
- URL uses HTTPS (not HTTP)
- Server is accessible from internet

---

## 🐛 Troubleshooting

### Issue: "Can't find /mcp-v2 endpoint"

**Cause:** Server not running or endpoint not accessible

**Solution:**
```bash
# 1. Check if server is running
lsof -i:3001

# 2. If not running, start it
cd chatgpt-app
npm start

# 3. Verify endpoint exists
curl http://localhost:3001/mcp-v2

# 4. Check server logs for errors
```

### Issue: "AI agent asks to use /mcp without v2"

**Cause:** ChatGPT cached old connector URL

**Solution:**
```
1. In ChatGPT Settings → Connectors
2. Remove old connector (if exists)
3. Add new connector with /mcp-v2 URL
4. Refresh ChatGPT page
5. Test connection
```

### Issue: "Connection refused"

**Cause:** Server not accessible from internet

**Solution:**
```bash
# If using ngrok:
1. Make sure ngrok is running
2. Use the HTTPS URL from ngrok output
3. Update ChatGPT connector with new URL

# If using production server:
1. Check firewall allows port 3001
2. Verify HTTPS is configured
3. Test with: curl https://YOUR_SERVER/mcp-v2
```

### Issue: "Tools not showing in ChatGPT"

**Cause:** MCP protocol not responding correctly

**Solution:**
```bash
# Test tools/list endpoint
curl -X POST http://localhost:3001/mcp-v2 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

# Should return 3 tools:
# - open_booking_widget_v2
# - search_doctors
# - get_timeslots
```

---

## 📋 Verification Checklist

After setup on new server, verify:

- [ ] MCP server starts without errors
- [ ] Port 3001 is accessible
- [ ] GET `/mcp-v2` returns server info
- [ ] POST `/mcp-v2` with `tools/list` returns 3 tools
- [ ] ngrok (or public URL) is working
- [ ] HTTPS URL is accessible from internet
- [ ] ChatGPT connector added with `/mcp-v2` URL
- [ ] ChatGPT shows "Connected" status
- [ ] Can test with "I need to book a doctor"

---

## 🔄 Switching Between Endpoints

### From /mcp to /mcp-v2

**In ChatGPT:**
1. Settings → Connectors
2. Edit existing connector
3. Change URL from:
   ```
   https://YOUR_SERVER/mcp
   ```
   To:
   ```
   https://YOUR_SERVER/mcp-v2
   ```
4. Save and reconnect

**Why switch?**
- `/mcp-v2` has latest updates
- Forces cache refresh
- Better for production

### From /mcp-v2 to /mcp

Not recommended, but if needed:
- Just change URL back to `/mcp`
- Both endpoints work identically

---

## 🚀 Production Deployment

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start MCP server with PM2
cd chatgpt-app
pm2 start npm --name "etabeb-mcp" -- start

# Save PM2 configuration
pm2 save

# Setup auto-restart on server reboot
pm2 startup
```

### Using systemd (Linux)

Create `/etc/systemd/system/etabeb-mcp.service`:

```ini
[Unit]
Description=eTabeb MCP Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/eTabeb-ChatGPT-P/chatgpt-app
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable etabeb-mcp
sudo systemctl start etabeb-mcp
sudo systemctl status etabeb-mcp
```

---

## 📊 Monitoring

### Check Server Status

```bash
# Check if server is running
curl http://localhost:3001/mcp-v2

# Check server logs (if using PM2)
pm2 logs etabeb-mcp

# Check server logs (if using systemd)
sudo journalctl -u etabeb-mcp -f
```

### Test MCP Protocol

```bash
# Test initialize
curl -X POST http://localhost:3001/mcp-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-11-25",
      "capabilities": {},
      "clientInfo": {"name": "test", "version": "1.0.0"}
    },
    "id": 1
  }'
```

---

## 🎯 Quick Setup Summary

```bash
# 1. Clone and install
git clone https://github.com/waeils/eTabeb-ChatGPT-P.git
cd eTabeb-ChatGPT-P/chatgpt-app
npm install

# 2. Start server
npm start

# 3. Expose to internet (choose one)
ngrok http 3001                    # For testing
# OR configure production server   # For production

# 4. Get URL
# ngrok: https://abc123.ngrok-free.app/mcp-v2
# production: https://your-domain.com:3001/mcp-v2

# 5. Add to ChatGPT
# Settings → Connectors → Add connector
# Enter: https://YOUR_URL/mcp-v2

# 6. Test
# In ChatGPT: "I need to book a doctor"
```

---

## ✅ Success Indicators

You'll know it's working when:

1. **Server logs show:**
   ```
   🚀 eTabeb ChatGPT App running on port 3001
   📍 MCP v2 endpoint (cache-busted): http://localhost:3001/mcp-v2
   ```

2. **ChatGPT shows:**
   ```
   ✅ Connected to eTabeb Booking App v2
   ```

3. **When you say "book a doctor", ChatGPT:**
   - Opens the booking widget
   - Shows doctor search interface
   - Displays eTabeb branding

---

## 🔑 Key Points

1. **Always use `/mcp-v2`** - It's the cache-busted version
2. **HTTPS required** - ChatGPT won't connect to HTTP
3. **Server must be running** - Check with `curl`
4. **Test locally first** - Before exposing to internet
5. **Use PM2 in production** - For auto-restart and monitoring

---

**Your MCP endpoint is ready when you can access:**
```
https://YOUR_SERVER/mcp-v2
```

And it returns:
```json
{
  "name": "eTabeb Booking App v2",
  "version": "2.0.0",
  "description": "Medical appointment booking with eTabeb (cache-busted)"
}
```
