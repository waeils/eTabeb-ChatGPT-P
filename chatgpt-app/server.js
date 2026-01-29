import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static('public'));

const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const BOOKING_APP_URL = process.env.BOOKING_APP_URL || 'https://e-tabeb-chat-gpt-p.vercel.app';

const server = new Server(
  {
    name: 'eTabeb Booking App',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

const widgetHtml = fs.readFileSync(
  path.join(__dirname, 'public', 'booking-widget.html'),
  'utf-8'
);

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'resource://booking-widget',
        name: 'eTabeb Booking Widget',
        description: 'Interactive booking interface',
        mimeType: 'text/html',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === 'resource://booking-widget') {
    return {
      contents: [
        {
          uri: 'resource://booking-widget',
          mimeType: 'text/html',
          text: widgetHtml.replace('{{BOOKING_APP_URL}}', BOOKING_APP_URL),
        },
      ],
    };
  }
  throw new Error('Resource not found');
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'open_booking',
        description: 'Open the eTabeb booking interface for completing appointment booking',
        inputSchema: {
          type: 'object',
          properties: {
            doctorId: {
              type: 'string',
              description: 'Doctor ID from search results',
            },
            doctorName: {
              type: 'string',
              description: 'Doctor name',
            },
            facilityName: {
              type: 'string',
              description: 'Medical facility name',
            },
          },
          required: ['doctorId', 'doctorName', 'facilityName'],
        },
        _meta: {
          'openai/outputTemplate': 'resource://booking-widget',
          'openai/toolInvocation/invoking': 'Opening booking interface...',
          'openai/toolInvocation/invoked': 'Booking interface ready',
          'openai/widgetAccessible': true,
          'openai/resultCanProduceWidget': true,
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'open_booking') {
    const { doctorId, doctorName, facilityName } = args;

    return {
      content: [
        {
          type: 'text',
          text: `Opening booking interface for Dr. ${doctorName} at ${facilityName}. You can now complete your booking securely.`,
        },
      ],
      isError: false,
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// OAuth discovery endpoints (return empty/disabled OAuth)
app.get('/.well-known/oauth-authorization-server', (req, res) => {
  res.status(404).json({ error: 'OAuth not configured' });
});

app.get('/.well-known/oauth-authorization-server/mcp', (req, res) => {
  res.status(404).json({ error: 'OAuth not configured' });
});

app.get('/mcp/.well-known/oauth-authorization-server', (req, res) => {
  res.status(404).json({ error: 'OAuth not configured' });
});

app.get('/.well-known/oauth-protected-resource', (req, res) => {
  res.status(404).json({ error: 'OAuth not configured' });
});

app.get('/.well-known/oauth-protected-resource/mcp', (req, res) => {
  res.status(404).json({ error: 'OAuth not configured' });
});

app.get('/.well-known/openid-configuration', (req, res) => {
  res.status(404).json({ error: 'OAuth not configured' });
});

app.get('/.well-known/openid-configuration/mcp', (req, res) => {
  res.status(404).json({ error: 'OAuth not configured' });
});

app.get('/mcp/.well-known/openid-configuration', (req, res) => {
  res.status(404).json({ error: 'OAuth not configured' });
});

// Handle MCP JSON-RPC requests directly
app.post('/mcp', async (req, res) => {
  try {
    const request = req.body;
    console.log('MCP Request:', JSON.stringify(request, null, 2));
    
    let response;
    
    // Route based on method - return data directly
    if (request.method === 'resources/list') {
      response = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          resources: [
            {
              uri: 'resource://booking-widget',
              name: 'eTabeb Booking Widget',
              description: 'Interactive booking interface',
              mimeType: 'text/html',
            },
          ],
        },
      };
    } else if (request.method === 'resources/read') {
      const uri = request.params?.uri;
      if (uri === 'resource://booking-widget') {
        response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            contents: [
              {
                uri: 'resource://booking-widget',
                mimeType: 'text/html',
                text: widgetHtml.replace('{{BOOKING_APP_URL}}', BOOKING_APP_URL),
              },
            ],
          },
        };
      } else {
        response = {
          jsonrpc: '2.0',
          id: request.id,
          error: { code: -32602, message: 'Resource not found' },
        };
      }
    } else if (request.method === 'tools/list') {
      response = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          tools: [
            {
              name: 'open_booking',
              description: 'Open the eTabeb booking interface for completing appointment booking',
              inputSchema: {
                type: 'object',
                properties: {
                  timeslotId: {
                    type: 'string',
                    description: 'Timeslot ID for the appointment',
                  },
                  doctorName: {
                    type: 'string',
                    description: 'Doctor name',
                  },
                  facilityName: {
                    type: 'string',
                    description: 'Medical facility name',
                  },
                  dateTime: {
                    type: 'string',
                    description: 'Appointment date and time (e.g., "Monday, Feb 3, 2026 - 10:00 AM")',
                  },
                },
                required: ['timeslotId', 'doctorName', 'facilityName', 'dateTime'],
              },
              _meta: {
                'openai/outputTemplate': 'resource://booking-widget',
                'openai/toolInvocation/invoking': 'Opening booking interface...',
                'openai/toolInvocation/invoked': 'Booking interface ready',
                'openai/widgetAccessible': true,
                'openai/resultCanProduceWidget': true,
              },
            },
          ],
        },
      };
    } else if (request.method === 'tools/call') {
      const { name, arguments: args } = request.params;
      if (name === 'open_booking') {
        const { timeslotId, doctorName, facilityName, dateTime } = args;
        response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [
              {
                type: 'text',
                text: `Opening booking for Dr. ${doctorName} at ${facilityName} on ${dateTime}. Complete your booking securely in the widget.`,
              },
            ],
            isError: false,
          },
        };
      } else {
        response = {
          jsonrpc: '2.0',
          id: request.id,
          error: { code: -32602, message: 'Unknown tool' },
        };
      }
    } else if (request.method === 'initialize') {
      // Match the client's protocol version
      const clientVersion = request.params?.protocolVersion || '2024-11-05';
      response = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: clientVersion,
          capabilities: {
            tools: {},
            resources: {},
          },
          serverInfo: {
            name: 'eTabeb Booking App',
            version: '1.0.0',
          },
        },
      };
    } else if (request.method === 'notifications/initialized') {
      // Acknowledge initialized notification
      response = { jsonrpc: '2.0', id: request.id, result: {} };
    } else {
      response = { error: { code: -32601, message: 'Method not found' } };
    }
    
    console.log('MCP Response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('MCP Error:', error);
    res.status(500).json({ error: { code: -32603, message: error.message } });
  }
});

app.get('/mcp', (req, res) => {
  res.json({
    name: 'eTabeb Booking App',
    version: '1.0.0',
    description: 'Medical appointment booking with eTabeb',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 eTabeb ChatGPT App running on port ${PORT}`);
  console.log(`📍 MCP endpoint: ${BASE_URL}/mcp`);
});
