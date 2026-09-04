import {
  GoogleGenerativeAI,
  SchemaType,
  FunctionDeclaration,
  ChatSession,
  Content,
} from '@google/generative-ai';
import { getAllSchedules } from './scheduleService';
import {
  getAllRooms,
  checkRoomAvailability,
  bookRoom,
  cancelRoomBooking,
} from './roomService';
import {
  getAllEvents,
  registerForEvent,
  cancelEventRegistration,
} from './eventService';
import { getAllAnnouncements } from './announcementService';
import { getAllAssignments } from './assignmentService';

const DEFAULT_STUDENT_ID = process.env.DEFAULT_STUDENT_ID || '20-40532';
const DEFAULT_STUDENT_NAME = process.env.DEFAULT_STUDENT_NAME || 'Sakibul Hassan';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

// 1. Tool / Function Declarations
const toolsDeclarations: FunctionDeclaration[] = [
  {
    name: 'get_schedule',
    description: 'List schedule timetable entries filtered optionally by day of the week, course code, or instructor.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        day: {
          type: SchemaType.STRING,
          description: 'Day of the week (Sunday, Monday, Tuesday, Wednesday, Thursday).',
        },
        course: {
          type: SchemaType.STRING,
          description: 'Course code or name substring e.g. "CSE 4113".',
        },
        instructor: {
          type: SchemaType.STRING,
          description: 'Instructor name substring.',
        },
      },
    },
  },
  {
    name: 'get_assignments',
    description: 'List coursework assignments filtered optionally by course, status, or deadline before a given date.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        course: {
          type: SchemaType.STRING,
          description: 'Course code e.g. "CSE 4113".',
        },
        status: {
          type: SchemaType.STRING,
          description: 'Assignment status: "pending", "submitted", "graded", "late".',
        },
        deadline_before: {
          type: SchemaType.STRING,
          description: 'Filter assignments with deadline on or before this date in YYYY-MM-DD format.',
        },
      },
    },
  },
  {
    name: 'get_announcements',
    description: 'List university/department announcements filtered optionally by priority or posted since a given date.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        priority: {
          type: SchemaType.STRING,
          description: 'Announcement priority level: "high", "medium", or "low".',
        },
        since: {
          type: SchemaType.STRING,
          description: 'Only return announcements posted on or after this date in YYYY-MM-DD format.',
        },
      },
    },
  },
  {
    name: 'get_events',
    description: 'List or search campus events filtered optionally by date or matching name substring.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        date: {
          type: SchemaType.STRING,
          description: 'Event date in YYYY-MM-DD format.',
        },
        name_contains: {
          type: SchemaType.STRING,
          description: 'Substring search for event title or topic e.g. "Deep Learning" or "Hackathon".',
        },
      },
    },
  },
  {
    name: 'get_rooms',
    description: 'List rooms filtered by room type, minimum capacity, and/or required equipment.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        type: {
          type: SchemaType.STRING,
          description: 'Room type: "classroom", "lab", "seminar".',
        },
        min_capacity: {
          type: SchemaType.NUMBER,
          description: 'Minimum seating capacity.',
        },
        equipment: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.STRING,
          },
          description: 'List of required equipment e.g. ["projector", "AC", "smart board"].',
        },
      },
    },
  },
  {
    name: 'check_room_availability',
    description: 'Check if a specific room is free and available for booking on a specific date and time window.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        room_number: {
          type: SchemaType.STRING,
          description: 'Room number (e.g. "7A02") or room ID.',
        },
        date: {
          type: SchemaType.STRING,
          description: 'Date in YYYY-MM-DD format.',
        },
        start_time: {
          type: SchemaType.STRING,
          description: 'Start time in 24-hour HH:mm format (e.g. "15:00").',
        },
        end_time: {
          type: SchemaType.STRING,
          description: 'End time in 24-hour HH:mm format (e.g. "17:00").',
        },
      },
      required: ['room_number', 'date', 'start_time', 'end_time'],
    },
  },
  {
    name: 'book_room',
    description: 'Reserve/book a room for a specific date and time slot. Do NOT call this tool with guessed values.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        room_number: {
          type: SchemaType.STRING,
          description: 'Room number (e.g. "7A02") or room ID.',
        },
        date: {
          type: SchemaType.STRING,
          description: 'Date in YYYY-MM-DD format.',
        },
        start_time: {
          type: SchemaType.STRING,
          description: 'Start time in 24-hour HH:mm format (e.g. "15:00").',
        },
        end_time: {
          type: SchemaType.STRING,
          description: 'End time in 24-hour HH:mm format (e.g. "17:00").',
        },
        purpose: {
          type: SchemaType.STRING,
          description: 'Purpose or reason for booking (e.g. "Study session", "Project discussion").',
        },
        booked_by: {
          type: SchemaType.STRING,
          description: 'Name of the student or entity booking. Defaults to logged-in student name.',
        },
      },
      required: ['room_number', 'date', 'start_time', 'end_time'],
    },
  },
  {
    name: 'cancel_room_booking',
    description: 'Cancel an existing room reservation using its unique booking_id.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        booking_id: {
          type: SchemaType.STRING,
          description: 'Unique identifier of the booking (e.g. "bk-001" or generated ID).',
        },
      },
      required: ['booking_id'],
    },
  },
  {
    name: 'register_for_event',
    description: 'Register the active student for a campus event by its event_id. Check event details or search first.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        event_id: {
          type: SchemaType.STRING,
          description: 'Unique ID of the event (e.g. "evt-001", "evt-002").',
        },
      },
      required: ['event_id'],
    },
  },
  {
    name: 'cancel_event_registration',
    description: 'Cancel the active student\'s registration for a campus event by its event_id.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        event_id: {
          type: SchemaType.STRING,
          description: 'Unique ID of the event to cancel registration from.',
        },
      },
      required: ['event_id'],
    },
  },
];

