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
        _meta: {
          'openai/widgetDescription': 'Search doctors and select a timeslot, then open the secure booking page.',
          'openai/widgetDomain': 'https://widget.etabeb.com',
          'openai/widgetCSP': {
            connect_domains: [
              'https://travellable-ruthann-grazingly.ngrok-free.dev',
              'https://e-tabeb-chat-gpt-p.vercel.app',
            ],
            resource_domains: [
              'https://travellable-ruthann-grazingly.ngrok-free.dev',
              'https://e-tabeb-chat-gpt-p.vercel.app',
              'https://persistent.oaistatic.com',
            ],
            redirect_domains: [
              'https://e-tabeb-chat-gpt-p.vercel.app',
            ],
          },
        },
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === 'resource://booking-widget') {
    // Add cache-busting version to widget HTML
    const version = Date.now();
    let html = widgetHtml.replace('{{BOOKING_APP_URL}}', BOOKING_APP_URL);
    html = html.replace('</head>', `<meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate"><meta http-equiv="Pragma" content="no-cache"><meta http-equiv="Expires" content="0"></head>`);
    
    return {
      contents: [
        {
          uri: 'resource://booking-widget',
          mimeType: 'text/html',
          text: html,
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
              name: 'open_booking_widget_v2',
              description: 'Use this when the user wants to book a medical appointment. Opens an interactive booking widget where the user can search for doctors, view available timeslots, and complete their booking securely. The widget handles the entire booking flow including phone verification and patient selection.',
              inputSchema: {
                type: 'object',
                properties: {},
              },
              _meta: {
                'openai/outputTemplate': 'resource://booking-widget',
                'openai/toolInvocation/invoking': 'Opening booking widget...',
                'openai/toolInvocation/invoked': 'Booking widget ready. Search for doctors and complete your booking.',
                'openai/widgetAccessible': true,
                'openai/resultCanProduceWidget': true,
              },
            },
            {
              name: 'search_doctors',
              description: 'Search for doctors by name, specialty, or facility in Jeddah. Returns doctor details including ID, name, specialty, facility, rating, and price.',
              inputSchema: {
                type: 'object',
                properties: {
                  searchText: {
                    type: 'string',
                    description: 'Doctor name, specialty, or facility to search for',
                  },
                  limit: {
                    type: 'number',
                    description: 'Maximum number of results',
                    default: 10,
                  },
                },
                required: ['searchText'],
              },
              _meta: {
                'openai/visibility': 'private',
                'openai/widgetAccessible': true,
              },
            },
            {
              name: 'get_timeslots',
              description: 'Get available appointment timeslots for a specific doctor.',
              inputSchema: {
                type: 'object',
                properties: {
                  doctorId: {
                    type: 'string',
                    description: 'Doctor ID from search results',
                  },
                },
                required: ['doctorId'],
              },
              _meta: {
                'openai/visibility': 'private',
                'openai/widgetAccessible': true,
              },
            },
          ],
        },
      };
    } else if (request.method === 'tools/call') {
      const { name, arguments: args } = request.params;
      
      if (name === 'open_booking_widget_v2' || name === 'open_booking_widget') {
        // Simple tool that just opens the widget - no validation needed
        response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [
              {
                type: 'text',
                text: 'Opening the eTabeb booking widget. You can search for doctors, view available appointments, and complete your booking securely.',
              },
            ],
            isError: false,
          },
        };
      } else if (name === 'search_doctors') {
        const { searchText, limit = 10 } = args;
        
        // Validation
        if (!searchText || searchText.trim().length === 0) {
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{ type: 'text', text: 'Error: searchText is required. Ask the user what type of doctor they need (specialty, name, or facility).' }],
              isError: true,
            },
          };
          return;
        }
        
        try {
          const apiResponse = await fetch(`${BOOKING_APP_URL}/api/doctors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ SearchText: searchText, CityId: 1, limit }),
          });
          const doctors = await apiResponse.json();
          
          if (!doctors || doctors.length === 0) {
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{ type: 'text', text: `No doctors found for "${searchText}". Try a different search term or ask the user to be more specific.` }],
                isError: false,
              },
            };
            return;
          }
          
          const doctorList = doctors.slice(0, limit).map((d, i) => 
            `${i + 1}. **${d.name}** - ${d.specialty}\n   📍 ${d.facility}\n   ⭐ ${d.rating} | 💰 ${d.price} ${d.currency}\n   Doctor ID: ${d.id}`
          ).join('\n\n');
          
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: `Found ${doctors.length} doctors:\n\n${doctorList}\n\nAsk the user which doctor they'd like to see, then use get_timeslots with the Doctor ID.`,
                },
              ],
              isError: false,
            },
          };
        } catch (error) {
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{ type: 'text', text: `Error searching doctors: ${error.message}. Try again or ask the user to refine their search.` }],
              isError: true,
            },
          };
        }
      } else if (name === 'get_timeslots') {
        const { doctorId } = args;
        
        // Validation
        if (!doctorId) {
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{ type: 'text', text: 'Error: doctorId is required. Use search_doctors first to find a doctor, then use the Doctor ID from those results.' }],
              isError: true,
            },
          };
          return;
        }
        
        try {
          const apiResponse = await fetch(`${BOOKING_APP_URL}/api/timeslots`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ medicalFacilityDoctorSpecialityRTId: doctorId }),
          });
          const timeslots = await apiResponse.json();
          
          if (!timeslots || timeslots.length === 0) {
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{ type: 'text', text: 'No available appointments found for this doctor. Ask the user if they want to search for a different doctor.' }],
                isError: false,
              },
            };
            return;
          }
          
          const slotList = timeslots.slice(0, 20).map((slot, i) => 
            `${i + 1}. 📅 ${slot.date} - ${slot.time} (Timeslot ID: ${slot.timeslotRTId})`
          ).join('\n');
          
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: `Available appointments:\n\n${slotList}\n\nAsk the user which time works for them, then use open_booking with the Timeslot ID.`,
                },
              ],
              isError: false,
            },
          };
        } catch (error) {
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{ type: 'text', text: `Error getting timeslots: ${error.message}. The doctor ID may be invalid.` }],
              isError: true,
            },
          };
        }
      } else if (name === 'open_booking') {
        const { timeslotId, doctorName, facilityName, dateTime, specialty, price, ...extraArgs } = args;
        
        // Validation - reject if required fields missing
        if (!timeslotId || !doctorName || !facilityName || !dateTime) {
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{ 
                type: 'text', 
                text: 'Error: Cannot open booking without complete appointment details.\n\nYou MUST follow this workflow:\n1. Call search_doctors with the doctor name or specialty\n2. Show results to user and let them choose\n3. Call get_timeslots with the doctor ID from search results\n4. Show available times to user and let them choose\n5. Then call open_booking with the timeslot ID\n\nStart by calling search_doctors now.' 
              }],
              isError: true,
            },
          };
          return;
        }
        
        // Validation - timeslotId must be numeric (from API)
        if (!/^\d+$/.test(timeslotId)) {
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{ 
                type: 'text', 
                text: `Error: Invalid timeslotId "${timeslotId}". The timeslot ID must be a numeric ID from get_timeslots results (e.g., "7762646").\n\nYou cannot infer or make up timeslot IDs. You MUST:\n1. Call search_doctors to find the doctor\n2. Call get_timeslots with the doctor ID\n3. Use the actual Timeslot ID from the results\n\nStart over by calling search_doctors.` 
              }],
              isError: true,
            },
          };
          return;
        }
        
        // Validation - reject if sensitive data is included
        const sensitiveFields = ['phone', 'phoneNumber', 'mobileNumber', 'otp', 'otpCode', 'password', 'patientId', 'nationalId'];
        const foundSensitive = Object.keys(extraArgs).filter(key => 
          sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))
        );
        
        if (foundSensitive.length > 0) {
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{ 
                type: 'text', 
                text: `Error: Never include sensitive data (${foundSensitive.join(', ')}) in tool calls. The secure booking widget will collect: phone number, OTP verification, and patient selection. Only pass timeslotId, doctorName, facilityName, dateTime, specialty, and price.` 
              }],
              isError: true,
            },
          };
          return;
        }
        
        response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [
              {
                type: 'text',
                text: `Opening secure booking for Dr. ${doctorName} at ${facilityName} on ${dateTime}.\n\nThe widget will guide you through:\n1. Phone number verification (OTP)\n2. Patient selection\n3. Booking confirmation\n\nNever share your phone number or OTP in chat.`,
              },
            ],
            _meta: {
              toolOutput: {
                timeslotId: timeslotId || '',
                doctorName: doctorName || '',
                facilityName: facilityName || '',
                dateTime: dateTime || '',
                specialty: specialty || '',
                price: price || ''
              }
            },
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

