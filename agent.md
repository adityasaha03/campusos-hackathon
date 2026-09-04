# CampusOS — Unified Agent Execution Log

## Status Overview
- **Phase 0 (Repo Scaffolding):** ✅ Completed
- **Phase 1 (Database Layer / Prisma):** ✅ Completed (Neon PostgreSQL schema synced via Prisma, seed script created & verified).
- **Phase 2 (Backend CRUD API):** ✅ Completed (All services, controllers, routes, validation, and Express app implemented and aligned with frontend contracts).
- **Phase 3 (Frontend Dashboard):** ✅ Completed (Vite + React 18 + TypeScript + TanStack Query dashboard with all 6 views and CRUD modals).
- **Phase 4 (AI Agent / Gemini Integration):** ⏳ Pending

---

## 1. Frontend Implementation (`frontend/`)

### Deliverables Completed
1. Complete React 18 + TypeScript + Vite single page application with TanStack Query.
2. 6 core views:
   - **Schedules**: Weekly timetable by day, search by course/instructor, full CRUD modal workflows.
   - **Rooms**: Capacity/equipment view, real-time availability finder tool, room booking with date & time range, collapsible reservations drawer, cancel booking action, full room CRUD.
   - **Events**: Attendee progress counter (`registered / capacity`), default student register/cancel registration workflows, full event CRUD.
   - **Announcements**: High/medium/low priority filters, notice cards, full announcement CRUD.
   - **Assignments**: Status tabs (`pending`, `submitted`, `graded`, `late`), deadline countdowns, quick status selector, full assignment CRUD.
   - **AI Assistant**: Conversational chat interface connected to `POST /api/agent/chat` sending full turn history, with suggested prompt chips from `sample_queries.md`.
3. Strict adherence to exact `snake_case` schema from `schema/schema.md`.
4. Immediate TanStack Query cache invalidations on every mutation.
5. High-end modern dark-mode aesthetic (glassmorphism, responsive grids, accessible dialogs).

---

## 2. Backend & Database Implementation (`backend/`)

### 1. Database & Models (`backend/prisma/` & `backend/src/models/`)
- `backend/prisma/schema.prisma`:
  - Full relational schema adhering strictly to `schema/schema.md` exact `snake_case` attributes.
  - Models: `Schedule`, `Room`, `Booking`, `Event`, `Registration`, `Announcement`, `Assignment`.
- `backend/src/models/prisma.ts`: Centralized Prisma client instance.
- `backend/prisma/seed.ts`: Flattens and seeds all 5 data entities idempotently.

### 2. Error Handling & Validation (`backend/src/middleware/`, `backend/src/validation/`)
- `backend/src/errors/HttpError.ts`: Standardized error class with status code and details.
- `backend/src/middleware/errorHandler.ts`: Centralized error handler returning `{ error: string, details?: any }`.
- `backend/src/validation/schemas.ts`: Zod schemas validating POST / PUT payloads.
- `backend/src/middleware/validate.ts`: Formatted Zod validation middleware for frontend toast clarity.

### 3. Business Logic Services (`backend/src/services/`)
- `scheduleService.ts`: Filtered queries and CRUD.
- `roomService.ts`: Real-time interval overlap calculation, conflict checks, room booking, and cancellation.
- `eventService.ts`: Capacity validation, registration creation, automatic status flip to `"full"`, registration cancellation.
- `announcementService.ts`: Priority and `since` date filtering, CRUD.
- `assignmentService.ts`: Course, status, deadline filtering, CRUD.

### 4. HTTP Controllers & Routes (`backend/src/controllers/`, `backend/src/routes/`)
- Mounted under `/api`:
  - `/api/schedules`
  - `/api/rooms` (with `/available` before `/:id`)
  - `/api/events` (with `/:id/register` and `/:id/cancel`)
  - `/api/announcements`
  - `/api/assignments`
  - `/api/agent/chat`

---

## 3. API Contract Alignment Matrix

| Domain | Route | Method | Payload / Params | Response |
|---|---|---|---|---|
| **Schedules** | `/schedules` | `GET` | `?day=&course=&instructor=` | `Schedule[]` |
| | `/schedules` | `POST` | `Omit<Schedule, 'id'>` | `Schedule` (status 201) |
| | `/schedules/:id` | `PUT` | `Partial<Schedule>` | `Schedule` |
| | `/schedules/:id` | `DELETE` | — | `{ success: true, message: string }` |
| **Rooms** | `/rooms` | `GET` | `?type=&min_capacity=&equipment=` | `Room[]` (with `bookings[]`) |
| | `/rooms/:id` | `GET` | — | `Room` |
| | `/rooms` | `POST` | `Partial<Room>` | `Room` (status 201) |
| | `/rooms/:id` | `PUT` | `Partial<Room>` | `Room` |
| | `/rooms/:id` | `DELETE` | — | `{ success: true, message: string }` |
| | `/rooms/available` | `GET` | `?date=&start_time=&end_time=&min_capacity=&type=&equipment=` | `Room[]` (with `bookings[]`) |
| | `/rooms/:id/book` | `POST` | `{ booked_by, date, start_time, end_time, purpose }` | `{ success: true, booking: Booking }` (status 201) |
| | `/rooms/:id/bookings/:booking_id` | `DELETE` | — | `{ success: true, message: string }` |
| **Events** | `/events` | `GET` | `?date=&name_contains=` | `Event[]` (with `registrations[]`) |
| | `/events` | `POST` | `Partial<Event>` | `Event` (status 201) |
| | `/events/:id` | `PUT` | `Partial<Event>` | `Event` |
| | `/events/:id` | `DELETE` | — | `{ success: true, message: string }` |
| | `/events/:id/register` | `POST` | `{ student_id, name }` | `{ success: true, event: Event, registration: Registration }` (status 201) |
| | `/events/:id/cancel` | `POST` | `{ student_id }` | `{ success: true, event: Event, cancelled_registration: Registration }` |
| **Announcements** | `/announcements` | `GET` | `?priority=&since=` | `Announcement[]` |
| | `/announcements` | `POST` | `Partial<Announcement>` | `Announcement` (status 201) |
| | `/announcements/:id` | `PUT` | `Partial<Announcement>` | `Announcement` |
| | `/announcements/:id` | `DELETE` | — | `{ success: true, message: string }` |
| **Assignments** | `/assignments` | `GET` | `?course=&status=&deadline_before=` | `Assignment[]` |
| | `/assignments` | `POST` | `Partial<Assignment>` | `Assignment` (status 201) |
| | `/assignments/:id` | `PUT` | `Partial<Assignment>` | `Assignment` |
| | `/assignments/:id` | `DELETE` | — | `{ success: true, message: string }` |
| **Agent Chat** | `/agent/chat` | `POST` | `{ message: string, history?: ChatTurn[] }` | `{ reply: string }` |