// 2. Tool Execution Dispatcher
async function executeTool(name: string, args: any): Promise<any> {
  console.log(`\n🤖 [Agent AI Tool Invocation] Executing tool "${name}" with args:`, JSON.stringify(args));

  try {
    switch (name) {
      case 'get_schedule': {
        const schedules = await getAllSchedules({
          day: args.day,
          course: args.course,
          instructor: args.instructor,
        });
        return { count: schedules.length, schedules };
      }

      case 'get_assignments': {
        const assignments = await getAllAssignments({
          course: args.course,
          status: args.status,
          deadline_before: args.deadline_before,
        });
        return { count: assignments.length, assignments };
      }

      case 'get_announcements': {
        const announcements = await getAllAnnouncements({
          priority: args.priority,
          since: args.since,
        });
        return { count: announcements.length, announcements };
      }

      case 'get_events': {
        const events = await getAllEvents({
          date: args.date,
          name_contains: args.name_contains,
        });
        return { count: events.length, events };
      }

      case 'get_rooms': {
        const rooms = await getAllRooms({
          type: args.type,
          min_capacity: args.min_capacity ? Number(args.min_capacity) : undefined,
          equipment: Array.isArray(args.equipment) ? args.equipment : undefined,
        });
        return { count: rooms.length, rooms };
      }

      case 'check_room_availability': {
        const result = await checkRoomAvailability(
          args.room_number,
          args.date,
          args.start_time,
          args.end_time
        );
        return result;
      }

      case 'book_room': {
        const booking = await bookRoom(args.room_number, {
          date: args.date,
          start_time: args.start_time,
          end_time: args.end_time,
          purpose: args.purpose || 'Campus reservation',
          booked_by: args.booked_by || DEFAULT_STUDENT_NAME,
        });
        return {
          success: true,
          message: `Successfully booked room ${args.room_number} on ${args.date} from ${args.start_time} to ${args.end_time}`,
          booking,
        };
      }

      case 'cancel_room_booking': {
        const deleted = await cancelRoomBooking(args.booking_id);
        return {
          success: true,
          message: `Successfully cancelled booking ${args.booking_id}`,
          booking: deleted,
        };
      }

      case 'register_for_event': {
        const result = await registerForEvent(
          args.event_id,
          DEFAULT_STUDENT_ID,
          DEFAULT_STUDENT_NAME
        );
        return {
          success: true,
          message: `Successfully registered ${DEFAULT_STUDENT_NAME} (${DEFAULT_STUDENT_ID}) for event "${result.event.name}"`,
          event: result.event,
        };
      }

      case 'cancel_event_registration': {
        const result = await cancelEventRegistration(
          args.event_id,
          DEFAULT_STUDENT_ID
        );
        return {
          success: true,
          message: `Successfully cancelled registration for event "${result.event.name}"`,
          event: result.event,
        };
      }

      default:
        console.warn(`[Agent AI Tool Invocation] Unknown tool requested: "${name}"`);
        return { error: `Tool "${name}" is not implemented.` };
    }
  } catch (error: any) {
    console.error(`❌ [Agent AI Tool Error] Execution failed for "${name}":`, error.message);
    return {
      error: error.message || 'Tool execution encountered an error.',
      status_code: error.statusCode || 500,
      details: error.details,
    };
  }
}

