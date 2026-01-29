# Cache Busting Instructions - ChatGPT App

## ✅ Changes Applied

1. **Tool renamed**: `open_booking_widget` → `open_booking_widget_v2`
2. **New endpoint**: `/mcp-v2` (cache-busted version of `/mcp`)
3. **Cache headers**: Added no-cache headers to widget HTML
4. **Private tools**: `search_doctors` and `get_timeslots` have `openai/visibility: private`

## MCP Server Status

**Running on port 3001** with two endpoints:
- `http://localhost:3001/mcp` (old)
- `http://localhost:3001/mcp-v2` (new, cache-busted) ✅

## Steps to Fix Tool Caching

### 1. Delete Current Connector
In ChatGPT App settings:
- Click on "eTabeb Booking"
- Click "Disconnect"
- **Delete the connector completely** (if there's a delete option)

### 2. Reconnect to New Endpoint
- Add new connector
- **URL**: `http://localhost:3001/mcp-v2` ⚠️ (use `/mcp-v2` not `/mcp`)
- Save/Connect

### 3. Refresh Connector Metadata
In ChatGPT:
- Settings → Connectors → Your connector → **Refresh**
- This forces ChatGPT to fetch new tool list

### 4. Start New Chat
- **Important**: Start a brand new conversation
- Old chats may have cached tool lists

### 5. Test
Say: "I need to book appointment"

**Expected**: ChatGPT calls `open_booking_widget_v2` (not `open_booking`)

## Verify Tools

Test the endpoint:
```bash
curl -X POST http://localhost:3001/mcp-v2 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq '.result.tools[] | .name'
```

**Should show**:
- `open_booking_widget_v2` ✅
- `search_doctors` (private)
- `get_timeslots` (private)

**Should NOT show**:
- `open_booking` ❌

## If Still Seeing Old Tool

Try these in order:

1. **Hard refresh**: Disconnect → Wait 30 seconds → Reconnect to `/mcp-v2`

2. **Clear browser cache**: In ChatGPT, hard refresh (Cmd+Shift+R on Mac)

3. **Use ngrok**: If localhost caching persists, expose via ngrok:
   ```bash
   ngrok http 3001
   ```
   Then use: `https://[your-id].ngrok.app/mcp-v2`

4. **Rename tool again**: Change `_v2` to `_v3` or add date `_20260129`

## Expected Behavior After Fix

1. User: "I need to book appointment"
2. ChatGPT calls `open_booking_widget_v2`
3. Widget opens with interactive UI
4. User searches for doctors in widget
5. Widget calls `search_doctors` (private tool) via `window.openai.callTool`
6. User selects doctor
7. Widget calls `get_timeslots` (private tool)
8. User selects timeslot
9. Widget navigates to `/book` page with all details
10. User completes booking

## Fallback: Use Custom GPT

If ChatGPT App caching persists after all attempts:
- **Deploy Custom GPT** (configuration in `CUSTOM_GPT_PRODUCTION.md`)
- Custom GPT has no caching issues
- Already tested and working ✅
- Production ready

## Summary

The MCP server is configured correctly with:
- ✅ New tool name (`_v2`)
- ✅ New endpoint (`/mcp-v2`)
- ✅ Cache-busting headers
- ✅ Private tools for widget-only access

**Next step**: Delete connector, reconnect to `/mcp-v2`, refresh, test in new chat.
