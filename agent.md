# CampusOS — Agent Execution Log: Frontend Agent

> **Agent:** Frontend Agent  
> **Target Phase:** Phase 3 — Frontend Dashboard  
> **Status:** In Progress / Completed Available Frontend Features  
> **Last Updated:** 2026-09-04  
> **Base URL Target:** `http://localhost:4000/api` (`VITE_API_URL`)

---

## 1. Responsibilities & Scope
- **Owner:** Frontend Agent (`frontend/`)
- **Deliverables:**
  1. Complete React 18 + TypeScript + Vite single page application with TanStack Query.
  2. 6 core views:
     - **Schedules**: Weekly timetable by day, search by course/instructor, full CRUD modal workflows.
     - **Rooms**: Capacity/equipment view, real-time availability finder tool, room booking with date & time range, collapsible reservations drawer, cancel booking action, full room CRUD.
     - **Events**: Attendee progress counter (`registered / capacity`), default student register/cancel registration workflows, full event CRUD.
     - **Announcements**: High/medium/low priority filters, notice cards, full announcement CRUD.
     - **Assignments**: Status tabs (`pending`, `submitted`, `graded`, `late`), deadline countdowns, quick status selector, full assignment CRUD.
     - **AI Assistant**: Conversational chat interface connected to `POST /api/agent/chat` sending full turn history, with suggested prompt chips from `sample_queries.md`.
  3. Strict adherence to exact `snake_case` schema from `schema/schema.md`.
  4. Immediate TanStack Query cache invalidations on every mutation (zero manual page refresh required).
  5. Resilient error handling and graceful offline banners when backend server is waiting to be started.
  6. High-end modern dark-mode aesthetic (custom CSS variables, glassmorphism, responsive grids, accessible dialogs).

---

## 2. Implementation Progress & Checklist

- [x] **Project Scaffolding & Dependencies**
  - Vite + React + TypeScript initialized.
  - Dependencies installed: `@tanstack/react-query`, `axios`, `lucide-react`, `react`, `react-dom`.
- [x] **Data Types & Interfaces (`frontend/src/types/index.ts`)**
  - Exact `snake_case` field types for `Schedule`, `Room`, `Booking`, `Event`, `Registration`, `Announcement`, `Assignment`, and `ChatTurn`.
- [x] **API Services (`frontend/src/services/`)**
  - `api.ts`: Base Axios client with centralized error message extraction and student defaults.
  - `schedules.ts`: Full CRUD (`getSchedules`, `createSchedule`, `updateSchedule`, `deleteSchedule`).
  - `rooms.ts`: Full CRUD + `getAvailableRooms`, `bookRoom`, and `cancelBooking`.
  - `events.ts`: Full CRUD + `registerForEvent` and `cancelEventRegistration`.
  - `announcements.ts`: Full CRUD (`getAnnouncements`, `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement`).
  - `assignments.ts`: Full CRUD (`getAssignments`, `createAssignment`, `updateAssignment`, `deleteAssignment`).
  - `agent.ts`: `sendChatMessage` sending `{ message, history }` to `POST /api/agent/chat`.
- [x] **Design System & UI Components (`frontend/src/components/`)**
  - `Navbar.tsx`: Sticky navigation with CampusOS brand, live API connection pill, user badge (`Sakibul Hassan`, `20-40532`), and shared-cache live count badges across tabs (schedules, available rooms, events, high-priority notices, pending assignments).
  - `Modal.tsx`: Accessible modal with blur backdrop, escape key support, and clean action footer.
  - `ConfirmDialog.tsx`: Safe confirmation dialogs for destructive actions.
  - `Badge.tsx`: Status and priority indicators with custom theme colors.
  - `ToastContext.tsx`: Floating toast system for instant mutation feedback.
  - `States.tsx`: Animated spinner for loading and empty state screens.
  - `index.css`: Comprehensive glassmorphism dark-theme styling, custom scrollbars, animations, responsive layouts, and chat markdown formatting.