// 3. System Prompt Definition
const SYSTEM_PROMPT = `You are CampusOS AI, the official intelligent university assistant for Ahsanullah University of Science and Technology (AUST).
You provide real-time, live assistance to students and faculty regarding classes, room bookings, campus events, departmental announcements, and coursework assignments.

### Active Student Identity
- Current Student Name: ${DEFAULT_STUDENT_NAME}
- Student ID: ${DEFAULT_STUDENT_ID}
- When asked "When is my next class?", "What classes do I have?", or "Register me", you are acting on behalf of ${DEFAULT_STUDENT_NAME} (${DEFAULT_STUDENT_ID}).
- There is no other user login system. Use this student identity for all personalized questions and actions.

### Temporal & Reference Calendar Context
- Current simulated reference date: Friday, 4 September 2026 (2026-09-04), 18:30.
- Tomorrow is Saturday, 5 September 2026 (2026-09-05).
- In this academic schedule, the university week runs Sunday through Thursday.
- Sunday is 7 September 2026 (2026-09-07).
- "This week" refers to the current academic cycle in September 2026.
- If asked "When is my next class?", retrieve the schedule timetable using \`get_schedule\`. Note that Friday and Saturday have no regular classes; the next regular class day is Sunday! Check Sunday's schedule and check if any announcement rescheduling applies.

### Core Rules for Tool Calling & Accuracy (CRITICAL)
1. **LIVE DATA ALWAYS:** Never answer factual questions about schedules, rooms, events, announcements, or assignments from training memory. You MUST invoke the corresponding read tools on EVERY turn.
2. **MULTI-SOURCE REASONING & RESCHEDULING CHECKS:**
   - Whenever asked about a specific course class, time, or location (e.g., "Where is my CSE 4113 class this Sunday?"), call BOTH \`get_schedule\` AND \`get_announcements\`. Always check if any recent announcement or circular has rescheduled the class, changed its room, or altered its time slot, and prioritize that official announcement in your answer!
   - For campus activity queries (such as "I'm free until 2 PM — is there anything on campus I could drop into?"), call BOTH \`get_schedule\` and \`get_events\` to synthesize class timetable gaps with active campus events.
3. **ROOM FILTERING & AVAILABILITY:** When asked for rooms with criteria (e.g., "Which labs have a projector and can fit at least 30 people?"), call \`get_rooms(type="lab", min_capacity=30, equipment=["projector"])\`.
4. **ENTITY RESOLUTION BEFORE MUTATIONS:** Before calling a mutating tool:
   - For booking a room: First verify availability using \`check_room_availability\`. If available, proceed with \`book_room\`. If the user asks for a room with requirements without a specific room number, use \`get_rooms\`, then check availability, then present or book.
   - For event registration: If given an event name (e.g., "Guest Lecture on Deep Learning"), call \`get_events(name_contains="Deep Learning")\` to look up the exact \`event_id\` (e.g., \`evt-002\`) before calling \`register_for_event\`.
5. **NEVER GUESS MUTATING PARAMETERS (CLARIFY INSTEAD):**
   - If the user gives a vague action request without necessary details (such as "just book me any room tomorrow" without time/capacity, or "register me for an event" without the event name), DO NOT call any booking or registration tool!
   - Instead, ask a clear clarifying question requesting the missing details (e.g., "What time window and capacity do you need for the room?").
6. **CLEAR REFUSALS:**
   - Double-bookings: If \`check_room_availability\` or \`book_room\` returns that a room is already booked, clearly explain why, state who booked it, the conflicting time slot, and propose checking other rooms or times.
   - Over-capacity events: If an event is at full capacity, state the event capacity and current count, and refuse registration politely.
   - Already registered: If the student is already registered for the event, inform them clearly.
   - Out-of-scope requests: If the user asks about topics completely unrelated to CampusOS domains (e.g. external news, cooking recipes, weather in other countries, general coding), politely refuse and guide them back to campus services (classes, rooms, events, notices, assignments).
7. **ONE TOOL PER INTENT (PREVENT LOOPS):** When answering a broad query like "What classes do I have today?", call \`get_schedule\` EXACTLY ONCE with the day parameter. Read the returned array and output the final answer immediately. Do not make multiple consecutive tool calls for each individual class.
8. **FORMATTING:** Format your final responses cleanly using markdown (bullet points, bold text for key entities like course codes, room numbers, times, and dates).`;

