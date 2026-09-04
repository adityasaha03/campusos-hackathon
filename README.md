# CampusOS — Intelligent University Operations Platform

> **AI Build Hackathon Submission**  
> An intelligent university platform combining a real-time campus management dashboard and an autonomous Google Gemini AI agent connected live to Neon PostgreSQL.

---

## 📌 Project Overview

**CampusOS** is an intelligent university operations platform designed to eliminate fragmented campus communication and streamline student life. Built as a cohesive, dual-engine system, it delivers:

1. **A Real-Time Campus Management Dashboard:** An interactive web portal allowing students and faculty to view, create, edit, and delete records across five essential campus systems:
   - **Schedules:** Class timetables with course, room, day, time, and instructor.
   - **Rooms & Bookings:** Physical facilities with equipment lists, live status, and conflicting-booking prevention.
   - **Events & Registrations:** University happenings with real-time seat tracking and capacity limits.
   - **Announcements:** Urgent and standard notices with priority categorization and expiration dates.
   - **Assignments:** Academic deliverables with submission platform links, deadlines, and tracking.
2. **An Autonomous Google Gemini AI Agent:** A conversational assistant capable of answering complex campus inquiries, multi-source queries, and performing mutations (e.g. booking rooms, registering for events) via **deterministic Function Calling**. 

**Zero-Cache Real-Time Architecture:** The AI agent directly invokes backend services connected to a live Neon PostgreSQL database. Any modification made on the dashboard (such as rescheduling a class or updating a room) is immediately reflected in the AI agent's responses with zero delay and no server reboot.

---

## 💡 What Problem is Solved?

Every university student and faculty member encounters severe fragmentation in everyday campus operations:
- **Scattered Information Silos:** Room relocations and cancellations get buried in chaotic group chats, physical notice boards, or buried emails.
- **Booking & Scheduling Conflicts:** Students scramble to find open study spaces or labs with specific equipment (like projectors), often double-booking rooms because room schedules are opaque.
- **Event Registration Headaches:** Finding out about guest lectures or hackathons often happens after capacity has been reached.
- **Deadline Blindspots:** Keeping track of varying deadlines across multiple submission portals (LMS, Google Classroom, GitHub) leads to missed deliverables.
- **The Stale-Data AI Problem:** Most conversational bots rely on static documents or cached embeddings. If an announcement moves a class to a new room at 1:00 PM, a standard chatbot still sends students to the old room at 1:05 PM.

### How CampusOS Solves It:
- **Centralized Live Ground Truth:** Uses a relational Neon PostgreSQL database as the single authoritative source of truth.
- **Instant UI Reactivity:** Built with TanStack Query so any CRUD mutation is immediately visible on screen with zero manual reloads.
- **Synchronized Agent Function Calling:** The Gemini AI does not guess from training memory; it queries live database state on every turn and executes transactional actions with full constraint validation.

---

## 🛠️ Tech Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend Framework** | React 18, TypeScript, Vite | Fast, type-safe single-page application |
| **State & Cache Sync** | TanStack Query (`@tanstack/react-query` v5) | Auto-refetching, cache invalidation on mutations |
| **HTTP Client** | Axios | Centralized API client with standard error extraction |
| **Frontend Styling** | Vanilla CSS, Lucide React | Glassmorphism, responsive tables, interactive modals |
| **Backend Runtime** | Node.js (v18+), TypeScript, Express.js | High-throughput REST API with CORS & error handling |
| **Execution Engine** | `tsx` | High-speed TypeScript compilation and live watching |
| **Database & ORM** | Neon Serverless PostgreSQL, Prisma ORM 6 | Type-safe migrations, relational schema, stable IDs |
| **Validation** | Zod | Runtime schema validation on API payloads |
| **AI Agent Engine** | Google Generative AI (`@google/generative-ai`) | Native Gemini Function Calling and tool loop |

---

## 📁 Repository Structure