- [x] **Pages Built (`frontend/src/pages/`)**
  - [x] `SchedulesPage.tsx`: Day filter pills, search, timetable view, full CRUD modals.
  - [x] `RoomsPage.tsx`: Room cards, availability finder, booking modal, collapsible bookings drawer, cancel booking.
  - [x] `EventsPage.tsx`: Capacity progress bar, default student registration/cancellation, full CRUD modals.
  - [x] `AnnouncementsPage.tsx`: Priority filters, highlighted notice cards, edit test readiness (`ann-001`), full CRUD modals.
  - [x] `AssignmentsPage.tsx`: Status tabs, deadline countdowns, quick status selector, full CRUD modals.
  - [x] `ChatPage.tsx`: Multi-turn conversational interface with suggested query chips from `sample_queries.md`, markdown parser for formatted responses, copy to clipboard, and typing indicator.
- [x] **Application Root (`frontend/src/App.tsx`)**
  - QueryClient configured with live freshness (`staleTime: 10s`, `refetchOnWindowFocus: true`).
  - Hash navigation router for seamless tab persistence.
  - Verified production build with 0 TypeScript/Vite errors.
  - University department footer.

---

## 3. API Contract Specifications (For Agent Backend)

The frontend expects the following endpoints at `http://localhost:4000/api`:

| Domain | Route | Method | Payload / Params | Expected Response |
|---|---|---|---|---|
| **Schedules** | `/schedules` | `GET` | `?day=&course=&instructor=` | `Schedule[]` |
| | `/schedules` | `POST` | `Omit<Schedule, 'id'>` | `Schedule` |
| | `/schedules/:id` | `PUT` | `Partial<Schedule>` | `Schedule` |
| | `/schedules/:id` | `DELETE` | — | `{ success: boolean }` |
| **Rooms** | `/rooms` | `GET` | `?type=&min_capacity=&equipment=` | `Room[]` (with `bookings[]`) |
| | `/rooms/:id` | `GET` | — | `Room` |
| | `/rooms` | `POST` | `Partial<Room>` | `Room` |
| | `/rooms/:id` | `PUT` | `Partial<Room>` | `Room` |
| | `/rooms/:id` | `DELETE` | — | `{ success: boolean }` |
| | `/rooms/available` | `GET` | `?date=&start_time=&end_time=&min_capacity=&type=&equipment=` | `Room[]` |
| | `/rooms/:id/book` | `POST` | `{ booked_by, date, start_time, end_time, purpose }` | `{ success: boolean, booking: Booking }` |
| | `/rooms/:id/bookings/:booking_id` | `DELETE` | — | `{ success: boolean }` |
| **Events** | `/events` | `GET` | `?date=&name_contains=` | `Event[]` (with `registrations[]`) |
| | `/events` | `POST` | `Partial<Event>` | `Event` |
| | `/events/:id` | `PUT` | `Partial<Event>` | `Event` |
| | `/events/:id` | `DELETE` | — | `{ success: boolean }` |
| | `/events/:id/register` | `POST` | `{ student_id, name }` | `{ success: boolean, event: Event }` |
| | `/events/:id/cancel` | `POST` | `{ student_id }` | `{ success: boolean, event: Event }` |
| **Announcements** | `/announcements` | `GET` | `?priority=&since=` | `Announcement[]` |
| | `/announcements` | `POST` | `Partial<Announcement>` | `Announcement` |
| | `/announcements/:id` | `PUT` | `Partial<Announcement>` | `Announcement` |
| | `/announcements/:id` | `DELETE` | — | `{ success: boolean }` |
| **Assignments** | `/assignments` | `GET` | `?course=&status=&deadline_before=` | `Assignment[]` |
| | `/assignments` | `POST` | `Partial<Assignment>` | `Assignment` |
| | `/assignments/:id` | `PUT` | `Partial<Assignment>` | `Assignment` |
| | `/assignments/:id` | `DELETE` | — | `{ success: boolean }` |
| **Agent Chat** | `/agent/chat` | `POST` | `{ message: string, history?: { role: string, parts: { text: string }[] }[] }` | `{ reply: string }` |

---

## 4. Current State & Next Steps
- Frontend code builds with 0 errors via `npm run build`.
- When Agent DB and Agent Backend complete Phases 1 & 2, all dashboard tabs will immediately display live seed data and process mutations against Neon.
- AI Chat tab is ready to interface with Agent AI's `POST /api/agent/chat` implementation.
