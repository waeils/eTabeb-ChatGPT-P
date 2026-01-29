import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

// Widget definitions
const appointmentWidget = {
  id: "book_appointment",
  title: "Book Medical Appointment",
  templateUri: "resource://appointment-widget",
  invoking: "Opening eTabeb booking system...",
  invoked: "Booking system ready. You can now browse doctors and book appointments.",
};

const handler = createMcpHandler(async (server) => {
  // Register the appointment widget resource
  server.registerResource(
    appointmentWidget.templateUri,
    "Widget for medical appointment booking", // Added missing description argument
    {
      name: "eTabeb Appointment Widget",
      mimeType: "text/html",
    },
    async () => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      return {
        contents: [
          {
            uri: appointmentWidget.templateUri,
            mimeType: "text/html",
            text: `${baseUrl}/appointments`,
          },
        ],
      };
    }
  );

  // Helper function for widget metadata
  const widgetMeta = (widget: typeof appointmentWidget) => ({
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": false,
    "openai/resultCanProduceWidget": true,
  });

  // ========================================
  // Tool 1: Book Appointment (Main Entry)
  // ========================================
  server.registerTool(
    appointmentWidget.id,
    {
      title: "Book Medical Appointment",
      description: `Book a medical appointment with eTabeb. Use this when the user wants to:
      - Book a doctor appointment
      - See available doctors
      - Find a specialist (cardiologist, dermatologist, etc.)
      - Schedule a medical consultation
      - Book for specific date or time
      - Find doctors in a specific location/hospital
      
      This opens an interactive widget where users can browse doctors, view available times, and complete booking securely.`,
      inputSchema: {
        specialty: z.string().optional().describe("Medical specialty requested (e.g., Cardiologist, Dermatologist, Pediatrician, General Practitioner). Leave empty if user wants to browse all doctors."),
        location: z.string().optional().describe("City, area, or hospital name preference (e.g., Riyadh, King Fahad Hospital)"),
        preferredDate: z.string().optional().describe("Preferred appointment date in natural language (e.g., 'tomorrow', 'next week', 'January 30')"),
        urgency: z.string().optional().describe("Urgency level: 'urgent' for same-day/next-day, 'routine' for flexible scheduling"),
        doctorName: z.string().optional().describe("Specific doctor name if user mentions one"),
      },
      _meta: widgetMeta(appointmentWidget),
    },
    async ({ specialty, location, preferredDate, urgency, doctorName }) => {
      let message = "I'll help you book a medical appointment with eTabeb. ";

      if (specialty) {
        message += `Looking for ${specialty} specialists`;
      } else if (doctorName) {
        message += `Searching for Dr. ${doctorName}`;
      } else {
        message += "Browsing available doctors";
      }

      if (location) {
        message += ` in ${location}`;
      }

      if (preferredDate) {
        message += ` for ${preferredDate}`;
      }

      if (urgency === 'urgent') {
        message += ". I'll prioritize the earliest available appointments";
      }

      message += ".\n\nOpening the eTabeb booking system where you can:\n";
      message += "• Browse available doctors and specialists\n";
      message += "• View doctor profiles, ratings, and prices\n";
      message += "• See real-time available time slots\n";
      message += "• Select your preferred doctor and time\n";
      message += "• Complete secure authentication and booking\n\n";
      message += "All your personal information (phone number, ID, medical data) will be handled securely in the widget and never shared with me.";

      return {
        content: [
          {
            type: "text",
            text: message,
          },
        ],
        isError: false,
      };
    }
  );

  // ========================================
  // Tool 2: Search Doctors
  // ========================================
  server.registerTool(
    "search_doctors",
    {
      title: "Search for Doctors",
      description: `Search for doctors by specialty, name, location, or other criteria. Use when user wants to:
      - Find doctors in a specific specialty
      - Search for a doctor by name
      - Find doctors in a specific hospital or area
      - Compare doctors by rating or price
      - See doctor availability`,
      inputSchema: {
        specialty: z.string().optional().describe("Medical specialty (e.g., Cardiology, Dermatology)"),
        doctorName: z.string().optional().describe("Doctor's name to search for"),
        hospital: z.string().optional().describe("Hospital or clinic name"),
        location: z.string().optional().describe("City or area"),
      },
      _meta: widgetMeta(appointmentWidget),
    },
    async ({ specialty, doctorName, hospital, location }) => {
      let message = "Let me search for doctors";

      if (specialty) message += ` specializing in ${specialty}`;
      if (doctorName) message += ` named ${doctorName}`;
      if (hospital) message += ` at ${hospital}`;
      if (location) message += ` in ${location}`;

      message += ".\n\nOpening the eTabeb system where you can view detailed doctor profiles including:\n";
      message += "• Specialty and qualifications\n";
      message += "• Patient ratings and reviews\n";
      message += "• Hospital/clinic location\n";
      message += "• Consultation fees\n";
      message += "• Available appointment times\n\n";
      message += "You can browse freely without signing in. Authentication is only required when you're ready to book.";

      return {
        content: [
          {
            type: "text",
            text: message,
          },
        ],
        isError: false,
      };
    }
  );

  // ========================================
  // Tool 3: Check Appointment Availability
  // ========================================
  server.registerTool(
    "check_availability",
    {
      title: "Check Doctor Availability",
      description: `Check available appointment times for doctors. Use when user wants to:
      - See available time slots
      - Find appointments for specific dates
      - Check if a doctor is available
      - Find earliest available appointment`,
      inputSchema: {
        specialty: z.string().optional().describe("Medical specialty"),
        date: z.string().optional().describe("Preferred date (e.g., 'tomorrow', 'next Monday', 'January 30')"),
        timePreference: z.string().optional().describe("Time preference: 'morning', 'afternoon', 'evening'"),
      },
      _meta: widgetMeta(appointmentWidget),
    },
    async ({ specialty, date, timePreference }) => {
      let message = "Let me check available appointment times";

      if (specialty) message += ` for ${specialty} specialists`;
      if (date) message += ` on ${date}`;
      if (timePreference) message += ` in the ${timePreference}`;

      message += ".\n\nOpening the eTabeb system where you can:\n";
      message += "• View real-time availability for all doctors\n";
      message += "• See time slots organized by date and time\n";
      message += "• Filter by morning, afternoon, or evening appointments\n";
      message += "• Select the most convenient time for you\n\n";
      message += "Once you find a suitable time, you can proceed with booking.";

      return {
        content: [
          {
            type: "text",
            text: message,
          },
        ],
        isError: false,
      };
    }
  );

  // ========================================
  // Tool 4: Find Specialist
  // ========================================
  server.registerTool(
    "find_specialist",
    {
      title: "Find Medical Specialist",
      description: `Find specialists for specific medical conditions or symptoms. Use when user mentions:
      - Symptoms or health concerns
      - Medical conditions requiring specialist care
      - Need for specific type of doctor
      
      Examples: "I have chest pain" → Cardiologist, "skin rash" → Dermatologist, "child checkup" → Pediatrician`,
      inputSchema: {
        condition: z.string().describe("Medical condition, symptom, or health concern"),
        urgency: z.string().optional().describe("How urgent: 'emergency', 'urgent', 'routine'"),
      },
      _meta: widgetMeta(appointmentWidget),
    },
    async ({ condition, urgency }) => {
      let message = `I understand you need help with ${condition}. `;

      if (urgency === 'emergency') {
        message += "⚠️ For medical emergencies, please call emergency services (997 in Saudi Arabia) or visit the nearest emergency room immediately.\n\n";
        message += "If this is not an emergency but needs urgent attention, ";
      } else if (urgency === 'urgent') {
        message += "I'll help you find the earliest available appointment. ";
      }

      message += "Let me connect you with the appropriate medical specialists.\n\n";
      message += "Opening the eTabeb system where you can:\n";
      message += "• Find specialists for your specific condition\n";
      message += "• View doctor qualifications and experience\n";
      message += "• See available appointments (including same-day if urgent)\n";
      message += "• Book with the right specialist for your needs\n\n";
      message += "Your medical information will be kept private and secure.";

      return {
        content: [
          {
            type: "text",
            text: message,
          },
        ],
        isError: false,
      };
    }
  );

  // ========================================
  // Tool 5: Reschedule/Cancel Appointment
  // ========================================
  server.registerTool(
    "manage_appointment",
    {
      title: "Manage Existing Appointment",
      description: `Manage existing appointments. Use when user wants to:
      - Reschedule an appointment
      - Cancel an appointment
      - View upcoming appointments
      - Check appointment details`,
      inputSchema: {
        action: z.enum(["reschedule", "cancel", "view"]).describe("What the user wants to do"),
        reason: z.string().optional().describe("Reason for rescheduling or canceling"),
      },
      _meta: widgetMeta(appointmentWidget),
    },
    async ({ action, reason }) => {
      let message = "";

      if (action === "reschedule") {
        message = "I'll help you reschedule your appointment";
        if (reason) message += ` (${reason})`;
        message += ".\n\n";
      } else if (action === "cancel") {
        message = "I'll help you cancel your appointment";
        if (reason) message += ` (${reason})`;
        message += ".\n\n";
      } else {
        message = "Let me show you your upcoming appointments.\n\n";
      }

      message += "Opening the eTabeb system where you can:\n";
      message += "• View all your upcoming appointments\n";
      message += "• See appointment details (doctor, date, time, location)\n";
      message += "• Reschedule to a different time\n";
      message += "• Cancel if needed\n";
      message += "• Get appointment reminders\n\n";
      message += "You'll need to sign in to manage your appointments.";

      return {
        content: [
          {
            type: "text",
            text: message,
          },
        ],
        isError: false,
      };
    }
  );

  // ========================================
  // Tool 6: Get Medical Services Info
  // ========================================
  server.registerTool(
    "medical_services_info",
    {
      title: "Medical Services Information",
      description: `Provide information about medical services available. Use when user asks about:
      - Types of services offered
      - Lab tests
      - Clinical procedures
      - Vaccination services
      - Health checkups
      - Pricing information`,
      inputSchema: {
        serviceType: z.string().describe("Type of service user is asking about"),
      },
      _meta: widgetMeta(appointmentWidget),
    },
    async ({ serviceType }) => {
      const message = `I can help you with information about ${serviceType}.\n\n` +
        "eTabeb offers comprehensive medical services including:\n" +
        "• Doctor consultations (all specialties)\n" +
        "• Laboratory tests and diagnostics\n" +
        "• Clinical procedures\n" +
        "• Vaccinations and immunizations\n" +
        "• Preventive health checkups\n" +
        "• Specialist referrals\n\n" +
        "Opening the eTabeb system where you can:\n" +
        "• Browse all available services\n" +
        "• View detailed service descriptions\n" +
        "• Check pricing and insurance coverage\n" +
        "• Book appointments for any service\n\n" +
        "All services are provided by qualified healthcare professionals.";

      return {
        content: [
          {
            type: "text",
            text: message,
          },
        ],
        isError: false,
      };
    }
  );
});

export const { GET, POST } = handler;