```text
misfortune_500/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Prisma models for Schedule, Room, Booking, Event, Registration, Announcement, Assignment
│   │   └── seed.ts             # Deterministic seed script (upsert by stable ID)
│   ├── src/
│   │   ├── controllers/        # Express HTTP controllers
│   │   ├── middleware/         # Centralized error handler & Zod validation
│   │   ├── models/             # Prisma client singleton
│   │   ├── routes/             # REST routes (/schedules, /rooms, /events, /announcements, /assignments, /agent)
│   │   ├── services/           # Shared business logic (used by both REST API and Gemini agent)
│   │   │   ├── scheduleService.ts
│   │   │   ├── roomService.ts
│   │   │   ├── eventService.ts
│   │   │   ├── announcementService.ts
│   │   │   ├── assignmentService.ts
│   │   │   └── gemini.ts       # Gemini Function Calling tool definitions & agent loop
│   │   └── index.ts            # Express server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Modals, Navigation bar, Status badges
│   │   ├── pages/              # Schedules, Rooms, Events, Announcements, Assignments, Chat
│   │   ├── services/           # Axios API modules per domain
│   │   ├── App.tsx             # Master layout and view routing
│   │   └── main.tsx            # QueryClient initialization
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── data/                       # Initial seed datasets (JSON)
├── schema/                     # Schema specifications
├── sample_queries/             # Evaluation sample queries
├── .env.example                # Environment variables template
├── plan.md                     # Implementation plan
├── PROBLEM_STATEMENT.md        # Official hackathon requirements
└── README.md                   # Central documentation
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@ep-xyz.neon.tech/campusos?sslmode=require` |
| `GEMINI_API_KEY` | Google Gemini API Key | `AIzaSy...` |
| `PORT` | Backend server port | `4000` |
| `FRONTEND_ORIGIN` | Allowed CORS origin for frontend | `http://localhost:5173` |
| `DEFAULT_STUDENT_ID` | Default identity for student queries & registrations | `20-40532` |
| `DEFAULT_STUDENT_NAME`| Default student name | `Sakibul Hassan` |

> 🔒 **Security Notice:** Do not commit `.env` or real API keys to version control.

---

## 🚀 Unified Run and Build Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Neon PostgreSQL**: Active database instance
- **Google Gemini API Key**

---

### Step 1: Clone & Configure

```bash
git clone https://github.com/YOUR_USERNAME/misfortune_500.git
cd misfortune_500
cp .env.example .env
# Edit .env with your DATABASE_URL and GEMINI_API_KEY
```

---

### Step 2: Setup Database & Backend

Open a terminal at the project root:

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma Client and apply schema to Neon DB
npx prisma generate
npx prisma db push

# Seed initial records (24 schedules, 20 rooms, 7 events, 8 announcements, 8 assignments)
npm run seed

# Start backend development server
npm run dev
```
- Backend runs at: `http://localhost:4000`
- Health check: `http://localhost:4000/api/health`

**Backend Production Build:**
```bash
npm run build
npm run start
```

---

### Step 3: Setup & Run Frontend

Open a second terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Start frontend development server
npm run dev
```
- Frontend runs at: `http://localhost:5173`

**Frontend Production Build:**
```bash
npm run build
npm run preview
```

---

## 📡 API Surface Reference

Base path: `/api`. All query parameters and JSON fields use `snake_case`.

| Domain | Method & Endpoint | Description |
|---|---|---|
| **Schedules** | `GET /schedules` | List schedules (filter by `day`, `course`, `instructor`) |
| | `GET /schedules/:id` | Get single schedule |
| | `POST /schedules` | Create new schedule |
| | `PUT /schedules/:id` | Update schedule |
| | `DELETE /schedules/:id` | Delete schedule |
| **Rooms** | `GET /rooms` | List all rooms |
| | `GET /rooms/available` | Filter available rooms (`date`, `start_time`, `end_time`, `min_capacity`, `type`, `equipment`) |
| | `GET /rooms/:id` | Get single room with bookings |
| | `POST /rooms` | Create new room |
| | `PUT /rooms/:id` | Update room |
| | `DELETE /rooms/:id` | Delete room |
| | `POST /rooms/:id/book` | Book room (validates overlaps) |
| | `DELETE /rooms/:id/bookings/:booking_id` | Cancel room booking |
| **Events** | `GET /events` | List events |
| | `GET /events/:id` | Get event with registration list |
| | `POST /events` | Create new event |
| | `PUT /events/:id` | Update event details |
| | `DELETE /events/:id` | Delete event |
| | `POST /events/:id/register` | Register student (validates capacity) |
| | `POST /events/:id/cancel` | Cancel student registration |
| **Announcements** | `GET /announcements` | List notices (sorted by date/priority) |
| | `POST /announcements` | Post announcement |
| | `PUT /announcements/:id` | Edit announcement |
| | `DELETE /announcements/:id` | Remove announcement |
| **Assignments** | `GET /assignments` | List assignments (filter by status/deadline) |
| | `POST /assignments` | Create assignment |
| | `PUT /assignments/:id` | Update assignment |
| | `DELETE /assignments/:id` | Delete assignment |
| **AI Agent** | `POST /agent/chat` | Send message and conversation history to Gemini agent |