// Cache-busting endpoint - same handler as /mcp but different URL
app.post('/mcp-v2', async (req, res) => {
  try {
    const request = req.body;
    console.log('MCP-v2 Request:', JSON.stringify(request, null, 2));
    
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
              name: 'open_booking_widget_v2',
              description: 'Use this when the user wants to book a medical appointment. Opens an interactive booking widget where the user can search for doctors, view available timeslots, and complete their booking securely. The widget handles the entire booking flow including phone verification and patient selection.',
              inputSchema: {
                type: 'object',
                properties: {},
              },
              _meta: {
                'openai/outputTemplate': 'resource://booking-widget',
                'openai/toolInvocation/invoking': 'Opening booking widget...',
                'openai/toolInvocation/invoked': 'Booking widget ready. Search for doctors and complete your booking.',
                'openai/widgetAccessible': true,
                'openai/resultCanProduceWidget': true,
              },
            },
            {
              name: 'search_doctors',
              description: 'Search for doctors by name, specialty, or facility in Jeddah. Returns doctor details including ID, name, specialty, facility, rating, and price.',
              inputSchema: {
                type: 'object',
                properties: {
                  searchText: {
                    type: 'string',
                    description: 'Doctor name, specialty, or facility to search for',
                  },
                  limit: {
                    type: 'number',
                    description: 'Maximum number of results',
                    default: 10,
                  },
                },
                required: ['searchText'],
              },
              _meta: {
                'openai/visibility': 'private',
                'openai/widgetAccessible': true,
              },
            },
            {
              name: 'get_timeslots',
              description: 'Get available appointment timeslots for a specific doctor.',
              inputSchema: {
                type: 'object',
                properties: {
                  doctorId: {
                    type: 'string',
                    description: 'Doctor ID from search results',
                  },
                },
                required: ['doctorId'],
              },
              _meta: {
                'openai/visibility': 'private',
                'openai/widgetAccessible': true,
              },
            },
          ],
        },
      };
    } else if (request.method === 'tools/call') {
      const { name, arguments: args } = request.params;
      
      if (name === 'open_booking_widget_v2' || name === 'open_booking_widget') {
        response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [
              {
                type: 'text',
                text: 'Opening the eTabeb booking widget. You can search for doctors, view available appointments, and complete your booking securely.',
              },
            ],
            isError: false,
          },
        };
      } else if (name === 'search_doctors') {
        const { searchText, limit = 10 } = args;
        
        if (!searchText || searchText.trim().length === 0) {
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{ type: 'text', text: 'Error: searchText is required.' }],
              isError: true,
            },
          };
        } else {
          try {
            const apiResponse = await fetch(`${BOOKING_APP_URL}/api/doctors`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ SearchText: searchText, CityId: 1, limit }),
            });
            const doctors = await apiResponse.json();
            
            if (!doctors || doctors.length === 0) {
              response = {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                  content: [{ type: 'text', text: `No doctors found for "${searchText}".` }],
                  isError: false,
                },
              };
            } else {
              const doctorList = doctors.slice(0, limit).map((d, i) => 
                `${i + 1}. **${d.name}** - ${d.specialty}\n   📍 ${d.facility}\n   ⭐ ${d.rating} | 💰 ${d.price} ${d.currency}\n   Doctor ID: ${d.id}`
              ).join('\n\n');
              
              response = {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                  content: [
                    {
                      type: 'text',
                      text: `Found ${doctors.length} doctors:\n\n${doctorList}`,
                    },
                  ],
                  isError: false,
                },
              };
            }
          } catch (error) {
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{ type: 'text', text: `Error searching doctors: ${error.message}` }],
                isError: true,
              },
            };
          }
        }
      } else if (name === 'get_timeslots') {
        const { doctorId } = args;
        
        if (!doctorId) {
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{ type: 'text', text: 'Error: doctorId is required.' }],
              isError: true,
            },
          };
        } else {
          try {
            const apiResponse = await fetch(`${BOOKING_APP_URL}/api/timeslots`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ medicalFacilityDoctorSpecialityRTId: doctorId }),
            });
            const timeslots = await apiResponse.json();
            
            if (!timeslots || timeslots.length === 0) {
              response = {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                  content: [{ type: 'text', text: 'No available appointments found for this doctor.' }],
                  isError: false,
                },
              };
            } else {
              const slotList = timeslots.slice(0, 20).map((slot, i) => 
                `${i + 1}. 📅 ${slot.date} - ${slot.time} (Timeslot ID: ${slot.timeslotRTId})`
              ).join('\n');
              
              response = {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                  content: [
                    {
                      type: 'text',
                      text: `Available appointments:\n\n${slotList}`,
                    },
                  ],
                  isError: false,
                },
              };
            }
          } catch (error) {
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{ type: 'text', text: `Error getting timeslots: ${error.message}` }],
                isError: true,
              },
            };
          }
        }
      } else {
        response = {
          jsonrpc: '2.0',
          id: request.id,
          error: { code: -32602, message: 'Unknown tool' },
        };
      }
    } else if (request.method === 'initialize') {
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
            name: 'eTabeb Booking App v2',
            version: '2.0.0',
          },
        },
      };
    } else if (request.method === 'notifications/initialized') {
      response = { jsonrpc: '2.0', id: request.id, result: {} };
    } else {
      response = { error: { code: -32601, message: 'Method not found' } };
    }
    
    console.log('MCP-v2 Response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('MCP-v2 Error:', error);
    res.status(500).json({ error: { code: -32603, message: error.message } });
  }
});

app.get('/mcp-v2', (req, res) => {
  res.json({
    name: 'eTabeb Booking App v2',
    version: '2.0.0',
    description: 'Medical appointment booking with eTabeb (cache-busted)',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 eTabeb ChatGPT App running on port ${PORT}`);
  console.log(`📍 MCP endpoint: ${BASE_URL}/mcp`);
  console.log(`📍 MCP v2 endpoint (cache-busted): ${BASE_URL}/mcp-v2`);
});