// 4. Gemini Client Initialization
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables.');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export interface ChatTurnPart {
  text?: string;
  functionCall?: any;
  functionResponse?: any;
}

export interface ChatTurn {
  role: 'user' | 'model';
  parts: ChatTurnPart[] | string;
}

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview',
  'gemini-3-flash-preview',
];

// 5. Main Chat Turn Handler with Tool Execution Loop & Model Fallback
export async function handleChatMessage(
  message: string,
  history: ChatTurn[] = []
): Promise<string> {
  const ai = getGenAI();

  // Convert incoming history to SDK format
  const sdkHistory: Content[] = [];
  for (const turn of history) {
    if (typeof turn.parts === 'string') {
      sdkHistory.push({
        role: turn.role,
        parts: [{ text: turn.parts }],
      });
    } else if (Array.isArray(turn.parts)) {
      const validParts = turn.parts
        .map((p) => {
          if (typeof p === 'string') return { text: p };
          if (p.text) return { text: p.text };
          return null;
        })
        .filter(Boolean) as any[];

      if (validParts.length > 0) {
        sdkHistory.push({
          role: turn.role,
          parts: validParts,
        });
      }
    }
  }

  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      console.log(`\n💬 [Agent AI Chat] Invoking Gemini using model "${modelName}" for query: "${message}"`);
      const model = ai.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: toolsDeclarations }],
      });

      const chat: ChatSession = model.startChat({
        history: sdkHistory,
      });

      let response = await chat.sendMessage(message);

      // Tool execution loop (HARD CAPPED AT 2 ITERATIONS to prevent quota burn)
      const MAX_TOOL_ITERATIONS = 2;
      let iterations = 0;

      while (iterations < MAX_TOOL_ITERATIONS) {
        iterations++;
        const functionCalls = response.response.functionCalls();

        if (!functionCalls || functionCalls.length === 0) {
          break; // The model provided a text answer, break the loop
        }

        console.log(
          `🔄 [Agent AI Tool Loop] Iteration ${iterations}/${MAX_TOOL_ITERATIONS} (${modelName}): Model requested ${functionCalls.length} function call(s):`,
          functionCalls.map((fc) => fc.name)
        );

        const functionResponses: any[] = [];
        for (const call of functionCalls) {
          const toolResult = await executeTool(call.name, call.args);
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: {
                result: toolResult,
              },
            },
          });
        }

        response = await chat.sendMessage(functionResponses);
      }

      // If the model is STILL trying to call tools after hitting the max limit, force a stop.
      if (response.response.functionCalls()?.length) {
        console.warn(`🛑 [Agent AI Tool Loop] Max iterations (${MAX_TOOL_ITERATIONS}) reached. Forcing stop.`);
        return "I found the information, but the schedule is quite large. Please check the dashboard for the full list of classes.";
      }

      const finalReply = response.response.text();
      console.log(`✅ [Agent AI Chat] (${modelName}) Final reply generated (${finalReply.length} chars)`);
      return finalReply;
    } catch (err: any) {
      console.warn(`⚠️ [Agent AI Chat] Model "${modelName}" encountered error:`, err.message?.slice(0, 120));
      lastError = err;
      // If error is 429 quota or 503 overload, fall back to next model
      if (err.message?.includes('429') || err.message?.includes('503') || err.message?.includes('404')) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Failed to generate response across candidate models.');
}