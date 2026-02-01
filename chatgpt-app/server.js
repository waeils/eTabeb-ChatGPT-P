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

// Serve widget with URL parameters
app.get('/widget', (req, res) => {
  const searchText = req.query.searchText || '';
  const widgetHtmlPath = path.join(__dirname, 'public', 'booking-widget.html');
  let html = fs.readFileSync(widgetHtmlPath, 'utf8');
  
  // Inject searchText as URL parameter that widget can read
  html = html.replace('{{BOOKING_APP_URL}}', BOOKING_APP_URL);
  
  // Inject searchText into a script tag
  const widgetParamsScript = `<script>window.WIDGET_PARAMS = { searchText: ${JSON.stringify(searchText)} };</script>`;
  html = html.replace('</head>', `${widgetParamsScript}</head>`);
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

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

// Store search context in memory (session-based)
let currentSearchContext = '';

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
          'openai/widgetDomain': 'mcp.etabeb.sa',
          'openai/widgetCSP': {
            connect_domains: [
              'https://mcp.etabeb.sa',
              'https://e-tabeb-chat-gpt-p.vercel.app',
              'https://etapisd.etabeb.com',
            ],
            resource_domains: [
              'https://mcp.etabeb.sa',
              'https://e-tabeb-chat-gpt-p.vercel.app',
              'https://persistent.oaistatic.com',
              'https://api4web.etabeb.com',
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
    // Add timestamp to force cache refresh
    const timestamp = Date.now();
    const html = widgetHtml
      .replace('{{BOOKING_APP_URL}}', BOOKING_APP_URL)
      .replace('</head>', `<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" /><meta http-equiv="Pragma" content="no-cache" /><meta http-equiv="Expires" content="0" /><!-- v${timestamp} --></head>`);
    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: 'text/html',
          text: html,
          _meta: {
            'openai/widgetDomain': 'mcp.etabeb.sa',
            'openai/widgetCSP': {
              resource_domains: [
                'https://mcp.etabeb.sa',
                'https://e-tabeb-chat-gpt-p.vercel.app',
                'https://persistent.oaistatic.com',
              ],
              connect_domains: [
                'https://mcp.etabeb.sa',
                'https://e-tabeb-chat-gpt-p.vercel.app',
                'https://etapisd.etabeb.com',
              ],
              redirect_domains: [
                'https://e-tabeb-chat-gpt-p.vercel.app',
              ],
            },
          },
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
      console.log('🔍 SERVING resources/list from /mcp');
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
              _meta: {
                'openai/widgetDescription': 'Search doctors and select a timeslot, then open the secure booking page.',
                'openai/widgetDomain': 'mcp.etabeb.sa',
                'openai/widgetCSP': {
                  connect_domains: [
                    'https://mcp.etabeb.sa',
                    'https://e-tabeb-chat-gpt-p.vercel.app',
                    'https://etapisd.etabeb.com',
                  ],
                  resource_domains: [
                    'https://mcp.etabeb.sa',
                    'https://e-tabeb-chat-gpt-p.vercel.app',
                    'https://persistent.oaistatic.com',
                    'https://api4web.etabeb.com',
                  ],
                  redirect_domains: [
                    'https://e-tabeb-chat-gpt-p.vercel.app',
                  ],
                },
              },
            },
          ],
        },
      };
    } else if (request.method === 'resources/read') {
      console.log('🔍 SERVING resources/read from', req.path);
      const uri = request.params?.uri;
      if (uri && uri.startsWith('resource://booking-widget')) {
        // Parse searchText from the resource URI query string.
        // This avoids relying on globals across serverless invocations.
        let searchText = '';
        try {
          const parsed = new URL(uri.replace('resource://', 'https://resource.local/'));
          searchText = (parsed.searchParams.get('searchText') || '').trim();
        } catch {
          searchText = '';
        }
        // Fallback to in-memory context (best-effort)
        if (!searchText) searchText = (currentSearchContext || '').trim();

        // Fetch doctors at render-time to ensure widget always has data
        let preloadedDoctorsData = [];
        try {
          if (searchText) {
            console.log('[MCP resources/read] Fetching doctors for searchText:', searchText);
            const apiResponse = await fetch('https://etapisd.etabeb.com/api/AI/DoctorList', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ searchText }),
            });
            const doctors = await apiResponse.json();
            if (Array.isArray(doctors)) preloadedDoctorsData = doctors;
          }
        } catch (error) {
          console.error('[MCP resources/read] Error fetching doctors:', error);
        }

        const hasPreloaded = preloadedDoctorsData.length > 0;
        console.log('[MCP resources/read] Loading widget with:', { searchText, hasPreloaded, doctorCount: preloadedDoctorsData.length });

        // Inject searchText and preloaded doctors into widget HTML as JSON
        let customWidgetHtml = widgetHtml.replace('{{BOOKING_APP_URL}}', BOOKING_APP_URL);
        const widgetParamsScript = `<script>
          window.WIDGET_PARAMS = { searchText: ${JSON.stringify(searchText)}, preloadedResults: ${hasPreloaded} };
          window.PRELOADED_DOCTORS_DATA = ${JSON.stringify(preloadedDoctorsData)};
          console.log('[RESOURCES/READ] searchText:', window.WIDGET_PARAMS?.searchText);
          console.log('[RESOURCES/READ] preloadedResults:', window.WIDGET_PARAMS?.preloadedResults);
          console.log('[RESOURCES/READ] Injected doctors:', window.PRELOADED_DOCTORS_DATA?.length || 0);
        </script>`;
        customWidgetHtml = customWidgetHtml.replace('</head>', `${widgetParamsScript}</head>`) + `<!-- Cache-bust: ${Date.now()} -->`;

        response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            contents: [
              {
                uri: uri,
                mimeType: 'text/html',
                text: customWidgetHtml,
                _meta: {
                  'openai/widgetDomain': 'mcp.etabeb.sa',
                  'openai/widgetCSP': {
                    resource_domains: [
                      'https://mcp.etabeb.sa',
                      'https://e-tabeb-chat-gpt-p.vercel.app',
                      'https://persistent.oaistatic.com',
                      'https://api4web.etabeb.com',
                    ],
                    connect_domains: [
                      'https://mcp.etabeb.sa',
                      'https://e-tabeb-chat-gpt-p.vercel.app',
                      'https://etapisd.etabeb.com',
                    ],
                    redirect_domains: [
                      'https://e-tabeb-chat-gpt-p.vercel.app',
                    ],
                  },
                },
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
      console.log('🔍 SERVING tools/list from', req.path);
      response = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          tools: [
            {
              name: 'open_booking_widget_v2',
              description: 'Opens an interactive booking widget with available doctors. Use this to show doctor availability and let users book appointments.',
              inputSchema: {
                type: 'object',
                properties: {
                  searchText: {
                    type: 'string',
                    description: 'Doctor specialty, doctor name, or medical condition from user message (e.g., "endocrinology", "Dr. Smith", "diabetes")',
                  },
                },
                required: ['searchText'],
              },
              _meta: {
                'openai/outputTemplate': 'resource://booking-widget?searchText={{searchText}}',
                'openai/resultCanProduceWidget': true,
                'openai/widgetAccessible': true,
                'openai/toolInvocation/invoking': 'Opening booking widget...',
                'openai/toolInvocation/invoked': 'Booking widget ready. Search for doctors and complete your booking.',
                'openai/widgetDomain': 'mcp.etabeb.sa',
                'openai/widgetCSP': {
                  resource_domains: [
                    'https://mcp.etabeb.sa',
                    'https://e-tabeb-chat-gpt-p.vercel.app',
                    'https://persistent.oaistatic.com',
                    'https://api4web.etabeb.com'
                  ],
                  connect_domains: [
                    'https://mcp.etabeb.sa',
                    'https://e-tabeb-chat-gpt-p.vercel.app',
                    'https://etapisd.etabeb.com'
                  ],
                  redirect_domains: [
                    'https://e-tabeb-chat-gpt-p.vercel.app'
                  ]
                },
              },
            },
            {
              name: 'search_doctors',
              description: 'ALWAYS use this FIRST before opening the booking widget. If user mentions a specific doctor name, search with that name immediately. If user mentions specialty, search with that specialty. Ask ONLY: "What specialty?" if not provided. Do NOT ask about city, gender, adult/pediatric, insurance, time, or hospital names. After showing results, ask if they want to proceed with booking.',
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
            {
              name: 'get_search_context',
              description: 'Widget-only tool to retrieve the current search context.',
              inputSchema: {
                type: 'object',
                properties: {},
              },
              _meta: {
                'openai/visibility': 'private',
                'openai/widgetAccessible': true,
              },
            },
            {
              name: 'lookup_specialty',
              description: 'Convert specialty name to specialty ID. Call this before searching doctors if user mentions a specialty.',
              inputSchema: {
                type: 'object',
                properties: {
                  specialtyName: {
                    type: 'string',
                    description: 'Specialty name (e.g., "endocrinology", "dermatology")',
                  },
                },
                required: ['specialtyName'],
              },
              _meta: {
                'openai/visibility': 'private',
              },
            },
            {
              name: 'lookup_facility',
              description: 'Convert facility/hospital name to facility ID. Call this if user mentions a specific hospital.',
              inputSchema: {
                type: 'object',
                properties: {
                  facilityName: {
                    type: 'string',
                    description: 'Facility name (e.g., "Fakeeh", "Soliman Fakeeh Hospital")',
                  },
                },
                required: ['facilityName'],
              },
              _meta: {
                'openai/visibility': 'private',
              },
            },
          ],
        },
      };
    } else if (request.method === 'tools/call') {
      const { name, arguments: args } = request.params;
      console.log('[MCP] tools/call received:', name, args);
      
      if (name === 'open_booking_widget_v2' || name === 'open_booking_widget') {
        try {
          console.log('[MCP] START open_booking_widget_v2 handler');
          // Get parameters from arguments
          const searchText = args?.searchText || args?.specialty || args?.doctorName || '';
          currentSearchContext = searchText;
          
          console.log('[MCP] Opening widget with params:', { searchText });
        
        // Fetch doctor search results to pre-populate widget
        let doctorsHtml = '';
        let doctorCount = 0;
        let doctors = [];
        if (searchText) {
          try {
            // Strip common titles from search text (Dr., Doctor, Prof., etc.)
            const cleanedSearchText = searchText
              .replace(/\b(dr\.?|doctor|prof\.?|professor)\s+/gi, '')
              .trim();
            
            // Use DoctorList API with searchText parameter
            console.log('[MCP] Fetching doctors from DoctorList API with searchText:', cleanedSearchText);
            const apiResponse = await fetch('https://etapisd.etabeb.com/api/AI/DoctorList', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ searchText: cleanedSearchText }),
            });
            doctors = await apiResponse.json();
            
            console.log('[MCP] Received doctors:', doctors?.length || 0);
            
            if (doctors && doctors.length > 0) {
              doctorCount = doctors.length;
              // Generate HTML for doctor results using DoctorList API fields
              doctorsHtml = doctors.map(doctor => `
                <div class="doctor-card" onclick="selectDoctor(${JSON.stringify(doctor).replace(/"/g, '&quot;')})">
                  ${doctor.timeslotCount > 0 ? `<div class="doctor-availability">${doctor.timeslotCount} slots</div>` : ''}
                  <img src="${doctor.picURL01 || 'https://e-tabeb-chat-gpt-p.vercel.app/etabeb-logo.png'}" alt="${doctor.doctorName}" onerror="this.src='https://e-tabeb-chat-gpt-p.vercel.app/etabeb-logo.png'">
                  <div class="doctor-info">
                    <div class="doctor-name">${doctor.doctorName}</div>
                    <div class="doctor-specialty">${doctor.medicalSpecialityText}</div>
                    <div class="doctor-facility">📍 ${doctor.medicalFacilityName}</div>
                    <div class="doctor-meta">
                      <span class="doctor-rating">⭐ ${doctor.ratingAvg || doctor.ratingText || 'New'}</span>
                      <span class="doctor-price">${doctor.priceRateMin || '0'} ${doctor.currencyCode}</span>
                    </div>
                  </div>
                </div>
              `).join('');
              console.log('[MCP] Generated HTML for', doctorCount, 'doctors');
            } else {
              console.log('[MCP] No doctors found for searchText:', searchText);
            }
          } catch (error) {
            console.error('[MCP] Error fetching doctors:', error);
          }
        }
        
        console.log('[MCP] About to inject doctors into widget HTML, count:', doctorCount);
        
        // Do not store preloaded doctors in memory; only update search context
        currentSearchContext = searchText;

        // Return simple text response - outputTemplate will handle opening the widget
        response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [
              {
                type: 'text',
                text: `Opening booking widget with ${doctorCount} available ${searchText} doctors...`
              }
            ],
            isError: false,
          },
        };
        } catch (error) {
          console.error('[MCP] FATAL ERROR in open_booking_widget_v2:', error);
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{ type: 'text', text: `Error: ${error.message}` }],
              isError: true,
            },
          };
        }
      } else if (name === 'lookup_specialty') {
        // Lookup specialty ID from name
        const specialtyName = args?.specialtyName || '';
        try {
          const apiResponse = await fetch('https://etapisd.etabeb.com/api/AI/SpecialitiesList', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          const specialties = await apiResponse.json();
          
          // Find matching specialty (case-insensitive, partial match)
          const match = specialties.find(s => 
            s.text.toLowerCase().includes(specialtyName.toLowerCase()) ||
            s.text1.toLowerCase().includes(specialtyName.toLowerCase())
          );
          
          if (match) {
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({ 
                      specialtyId: match.value,
                      specialtyCode: match.code,
                      specialtyName: match.text,
                      specialtyNameArabic: match.text1
                    }),
                  },
                ],
                isError: false,
              },
            };
          } else {
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({ error: 'Specialty not found', searchTerm: specialtyName }),
                  },
                ],
                isError: false,
              },
            };
          }
        } catch (error) {
          console.error('[MCP] Error looking up specialty:', error);
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ error: 'Failed to lookup specialty' }),
                },
              ],
              isError: false,
            },
          };
        }
      } else if (name === 'lookup_facility') {
        // Lookup facility ID from name
        const facilityName = args?.facilityName || '';
        try {
          const apiResponse = await fetch('https://etapisd.etabeb.com/api/AI/HospitalList', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          const facilities = await apiResponse.json();
          
          // Find matching facility (case-insensitive, partial match)
          const match = facilities.find(f => 
            f.text.toLowerCase().includes(facilityName.toLowerCase()) ||
            f.text1.toLowerCase().includes(facilityName.toLowerCase())
          );
          
          if (match) {
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({ 
                      facilityId: match.value,
                      facilityCode: match.code,
                      facilityName: match.text,
                      facilityNameArabic: match.text1
                    }),
                  },
                ],
                isError: false,
              },
            };
          } else {
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({ error: 'Facility not found', searchTerm: facilityName }),
                  },
                ],
                isError: false,
              },
            };
          }
        } catch (error) {
          console.error('[MCP] Error looking up facility:', error);
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ error: 'Failed to lookup facility' }),
                },
              ],
              isError: false,
            },
          };
        }
      } else if (name === 'get_search_context') {
        // Return the current search context for the widget
        response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ searchText: currentSearchContext }),
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
          // Strip common titles from search text (Dr., Doctor, Prof., etc.)
          const cleanedSearchText = searchText
            .replace(/\b(dr\.?|doctor|prof\.?|professor)\s+/gi, '')
            .trim();
          
          // Use DoctorList API with searchText parameter
          console.log('[MCP] Fetching doctors from DoctorList API with searchText:', cleanedSearchText);
          const apiResponse = await fetch('https://etapisd.etabeb.com/api/AI/DoctorList', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ searchText: cleanedSearchText }),
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
            `${i + 1}. **${d.doctorName}** - ${d.medicalSpecialityText}\n   📍 ${d.medicalFacilityName}\n   ⭐ ${d.ratingAvg || d.ratingText || 'New'} | 💰 ${d.priceRateMin || '0'} ${d.currencyCode}`
          ).join('\n\n');
          
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: `I found ${doctors.length} doctors matching "${searchText}":\n\n${doctorList}\n\nWould you like to proceed with booking an appointment? I can open the booking system for you to select a time slot.`,
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
      console.log('🔍 SERVING resources/list from /mcp-v2');
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
              _meta: {
                'openai/widgetDescription': 'Search doctors and select a timeslot, then open the secure booking page.',
                'openai/widgetDomain': 'mcp.etabeb.sa',
                'openai/widgetCSP': {
                  connect_domains: [
                    'https://mcp.etabeb.sa',
                    'https://e-tabeb-chat-gpt-p.vercel.app',
                    'https://etapisd.etabeb.com',
                  ],
                  resource_domains: [
                    'https://mcp.etabeb.sa',
                    'https://e-tabeb-chat-gpt-p.vercel.app',
                    'https://persistent.oaistatic.com',
                    'https://api4web.etabeb.com',
                  ],
                  redirect_domains: [
                    'https://e-tabeb-chat-gpt-p.vercel.app',
                  ],
                },
              },
            },
          ],
        },
      };
    } else if (request.method === 'resources/read') {
      console.log('🔍 SERVING resources/read from', req.path);
      const uri = request.params?.uri;
      if (uri && uri.startsWith('resource://booking-widget')) {
        // Parse searchText from the resource URI query string.
        // This avoids relying on globals across serverless invocations.
        let searchText = '';
        try {
          const parsed = new URL(uri.replace('resource://', 'https://resource.local/'));
          searchText = (parsed.searchParams.get('searchText') || '').trim();
        } catch {
          searchText = '';
        }
        // Fallback to in-memory context (best-effort)
        if (!searchText) searchText = (currentSearchContext || '').trim();

        // Fetch doctors at render-time to ensure widget always has data
        let preloadedDoctorsData = [];
        try {
          if (searchText) {
            console.log('[MCP resources/read] Fetching doctors for searchText:', searchText);
            const apiResponse = await fetch('https://etapisd.etabeb.com/api/AI/DoctorList', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ searchText }),
            });
            const doctors = await apiResponse.json();
            if (Array.isArray(doctors)) preloadedDoctorsData = doctors;
          }
        } catch (error) {
          console.error('[MCP resources/read] Error fetching doctors:', error);
        }

        const hasPreloaded = preloadedDoctorsData.length > 0;
        console.log('[MCP resources/read] Loading widget with:', { searchText, hasPreloaded, doctorCount: preloadedDoctorsData.length });

        // Inject searchText and preloaded doctors into widget HTML as JSON
        let customWidgetHtml = widgetHtml.replace('{{BOOKING_APP_URL}}', BOOKING_APP_URL);
        const widgetParamsScript = `<script>
          window.WIDGET_PARAMS = { searchText: ${JSON.stringify(searchText)}, preloadedResults: ${hasPreloaded} };
          window.PRELOADED_DOCTORS_DATA = ${JSON.stringify(preloadedDoctorsData)};
          console.log('[RESOURCES/READ] searchText:', window.WIDGET_PARAMS?.searchText);
          console.log('[RESOURCES/READ] preloadedResults:', window.WIDGET_PARAMS?.preloadedResults);
          console.log('[RESOURCES/READ] Injected doctors:', window.PRELOADED_DOCTORS_DATA?.length || 0);
        </script>`;
        customWidgetHtml = customWidgetHtml.replace('</head>', `${widgetParamsScript}</head>`) + `<!-- Cache-bust: ${Date.now()} -->`;

        response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            contents: [
              {
                uri: uri,
                mimeType: 'text/html',
                text: customWidgetHtml,
                _meta: {
                  'openai/widgetDomain': 'mcp.etabeb.sa',
                  'openai/widgetCSP': {
                    resource_domains: [
                      'https://mcp.etabeb.sa',
                      'https://e-tabeb-chat-gpt-p.vercel.app',
                      'https://persistent.oaistatic.com',
                      'https://api4web.etabeb.com',
                    ],
                    connect_domains: [
                      'https://mcp.etabeb.sa',
                      'https://e-tabeb-chat-gpt-p.vercel.app',
                      'https://etapisd.etabeb.com',
                    ],
                    redirect_domains: [
                      'https://e-tabeb-chat-gpt-p.vercel.app',
                    ],
                  },
                },
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
      console.log('🔍 SERVING tools/list from', req.path);
      response = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          tools: [
            {
              name: 'open_booking_widget_v2',
              description: 'Opens an interactive booking widget with available doctors. Use this to show doctor availability and let users book appointments.',
              inputSchema: {
                type: 'object',
                properties: {
                  searchText: {
                    type: 'string',
                    description: 'Doctor specialty, doctor name, or medical condition from user message (e.g., "endocrinology", "Dr. Smith", "diabetes")',
                  },
                },
                required: ['searchText'],
              },
              _meta: {
                'openai/outputTemplate': 'resource://booking-widget?searchText={{searchText}}',
                'openai/resultCanProduceWidget': true,
                'openai/widgetAccessible': true,
                'openai/toolInvocation/invoking': 'Opening booking widget...',
                'openai/toolInvocation/invoked': 'Booking widget ready. Search for doctors and complete your booking.',
                'openai/widgetDomain': 'mcp.etabeb.sa',
                'openai/widgetCSP': {
                  resource_domains: [
                    'https://mcp.etabeb.sa',
                    'https://e-tabeb-chat-gpt-p.vercel.app',
                    'https://persistent.oaistatic.com',
                    'https://api4web.etabeb.com'
                  ],
                  connect_domains: [
                    'https://mcp.etabeb.sa',
                    'https://e-tabeb-chat-gpt-p.vercel.app',
                    'https://etapisd.etabeb.com'
                  ],
                  redirect_domains: [
                    'https://e-tabeb-chat-gpt-p.vercel.app'
                  ]
                },
              },
            },
            {
              name: 'search_doctors',
              description: 'ALWAYS use this FIRST before opening the booking widget. If user mentions a specific doctor name, search with that name immediately. If user mentions specialty, search with that specialty. Ask ONLY: "What specialty?" if not provided. Do NOT ask about city, gender, adult/pediatric, insurance, time, or hospital names. After showing results, ask if they want to proceed with booking.',
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
            {
              name: 'get_search_context',
              description: 'Widget-only tool to retrieve the current search context.',
              inputSchema: {
                type: 'object',
                properties: {},
              },
              _meta: {
                'openai/visibility': 'private',
                'openai/widgetAccessible': true,
              },
            },
            {
              name: 'lookup_specialty',
              description: 'Convert specialty name to specialty ID. Call this before searching doctors if user mentions a specialty.',
              inputSchema: {
                type: 'object',
                properties: {
                  specialtyName: {
                    type: 'string',
                    description: 'Specialty name (e.g., "endocrinology", "dermatology")',
                  },
                },
                required: ['specialtyName'],
              },
              _meta: {
                'openai/visibility': 'private',
              },
            },
            {
              name: 'lookup_facility',
              description: 'Convert facility/hospital name to facility ID. Call this if user mentions a specific hospital.',
              inputSchema: {
                type: 'object',
                properties: {
                  facilityName: {
                    type: 'string',
                    description: 'Facility name (e.g., "Fakeeh", "Soliman Fakeeh Hospital")',
                  },
                },
                required: ['facilityName'],
              },
              _meta: {
                'openai/visibility': 'private',
              },
            },
          ],
        },
      };
    } else if (request.method === 'tools/call') {
      const { name, arguments: args } = request.params;
      console.log('[MCP] tools/call received:', name, args);
      
      if (name === 'open_booking_widget_v2' || name === 'open_booking_widget') {
        try {
          console.log('[MCP] START open_booking_widget_v2 handler');
          // Get parameters from arguments
          const searchText = args?.searchText || args?.specialty || args?.doctorName || '';
          currentSearchContext = searchText;
          
          console.log('[MCP] Opening widget with params:', { searchText });
        
        // Fetch doctor search results to pre-populate widget
        let doctorsHtml = '';
        let doctorCount = 0;
        let doctors = [];
        if (searchText) {
          try {
            // Strip common titles from search text (Dr., Doctor, Prof., etc.)
            const cleanedSearchText = searchText
              .replace(/\b(dr\.?|doctor|prof\.?|professor)\s+/gi, '')
              .trim();
            
            // Use DoctorList API with searchText parameter
            console.log('[MCP] Fetching doctors from DoctorList API with searchText:', cleanedSearchText);
            const apiResponse = await fetch('https://etapisd.etabeb.com/api/AI/DoctorList', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ searchText: cleanedSearchText }),
            });
            doctors = await apiResponse.json();
            
            console.log('[MCP] Received doctors:', doctors?.length || 0);
            
            if (doctors && doctors.length > 0) {
              doctorCount = doctors.length;
              // Generate HTML for doctor results using DoctorList API fields
              doctorsHtml = doctors.map(doctor => `
                <div class="doctor-card" onclick="selectDoctor(${JSON.stringify(doctor).replace(/"/g, '&quot;')})">
                  ${doctor.timeslotCount > 0 ? `<div class="doctor-availability">${doctor.timeslotCount} slots</div>` : ''}
                  <img src="${doctor.picURL01 || 'https://e-tabeb-chat-gpt-p.vercel.app/etabeb-logo.png'}" alt="${doctor.doctorName}" onerror="this.src='https://e-tabeb-chat-gpt-p.vercel.app/etabeb-logo.png'">
                  <div class="doctor-info">
                    <div class="doctor-name">${doctor.doctorName}</div>
                    <div class="doctor-specialty">${doctor.medicalSpecialityText}</div>
                    <div class="doctor-facility">📍 ${doctor.medicalFacilityName}</div>
                    <div class="doctor-meta">
                      <span class="doctor-rating">⭐ ${doctor.ratingAvg || doctor.ratingText || 'New'}</span>
                      <span class="doctor-price">${doctor.priceRateMin || '0'} ${doctor.currencyCode}</span>
                    </div>
                  </div>
                </div>
              `).join('');
              console.log('[MCP] Generated HTML for', doctorCount, 'doctors');
            } else {
              console.log('[MCP] No doctors found for searchText:', searchText);
            }
          } catch (error) {
            console.error('[MCP] Error fetching doctors:', error);
          }
        }
        
        console.log('[MCP] About to inject doctors into widget HTML, count:', doctorCount);
        
        // Do not store preloaded doctors in memory; only update search context
        currentSearchContext = searchText;

        // Return simple text response - outputTemplate will handle opening the widget
        response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [
              {
                type: 'text',
                text: `Opening booking widget with ${doctorCount} available ${searchText} doctors...`
              }
            ],
            isError: false,
          },
        };
        } catch (error) {
          console.error('[MCP] FATAL ERROR in open_booking_widget_v2:', error);
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{ type: 'text', text: `Error: ${error.message}` }],
              isError: true,
            },
          };
        }
      } else if (name === 'lookup_specialty') {
        // Lookup specialty ID from name
        const specialtyName = args?.specialtyName || '';
        try {
          const apiResponse = await fetch('https://etapisd.etabeb.com/api/AI/SpecialitiesList', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          const specialties = await apiResponse.json();
          
          // Find matching specialty (case-insensitive, partial match)
          const match = specialties.find(s => 
            s.text.toLowerCase().includes(specialtyName.toLowerCase()) ||
            s.text1.toLowerCase().includes(specialtyName.toLowerCase())
          );
          
          if (match) {
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({ 
                      specialtyId: match.value,
                      specialtyCode: match.code,
                      specialtyName: match.text,
                      specialtyNameArabic: match.text1
                    }),
                  },
                ],
                isError: false,
              },
            };
          } else {
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({ error: 'Specialty not found', searchTerm: specialtyName }),
                  },
                ],
                isError: false,
              },
            };
          }
        } catch (error) {
          console.error('[MCP] Error looking up specialty:', error);
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ error: 'Failed to lookup specialty' }),
                },
              ],
              isError: false,
            },
          };
        }
      } else if (name === 'lookup_facility') {
        // Lookup facility ID from name
        const facilityName = args?.facilityName || '';
        try {
          const apiResponse = await fetch('https://etapisd.etabeb.com/api/AI/HospitalList', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          const facilities = await apiResponse.json();
          
          // Find matching facility (case-insensitive, partial match)
          const match = facilities.find(f => 
            f.text.toLowerCase().includes(facilityName.toLowerCase()) ||
            f.text1.toLowerCase().includes(facilityName.toLowerCase())
          );
          
          if (match) {
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({ 
                      facilityId: match.value,
                      facilityCode: match.code,
                      facilityName: match.text,
                      facilityNameArabic: match.text1
                    }),
                  },
                ],
                isError: false,
              },
            };
          } else {
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({ error: 'Facility not found', searchTerm: facilityName }),
                  },
                ],
                isError: false,
              },
            };
          }
        } catch (error) {
          console.error('[MCP] Error looking up facility:', error);
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ error: 'Failed to lookup facility' }),
                },
              ],
              isError: false,
            },
          };
        }
      } else if (name === 'get_search_context') {
        // Return the current search context for the widget
        response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ searchText: currentSearchContext }),
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
                `${i + 1}. **${d.name}** - ${d.specialty}\n   📍 ${d.facility}\n   ⭐ ${d.rating} | 💰 ${d.price} ${d.currency}`
              ).join('\n\n');
              
              response = {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                  content: [
                    {
                      type: 'text',
                      text: `I found ${doctors.length} doctors matching "${searchText}":\n\n${doctorList}\n\nWould you like to proceed with booking an appointment? I can open the booking system for you to select a time slot.`,
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
            name: 'eTabeb',
            version: '2.0.0',
            icon: `${BASE_URL}/etabeb-logo.png`,
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
    name: 'eTabeb',
    version: '2.0.0',
    description: 'Medical appointment booking with eTabeb (cache-busted)',
    icon: `${BASE_URL}/etabeb-logo.png`,
  });
});

// Serve the logo
app.get('/etabeb-logo.png', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'etabeb-logo.png'));
});

app.listen(PORT, () => {
  console.log(`🚀 eTabeb ChatGPT App running on port ${PORT}`);
  console.log(`📍 MCP endpoint: ${BASE_URL}/mcp`);
  console.log(`📍 MCP v2 endpoint (cache-busted): ${BASE_URL}/mcp-v2`);
  console.log(`🎨 App icon: ${BASE_URL}/etabeb-logo.png`);
});