---

## 🤖 AI Agent & Function Calling Tools

The AI agent in `backend/src/services/gemini.ts` runs on Google Gemini with real-time tool orchestration:

| Tool Name | Operation | Key Parameters |
|---|---|---|
| `get_schedule` | Query timetable records | `day?`, `course?`, `instructor?` |
| `get_assignments` | Query assignments | `course?`, `status?`, `deadline_before?` |
| `get_announcements` | Query announcements | `priority?`, `since?` |
| `get_events` | Query campus events | `date?`, `name_contains?` |
| `get_rooms` | Query room inventory | `type?`, `min_capacity?`, `equipment?` |
| `check_room_availability` | Check free room slot | `room_number`, `date`, `start_time`, `end_time` |
| `book_room` | Reserve a room | `room_number`, `date`, `start_time`, `end_time`, `purpose?` |
| `cancel_room_booking` | Cancel reservation | `booking_id` |
| `register_for_event` | Register default student | `event_id` |
| `cancel_event_registration` | Cancel registration | `event_id` |

### Sample Evaluation Scenarios
1. **Simple Lookups:**
   - *"When is my next class?"*
   - *"What classes do I have on Wednesday?"*
   - *"Show me all high priority announcements."*
2. **Multi-Source Reasoning:**
   - *"I'm free until 2 PM — is there anything on campus I could drop into?"* (Cross-references schedules with events)
   - *"Which labs have a projector and can fit at least 30 people?"* (Filters rooms by type, capacity, and equipment)
3. **Database Actions:**
   - *"Book Room 7A02 tomorrow from 3 PM to 5 PM for study session."* (Checks conflicts, books room)
   - *"Register me for the Guest Lecture on Deep Learning."* (Resolves event ID, checks capacity, registers student)
4. **Vague & Out-of-Scope Requests:**
   - *"Book me any room tomorrow."* → Refuses to guess; asks clarifying questions for time, room, and purpose.
   - Double-booking or over-capacity requests → Rejects with clear explanation of the conflict.

---

## 🔄 Live Data-Sync Proof (Judge Test)

To prove that the AI agent reflects live database state with zero caching delay:
1. Go to the **Announcements** page on the dashboard.
2. Edit `ann-001` (*"CSE 4113 Class Rescheduled"*) and change the room from `Room 7B03` to `Room 9A01`.
3. Switch immediately to the **Chat** page.
4. Ask: *"Where is my CSE 4113 class this Sunday?"*
5. The agent inspects the updated announcement directly from Neon PostgreSQL and answers **Room 9A01**.

---

## ✅ Submission Checklist Verification

- [x] **Public GitHub Repository**
- [x] **All 5 Data Domains Operational:** Schedules, Rooms, Events, Announcements, Assignments
- [x] **Full CRUD & Actions:** Add, edit, delete, book room, register event all persist to Neon PostgreSQL
- [x] **Instant UI Updates:** TanStack Query invalidation on every mutation
- [x] **Real Tool Calling:** Native Gemini function calling, no mocked prose
- [x] **Live Data Guarantee:** Zero-cache reads from DB on every agent turn
- [x] **Zero Committed Secrets:** Environment variables securely managed via `.env.example`
