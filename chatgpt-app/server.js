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

// Levenshtein distance for fuzzy string matching
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
  
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1].toLowerCase() === str2[j - 1].toLowerCase() ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  return matrix[len1][len2];
}

function similarityScore(str1, str2) {
  const distance = levenshteinDistance(str1, str2);
  const maxLen = Math.max(str1.length, str2.length);
  return maxLen === 0 ? 1 : 1 - (distance / maxLen);
}


app.use(express.json());
// Disable caching for static files to ensure latest widget loads
app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

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

// Store search context and doctor data in memory (session-based)
let currentSearchContext = '';
const sessionData = new Map(); // Map<sessionId, {searchText, doctors, language}>

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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'eTabeb Medical Booking Assistant',
    version: '1.0.0',
    status: 'online',
    mcp_endpoint: '/mcp-v2',
    manifest: '/.well-known/mcp-manifest.json'
  });
});

// MCP Manifest endpoint for ChatGPT discovery
app.get('/.well-known/mcp-manifest.json', (req, res) => {
  console.log('📋 Serving MCP manifest');
  try {
    const manifest = JSON.parse(fs.readFileSync('./mcp-manifest.json', 'utf8'));
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(manifest);
  } catch (error) {
    console.error('Error serving MCP manifest:', error);
    res.status(500).json({ error: 'Failed to load manifest' });
  }
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
        // Get session data if available
        const sessionId = request.params?._meta?.['openai/session'] || 'default';
        const session = sessionData.get(sessionId);
        
        let searchText = '';
        let preloadedDoctorsData = [];
        let language = 'en';
        
        console.log('[MCP resources/read] Session ID:', sessionId);
        console.log('[MCP resources/read] Available sessions:', Array.from(sessionData.keys()));
        
        if (session) {
          console.log('[MCP resources/read] ✅ Found session data');
          searchText = session.searchText;
          preloadedDoctorsData = session.doctors || [];
          language = session.language;
          console.log('[MCP resources/read] Session doctors:', preloadedDoctorsData.length);
        } else {
          console.log('[MCP resources/read] ❌ No session found, using currentSearchContext');
          // Fallback: try URL parameter or currentSearchContext
          searchText = (currentSearchContext || '').trim();
          
          if (!searchText) {
            try {
              const parsed = new URL(uri.replace('resource://', 'https://resource.local/'));
              searchText = (parsed.searchParams.get('searchText') || '').trim();
            } catch {
              searchText = '';
            }
          }
        }

        // Fetch doctors only if not already loaded from session
        if (preloadedDoctorsData.length === 0) {
          try {
            if (searchText) {
              console.log('[MCP resources/read] Fetching doctors for searchText:', searchText);
              const apiResponse = await fetch('https://etapisd.etabeb.com/api/AI/DoctorList', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ searchText }),
            });
            let doctors = await apiResponse.json();
            if (Array.isArray(doctors)) {
              // Deduplicate doctors by DoctorId and merge facilities/specialties
              const doctorMap = new Map();
              doctors.forEach(doctor => {
                const doctorId = doctor.doctorId;
                if (!doctorMap.has(doctorId)) {
                  // First occurrence - initialize with arrays for facilities and specialties
                  doctorMap.set(doctorId, {
                    ...doctor,
                    facilities: [{
                      facilityId: doctor.medicalFacilityId,
                      facilityName: doctor.medicalFacilityName,
                      specialties: [{
                        specialtyId: doctor.medicalSpecialityId,
                        specialtyText: doctor.medicalSpecialityText,
                        rtId: doctor.medicalFacilityDoctorSpecialityRTId,
                        timeslotCount: doctor.timeslotCount || 0
                      }]
                    }]
                  });
                } else {
                  // Duplicate doctor - merge facility and specialty
                  const existingDoctor = doctorMap.get(doctorId);
                  const facilityIndex = existingDoctor.facilities.findIndex(
                    f => f.facilityId === doctor.medicalFacilityId
                  );
                  
                  if (facilityIndex === -1) {
                    // New facility for this doctor
                    existingDoctor.facilities.push({
                      facilityId: doctor.medicalFacilityId,
                      facilityName: doctor.medicalFacilityName,
                      specialties: [{
                        specialtyId: doctor.medicalSpecialityId,
                        specialtyText: doctor.medicalSpecialityText,
                        rtId: doctor.medicalFacilityDoctorSpecialityRTId,
                        timeslotCount: doctor.timeslotCount || 0
                      }]
                    });
                  } else {
                    // Existing facility - check if specialty is new
                    const facility = existingDoctor.facilities[facilityIndex];
                    const specialtyExists = facility.specialties.some(
                      s => s.specialtyId === doctor.medicalSpecialityId
                    );
                    if (!specialtyExists) {
                      facility.specialties.push({
                        specialtyId: doctor.medicalSpecialityId,
                        specialtyText: doctor.medicalSpecialityText,
                        rtId: doctor.medicalFacilityDoctorSpecialityRTId,
                        timeslotCount: doctor.timeslotCount || 0
                      });
                    }
                  }
                }
              });
              
              preloadedDoctorsData = Array.from(doctorMap.values());
              console.log('[MCP resources/read] Deduplicated doctors:', preloadedDoctorsData.length, 'unique doctors');
            }
          }
          } catch (error) {
            console.error('[MCP resources/read] Error fetching doctors:', error);
          }
        }

        const hasPreloaded = preloadedDoctorsData.length > 0;
        console.log('[MCP resources/read] Loading widget with:', { searchText, hasPreloaded, doctorCount: preloadedDoctorsData.length });

        // Detect language if not already set from session
        if (!language || language === 'en') {
          const isArabic = /[\u0600-\u06FF]/.test(searchText);
          language = isArabic ? 'ar' : 'en';
        }
        
        // Inject searchText, language, and preloaded doctors into widget HTML as JSON
        let customWidgetHtml = widgetHtml.replace('{{BOOKING_APP_URL}}', BOOKING_APP_URL);
        const widgetParamsScript = `<script>
          window.WIDGET_PARAMS = { 
            searchText: ${JSON.stringify(searchText)}, 
            preloadedResults: ${hasPreloaded},
            lang: ${JSON.stringify(language)}
          };
          window.PRELOADED_DOCTORS_DATA = ${JSON.stringify(preloadedDoctorsData)};
          console.log('[RESOURCES/READ] searchText:', window.WIDGET_PARAMS?.searchText);
          console.log('[RESOURCES/READ] lang:', window.WIDGET_PARAMS?.lang);
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
                    description: 'IMPORTANT: Extract ONLY the doctor name, specialty, or condition WITHOUT any titles or prefixes. Remove titles like: Dr., Doctor, Prof., Professor, استشاري, دكتور, دكتورة, طبيب, بروفيسور. Examples: "خالد فاروقي" NOT "دكتور خالد فاروقي", "Smith" NOT "Dr. Smith", "جراحة قلب" NOT "استشاري جراحة قلب"',
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
            // Clean search text by removing common words
            console.log('[MCP] ===== WIDGET SEARCH TEXT CLEANING =====');
            console.log('[MCP] Original searchText:', searchText);
            
            // First, remove only common words (keep titles for now)
            let searchWithCommonWordsRemoved = searchText
              .replace(/\b(appointment|appointments|book|booking|need|want|looking for|find|search|show me|with)\s+/gi, '')
              .replace(/(موعد|مواعيد|احجز|حجز|ابحث|بحث|اريد|ابي|عند|مع)\s+/g, '')
              .replace(/\s+(موعد|مواعيد|احجز|حجز|ابحث|بحث|اريد|ابي|عند|مع)/g, '')
              .trim();
            
            // Also prepare a version with titles removed
            let searchWithTitlesRemoved = searchWithCommonWordsRemoved
              .replace(/\b(dr\.?|doctor|prof\.?|professor)\s+/gi, '')
              // Remove Arabic titles with definite article (الدكتور، الطبيب، etc.)
              .replace(/(ال)?(طبيب|دكتور|دكتورة|استشاري|بروفيسور)\s+/g, '')
              .replace(/\s+(ال)?(طبيب|دكتور|دكتورة|استشاري|بروفيسور)/g, '')
              .replace(/\s+(doctor|doctors)$/gi, '')
              .trim();
            
            console.log('[MCP] Search with common words removed:', searchWithCommonWordsRemoved);
            console.log('[MCP] Search with titles also removed:', searchWithTitlesRemoved);
            
            // Try first search with titles kept (for name searches)
            console.log('[MCP] Fetching doctors (attempt 1 - with titles):', searchWithCommonWordsRemoved);
            let apiResponse = await fetch('https://etapisd.etabeb.com/api/AI/DoctorList', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ searchText: searchWithCommonWordsRemoved }),
            });
            doctors = await apiResponse.json();
            
            // If no results and the two search terms are different, try without titles
            if ((!doctors || doctors.length === 0) && searchWithCommonWordsRemoved !== searchWithTitlesRemoved) {
              console.log('[MCP] No results with titles, trying without titles:', searchWithTitlesRemoved);
              apiResponse = await fetch('https://etapisd.etabeb.com/api/AI/DoctorList', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ searchText: searchWithTitlesRemoved }),
              });
              doctors = await apiResponse.json();
              
              // Update context to the version that worked
              if (doctors && doctors.length > 0) {
                currentSearchContext = searchWithTitlesRemoved;
              }
            } else {
              currentSearchContext = searchWithCommonWordsRemoved;
            }
            
            console.log('[MCP] ===== END WIDGET CLEANING =====');
            
            console.log('[MCP] Received doctors:', doctors?.length || 0);
            
            // Deduplicate doctors by DoctorId and merge facilities/specialties
            if (doctors && doctors.length > 0) {
              console.log('[MCP] Deduplicating doctors by DoctorId...');
              const doctorMap = new Map();
              doctors.forEach(doctor => {
                const doctorId = doctor.doctorId;
                if (!doctorMap.has(doctorId)) {
                  doctorMap.set(doctorId, {
                    ...doctor,
                    facilities: [{
                      facilityId: doctor.medicalFacilityId,
                      facilityName: doctor.medicalFacilityName,
                      specialties: [{
                        specialtyId: doctor.medicalSpecialityId,
                        specialtyText: doctor.medicalSpecialityText,
                        rtId: doctor.medicalFacilityDoctorSpecialityRTId,
                        timeslotCount: doctor.timeslotCount || 0
                      }]
                    }]
                  });
                } else {
                  const existingDoctor = doctorMap.get(doctorId);
                  const facilityIndex = existingDoctor.facilities.findIndex(
                    f => f.facilityId === doctor.medicalFacilityId
                  );

                  if (facilityIndex === -1) {
                    existingDoctor.facilities.push({
                      facilityId: doctor.medicalFacilityId,
                      facilityName: doctor.medicalFacilityName,
                      specialties: [{
                        specialtyId: doctor.medicalSpecialityId,
                        specialtyText: doctor.medicalSpecialityText,
                        rtId: doctor.medicalFacilityDoctorSpecialityRTId,
                        timeslotCount: doctor.timeslotCount || 0
                      }]
                    });
                  } else {
                    const facility = existingDoctor.facilities[facilityIndex];
                    const specialtyExists = facility.specialties.some(
                      s => s.specialtyId === doctor.medicalSpecialityId
                    );
                    if (!specialtyExists) {
                      facility.specialties.push({
                        specialtyId: doctor.medicalSpecialityId,
                        specialtyText: doctor.medicalSpecialityText,
                        rtId: doctor.medicalFacilityDoctorSpecialityRTId,
                        timeslotCount: doctor.timeslotCount || 0
                      });
                    }
                  }
                }
              });
              doctors = Array.from(doctorMap.values());
              console.log('[MCP] Deduplicated doctors:', doctors.length, 'unique doctors');
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
        
        // Detect language based on searchText (Arabic vs English)
        const isArabic = /[\u0600-\u06FF]/.test(currentSearchContext);
        const language = isArabic ? 'ar' : 'en';
        console.log('[MCP] Detected language:', language);
        
        // Store session data for resources/read to use later
        const sessionId = request.params?._meta?.['openai/session'] || 'default';
        sessionData.set(sessionId, {
          searchText: currentSearchContext,
          doctors: doctors,
          language: language
        });
        console.log('[MCP] Stored session data for session:', sessionId);
        
        console.log('[MCP] About to inject doctors into widget HTML, count:', doctorCount);
        console.log('[MCP] currentSearchContext is set to:', currentSearchContext);
        
        // currentSearchContext was already set in the cleaning logic above to the successful search term
        // Return response with widget metadata to trigger resource load
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
            _meta: {
              'openai/outputTemplate': `resource://booking-widget?searchText=${encodeURIComponent(currentSearchContext)}`
            }
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
          // Clean search text by removing common words and extracting the specialty/key term
          console.log('[MCP] ===== SEARCH TEXT CLEANING =====');
          console.log('[MCP] Original searchText:', searchText);
          console.log('[MCP] Original length:', searchText.length);
          console.log('[MCP] Original bytes:', Buffer.from(searchText).toString('hex'));
          
          let cleanedSearchText = searchText
            // Remove English titles (Dr., Doctor, Prof., etc.)
            .replace(/\b(dr\.?|doctor|prof\.?|professor)\s+/gi, '')
            // Remove Arabic doctor words (prefix position: "طبيب اسنان")
            .replace(/(طبيب|دكتور|دكتورة|استشاري|بروفيسور)\s+/g, '')
            // Remove Arabic doctor words (suffix position: "اسنان طبيب")
            .replace(/\s+(طبيب|دكتور|دكتورة|استشاري|بروفيسور)/g, '')
            // Remove English common words
            .replace(/\b(appointment|appointments|book|booking|need|want|looking for|find|search|show me)\s+/gi, '')
            // Remove Arabic common words
            .replace(/(موعد|مواعيد|احجز|حجز|ابحث|بحث|اريد|ابي|عند)\s+/g, '')
            .replace(/\s+(موعد|مواعيد|احجز|حجز|ابحث|بحث|اريد|ابي|عند)/g, '')
            // Remove trailing "doctor" in English
            .replace(/\s+(doctor|doctors)$/gi, '')
            .trim();
          
          console.log('[MCP] Cleaned searchText:', cleanedSearchText);
          console.log('[MCP] Cleaned length:', cleanedSearchText.length);
          console.log('[MCP] Cleaned bytes:', Buffer.from(cleanedSearchText).toString('hex'));
          console.log('[MCP] ===== END CLEANING =====');
          
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
        // Get session data if available
        const sessionId = request.params?._meta?.['openai/session'] || 'default';
        const session = sessionData.get(sessionId);
        
        let searchText = '';
        let preloadedDoctorsData = [];
        let language = 'en';
        
        if (session) {
          console.log('[MCP resources/read] Found session data for:', sessionId);
          searchText = session.searchText;
          preloadedDoctorsData = session.doctors;
          language = session.language;
        } else {
          // Fallback: try URL parameter or currentSearchContext
          searchText = (currentSearchContext || '').trim();
          
          if (!searchText) {
            try {
              const parsed = new URL(uri.replace('resource://', 'https://resource.local/'));
              searchText = (parsed.searchParams.get('searchText') || '').trim();
            } catch {
              searchText = '';
            }
          }
        }

        // Fetch doctors only if not already loaded from session
        if (preloadedDoctorsData.length === 0) {
          try {
            if (searchText) {
              console.log('[MCP resources/read] Fetching doctors for searchText:', searchText);
              const apiResponse = await fetch('https://etapisd.etabeb.com/api/AI/DoctorList', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ searchText }),
            });
            let doctors = await apiResponse.json();
            if (Array.isArray(doctors)) {
              // Deduplicate doctors by DoctorId and merge facilities/specialties
              const doctorMap = new Map();
              doctors.forEach(doctor => {
                const doctorId = doctor.doctorId;
                if (!doctorMap.has(doctorId)) {
                  // First occurrence - initialize with arrays for facilities and specialties
                  doctorMap.set(doctorId, {
                    ...doctor,
                    facilities: [{
                      facilityId: doctor.medicalFacilityId,
                      facilityName: doctor.medicalFacilityName,
                      specialties: [{
                        specialtyId: doctor.medicalSpecialityId,
                        specialtyText: doctor.medicalSpecialityText,
                        rtId: doctor.medicalFacilityDoctorSpecialityRTId,
                        timeslotCount: doctor.timeslotCount || 0
                      }]
                    }]
                  });
                } else {
                  // Duplicate doctor - merge facility and specialty
                  const existingDoctor = doctorMap.get(doctorId);
                  const facilityIndex = existingDoctor.facilities.findIndex(
                    f => f.facilityId === doctor.medicalFacilityId
                  );
                  
                  if (facilityIndex === -1) {
                    // New facility for this doctor
                    existingDoctor.facilities.push({
                      facilityId: doctor.medicalFacilityId,
                      facilityName: doctor.medicalFacilityName,
                      specialties: [{
                        specialtyId: doctor.medicalSpecialityId,
                        specialtyText: doctor.medicalSpecialityText,
                        rtId: doctor.medicalFacilityDoctorSpecialityRTId,
                        timeslotCount: doctor.timeslotCount || 0
                      }]
                    });
                  } else {
                    // Existing facility - check if specialty is new
                    const facility = existingDoctor.facilities[facilityIndex];
                    const specialtyExists = facility.specialties.some(
                      s => s.specialtyId === doctor.medicalSpecialityId
                    );
                    if (!specialtyExists) {
                      facility.specialties.push({
                        specialtyId: doctor.medicalSpecialityId,
                        specialtyText: doctor.medicalSpecialityText,
                        rtId: doctor.medicalFacilityDoctorSpecialityRTId,
                        timeslotCount: doctor.timeslotCount || 0
                      });
                    }
                  }
                }
              });
              
              preloadedDoctorsData = Array.from(doctorMap.values());
              console.log('[MCP resources/read] Deduplicated doctors:', preloadedDoctorsData.length, 'unique doctors');
            }
          }
          } catch (error) {
            console.error('[MCP resources/read] Error fetching doctors:', error);
          }
        }

        const hasPreloaded = preloadedDoctorsData.length > 0;
        console.log('[MCP resources/read] Loading widget with:', { searchText, hasPreloaded, doctorCount: preloadedDoctorsData.length });

        // Detect language if not already set from session
        if (!language || language === 'en') {
          const isArabic = /[\u0600-\u06FF]/.test(searchText);
          language = isArabic ? 'ar' : 'en';
        }
        
        // Inject searchText, language, and preloaded doctors into widget HTML as JSON
        let customWidgetHtml = widgetHtml.replace('{{BOOKING_APP_URL}}', BOOKING_APP_URL);
        const widgetParamsScript = `<script>
          window.WIDGET_PARAMS = { 
            searchText: ${JSON.stringify(searchText)}, 
            preloadedResults: ${hasPreloaded},
            lang: ${JSON.stringify(language)}
          };
          window.PRELOADED_DOCTORS_DATA = ${JSON.stringify(preloadedDoctorsData)};
          console.log('[RESOURCES/READ] searchText:', window.WIDGET_PARAMS?.searchText);
          console.log('[RESOURCES/READ] lang:', window.WIDGET_PARAMS?.lang);
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
                    description: 'IMPORTANT: Extract ONLY the doctor name, specialty, or condition WITHOUT any titles or prefixes. Remove titles like: Dr., Doctor, Prof., Professor, استشاري, دكتور, دكتورة, طبيب, بروفيسور. Examples: "خالد فاروقي" NOT "دكتور خالد فاروقي", "Smith" NOT "Dr. Smith", "جراحة قلب" NOT "استشاري جراحة قلب"',
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
            // Clean search text by removing common words
            console.log('[MCP] ===== WIDGET SEARCH TEXT CLEANING =====');
            console.log('[MCP] Original searchText:', searchText);
            
            // First, remove only common words (keep titles for now)
            let searchWithCommonWordsRemoved = searchText
              .replace(/\b(appointment|appointments|book|booking|need|want|looking for|find|search|show me|with)\s+/gi, '')
              .replace(/(موعد|مواعيد|احجز|حجز|ابحث|بحث|اريد|ابي|عند|مع)\s+/g, '')
              .replace(/\s+(موعد|مواعيد|احجز|حجز|ابحث|بحث|اريد|ابي|عند|مع)/g, '')
              .trim();
            
            // Also prepare a version with titles removed
            let searchWithTitlesRemoved = searchWithCommonWordsRemoved
              .replace(/\b(dr\.?|doctor|prof\.?|professor)\s+/gi, '')
              // Remove Arabic titles with definite article (الدكتور، الطبيب، etc.)
              .replace(/(ال)?(طبيب|دكتور|دكتورة|استشاري|بروفيسور)\s+/g, '')
              .replace(/\s+(ال)?(طبيب|دكتور|دكتورة|استشاري|بروفيسور)/g, '')
              .replace(/\s+(doctor|doctors)$/gi, '')
              .trim();
            
            console.log('[MCP] Search with common words removed:', searchWithCommonWordsRemoved);
            console.log('[MCP] Search with titles also removed:', searchWithTitlesRemoved);
            
            // Try first search with titles kept (for name searches)
            console.log('[MCP] Fetching doctors (attempt 1 - with titles):', searchWithCommonWordsRemoved);
            let apiResponse = await fetch('https://etapisd.etabeb.com/api/AI/DoctorList', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ searchText: searchWithCommonWordsRemoved }),
            });
            doctors = await apiResponse.json();
            
            // If no results and the two search terms are different, try without titles
            if ((!doctors || doctors.length === 0) && searchWithCommonWordsRemoved !== searchWithTitlesRemoved) {
              console.log('[MCP] No results with titles, trying without titles:', searchWithTitlesRemoved);
              apiResponse = await fetch('https://etapisd.etabeb.com/api/AI/DoctorList', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ searchText: searchWithTitlesRemoved }),
              });
              doctors = await apiResponse.json();
              
              // Update context to the version that worked
              if (doctors && doctors.length > 0) {
                currentSearchContext = searchWithTitlesRemoved;
              }
            } else {
              currentSearchContext = searchWithCommonWordsRemoved;
            }
            
            console.log('[MCP] ===== END WIDGET CLEANING =====');
            
            console.log('[MCP] Received doctors:', doctors?.length || 0);

            // If no results and search looks like a name (has space), try fuzzy matching
            if ((!doctors || doctors.length === 0) && searchWithCommonWordsRemoved.includes(' ')) {
              console.log('[MCP] No exact matches, trying fuzzy name matching...');
              
              const allDoctorsResponse = await fetch('https://etapisd.etabeb.com/api/AI/DoctorList', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ searchText: '' }),
              });
              const allDoctors = await allDoctorsResponse.json();
              
              if (allDoctors && allDoctors.length > 0) {
                console.log('[MCP] Searching through', allDoctors.length, 'doctors for fuzzy matches');
                
                const searchLower = searchWithCommonWordsRemoved.toLowerCase();
                const searchWords = searchLower.split(' ').filter(w => w.length > 2);
                
                const matches = allDoctors.map(doctor => {
                  const doctorNameEn = (doctor.doctorName || '').toLowerCase();
                  const doctorNameAr = (doctor.doctorNameOTE || '').toLowerCase();
                  
                  let scoreEn = similarityScore(searchLower, doctorNameEn);
                  let scoreAr = similarityScore(searchLower, doctorNameAr);
                  
                  // Word-by-word matching with first name priority for ENGLISH
                  const doctorWordsEn = doctorNameEn.split(' ');
                  let maxWordScoreEn = 0;
                  let firstNameScoreEn = 0;
                  
                  for (let i = 0; i < searchWords.length; i++) {
                    for (let j = 0; j < doctorWordsEn.length; j++) {
                      const wordScore = similarityScore(searchWords[i], doctorWordsEn[j]);
                      maxWordScoreEn = Math.max(maxWordScoreEn, wordScore);
                      
                      // Boost score if first search word matches first doctor word
                      if (i === 0 && j === 0 && wordScore > 0.7) {
                        firstNameScoreEn = wordScore * 1.2; // 20% bonus for first name match
                      }
                    }
                  }
                  
                  // Word-by-word matching with first name priority for ARABIC
                  const doctorWordsAr = doctorNameAr.split(' ');
                  let maxWordScoreAr = 0;
                  let firstNameScoreAr = 0;
                  
                  for (let i = 0; i < searchWords.length; i++) {
                    for (let j = 0; j < doctorWordsAr.length; j++) {
                      const wordScore = similarityScore(searchWords[i], doctorWordsAr[j]);
                      maxWordScoreAr = Math.max(maxWordScoreAr, wordScore);
                      
                      // Boost score if first search word matches first doctor word
                      if (i === 0 && j === 0 && wordScore > 0.7) {
                        firstNameScoreAr = wordScore * 1.2; // 20% bonus for first name match
                      }
                    }
                  }
                  
                  const score = Math.max(scoreEn, scoreAr, maxWordScoreEn, maxWordScoreAr, firstNameScoreEn, firstNameScoreAr);
                  return { doctor, score, matchedName: scoreEn > scoreAr ? doctorNameEn : doctorNameAr };
                })
                .filter(m => m.score > 0.7)
                .sort((a, b) => b.score - a.score)
                .slice(0, 30);
                
                if (matches.length > 0) {
                  console.log('[MCP] Found', matches.length, 'fuzzy matches');
                  console.log('[MCP] Best match:', matches[0].matchedName, 'with score:', matches[0].score.toFixed(2));
                  doctors = matches.map(m => m.doctor);
                } else {
                  console.log('[MCP] No fuzzy matches found with >70% similarity');
                }
              }
            }

            
            // Deduplicate doctors by DoctorId and merge facilities/specialties
            if (doctors && doctors.length > 0) {
              console.log('[MCP] Deduplicating doctors by DoctorId...');
              const doctorMap = new Map();
              doctors.forEach(doctor => {
                const doctorId = doctor.doctorId;
                if (!doctorMap.has(doctorId)) {
                  doctorMap.set(doctorId, {
                    ...doctor,
                    facilities: [{
                      facilityId: doctor.medicalFacilityId,
                      facilityName: doctor.medicalFacilityName,
                      specialties: [{
                        specialtyId: doctor.medicalSpecialityId,
                        specialtyText: doctor.medicalSpecialityText,
                        rtId: doctor.medicalFacilityDoctorSpecialityRTId,
                        timeslotCount: doctor.timeslotCount || 0
                      }]
                    }]
                  });
                } else {
                  const existingDoctor = doctorMap.get(doctorId);
                  const facilityIndex = existingDoctor.facilities.findIndex(
                    f => f.facilityId === doctor.medicalFacilityId
                  );

                  if (facilityIndex === -1) {
                    existingDoctor.facilities.push({
                      facilityId: doctor.medicalFacilityId,
                      facilityName: doctor.medicalFacilityName,
                      specialties: [{
                        specialtyId: doctor.medicalSpecialityId,
                        specialtyText: doctor.medicalSpecialityText,
                        rtId: doctor.medicalFacilityDoctorSpecialityRTId,
                        timeslotCount: doctor.timeslotCount || 0
                      }]
                    });
                  } else {
                    const facility = existingDoctor.facilities[facilityIndex];
                    const specialtyExists = facility.specialties.some(
                      s => s.specialtyId === doctor.medicalSpecialityId
                    );
                    if (!specialtyExists) {
                      facility.specialties.push({
                        specialtyId: doctor.medicalSpecialityId,
                        specialtyText: doctor.medicalSpecialityText,
                        rtId: doctor.medicalFacilityDoctorSpecialityRTId,
                        timeslotCount: doctor.timeslotCount || 0
                      });
                    }
                  }
                }
              });
              doctors = Array.from(doctorMap.values());
              console.log('[MCP] Deduplicated doctors:', doctors.length, 'unique doctors');
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
        
        // Detect language based on searchText (Arabic vs English)
        const isArabic = /[\u0600-\u06FF]/.test(currentSearchContext);
        const language = isArabic ? 'ar' : 'en';
        console.log('[MCP] Detected language:', language);
        
        // Store session data for resources/read to use later
        const sessionId = request.params?._meta?.['openai/session'] || 'default';
        sessionData.set(sessionId, {
          searchText: currentSearchContext,
          doctors: doctors,
          language: language
        });
        console.log('[MCP] Stored session data for session:', sessionId);
        
        console.log('[MCP] About to inject doctors into widget HTML, count:', doctorCount);
        console.log('[MCP] currentSearchContext is set to:', currentSearchContext);
        
        // currentSearchContext was already set in the cleaning logic above to the successful search term
        // Return response with widget metadata to trigger resource load
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
            _meta: {
              'openai/outputTemplate': `resource://booking-widget?searchText=${encodeURIComponent(currentSearchContext)}`
            }
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
        // Return the current search context from session
        const sessionId = request.params?._meta?.['openai/session'] || 'default';
        const session = sessionData.get(sessionId);
        const searchText = session?.searchText || currentSearchContext || '';
        console.log('[MCP] get_search_context called, returning:', searchText, 'from session:', sessionId);
        response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ searchText }),
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
            // Clean search text by removing common words and extracting the specialty/key term
            let cleanedSearchText = searchText
              // Remove English titles (Dr., Doctor, Prof., etc.)
              .replace(/\b(dr\.?|doctor|prof\.?|professor)\s+/gi, '')
              // Remove Arabic titles and words (طبيب = doctor, دكتور = doctor, etc.)
              .replace(/(طبيب|دكتور|دكتورة|استشاري|بروفيسور)\s+/g, '')
              // Remove English common words (appointment, book, need, want, etc.)
              .replace(/\b(appointment|appointments|book|booking|need|want|looking for|find|search|show me)\s+/gi, '')
              // Remove Arabic common words (موعد = appointment, احجز = book, etc.)
              .replace(/(موعد|مواعيد|احجز|حجز|ابحث|بحث|اريد|ابي|عند)\s+/g, '')
              // Remove trailing "doctor" or "doctors" in English
              .replace(/\s+(doctor|doctors)$/gi, '')
              // Remove trailing Arabic doctor words
              .replace(/\s+(طبيب|دكتور|دكتورة)$/g, '')
              .trim();
            
            console.log('[MCP] Original searchText:', searchText);
            console.log('[MCP] Cleaned searchText:', cleanedSearchText);
            
            const apiResponse = await fetch(`${BOOKING_APP_URL}/api/doctors`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ SearchText: cleanedSearchText, CityId: 1, limit }),
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
