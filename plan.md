 # CampusOS — Multi-Agent Build Plan
> Source documents: `PROBLEM_STATEMENT.md`, `prd.txt`, `README.md`, `SUBMISSION.md`, `schema/schema.md`, `sample_queries/sample_queries.md`, and the five real seed files (`schedules.json`, `rooms.json`, `events.json`, `announcements.json`, `assignments.json`).
> **⏰ Deadline: 8:30 PM, 4 September 2026 — today.** Hard cutoff. Everything is ordered so that if time runs out partway through, what's already done is still gradeable. Bonus deployment (Phase 9) only after Phases 0–8 are fully working.
> **Auth note:** There is no authentication system in the current schema. Do not build one. The human developer will instruct agents to add auth at the end if time allows. Until then, use `DEFAULT_STUDENT_ID` / `DEFAULT_STUDENT_NAME` from env to resolve "my next class" / "register me" — not a secret, safe to commit.
---
## How This Plan Is Structured
Four specialized agents work in **strict phase-gate order** — no agent starts a phase until every agent whose output that phase depends on has completed theirs. The dependency chain is:
``` Agent DB ──► Agent Backend ──► Agent AI
                     └──────────► Agent Frontend ```
Phase 0 (scaffolding) is done once by the human dev or one nominated agent before anyone else starts. After that, each agent works only in its own domain. They share the repo; they must never rename each other's files or alter each other's layer without a note in the plan.
---
## Roles
### Agent DB — Database Agent Owns everything in `backend/prisma/`. Responsible for the Prisma schema, migrations against Neon (PostgreSQL), and the seed script. All other agents read from the DB through services; only Agent DB writes schema changes.
**Stack context:** The database is **Neon** (serverless PostgreSQL). The `DATABASE_URL` is a Neon connection string. Neon does not require a local Postgres install — it's a hosted connection string that the agent uses directly with `npx prisma migrate dev` / `npx prisma db push`.
### Agent Backend — Backend API Agent Owns `backend/src/` — controllers, models, routes, and services. Produces the REST API that both the frontend and the AI agent consume. Business logic must live in `services/` only — this is the layer Agent AI will call directly, so correctness here is what keeps the dashboard and the agent in sync.
### Agent Frontend — Frontend Agent Owns `frontend/`. Builds the React + TypeScript dashboard: five domain pages, CRUD modals, and the chat panel. Consumes the REST API produced by Agent Backend. Has no direct access to the database.
### Agent AI — AI Integration Agent Owns `backend/src/services/gemini.ts` and the `POST /api/agent/chat` route. Builds the Gemini function-calling wrapper and the tool registry. Calls the **same service functions** Agent Backend wrote — does not write its own data-access logic. Has no direct access to the database.
---
## Rules (apply to all agents)
**One vocabulary everywhere.** `schema/schema.md`'s exact snake_case field names (`room_number`, `start_time`, `posted_by`, etc.) are used unchanged in the Prisma model, the API JSON request/response bodies, and the agent tool parameters. Do not translate to camelCase at any layer. A mismatch is the single fastest way to break the live-data requirement that is worth 10 of the 40 agent marks.
**MVC separation is enforced.** Controllers handle HTTP only. Business logic (availability checks, capacity checks, status transitions) lives exclusively in `services/`. Agent AI calls `services/`, not controllers, not Prisma directly. Agent Frontend calls REST endpoints, not services directly.
**Data integrity rules.** - Full CRUD on all five domains. Rooms additionally: book / cancel booking. Events additionally: register / cancel registration. - All changes persist to Neon — verify by hard-reloading the page after every mutation. - Frontend updates immediately after every mutation — no manual refresh. This is graded. - The AI agent queries current DB state on every turn. No caching a snapshot from earlier in the conversation. This is graded. - IDs from seed data are stable and are the primary keys — do not regenerate them on re-seed.
**Agent behavior (40 of 100 marks).** - Real Gemini function/tool calling only. Prose that describes an action instead of calling a tool does not count. - Never call a mutating tool with a guessed parameter — ask a clarifying question instead. - Refuse clearly on double-bookings, over-capacity registrations, and out-of-scope requests. Propose an alternative where possible. - Compose multiple read tools for cross-domain questions; do not add a bespoke tool per phrasing.
**When to ask the human for secrets.** - Do not ask for anything at Phase 0. All code can be written against `.env.example` placeholders. - **Agent DB asks for `DATABASE_URL` once**, right before the first `npx prisma migrate dev` / `npx prisma db push` in Phase 1. The value will be a Neon connection string. Do not run any migration before receiving it. - **Agent AI asks for `GEMINI_API_KEY` once**, right before the first live call to the Gemini API in Phase 4 — while writing the wrapper code, not while doing the first live test. - Never fabricate a key and try to run against it. - Never print a real secret value in chat, logs, or the README — reference `process.env.KEY_NAME` only. - `DEFAULT_STUDENT_ID` / `DEFAULT_STUDENT_NAME` are not secrets — commit them with real defaults.
---
## Phase 0 — Repo Scaffolding **Owner: Human dev (or one nominated agent, done once before all others start)**
- The repo root already has: `README.md`, `PROBLEM_STATEMENT.md`, `SUBMISSION.md`, `data/*.json`, `schema/schema.md`, `sample_queries/sample_queries.md`. - Add `backend/`, `frontend/`, and `.env.example` alongside them per **Data → Directory Structure**. - Populate `.env.example` with placeholders from **Data → Environment Variables**. - Make the initial commit. All four agents clone or pull from this state before starting Phase 1.
**Done when:** folder tree exists, `.env.example` is in the repo, initial commit is made, no real secrets are committed.
---
## Phase 1 — Database Layer **Owner: Agent DB** | *Agents Backend, Frontend, AI: blocked until Phase 1 is done*
**Agent DB tasks:** 1. Write `backend/prisma/schema.prisma` exactly as in **Data → Prisma Schema**. Field names are snake_case. Primary keys are the seed data's own stable IDs (`sch-001`, `room-001`, etc.). 2. **Ask the human for `DATABASE_URL`** (a Neon connection string) before running any Prisma command. 3. Run `npx prisma migrate dev --name init` (or `npx prisma db push` for rapid prototyping against Neon — either works, pick one and stay consistent). 4. Write `backend/prisma/seed.ts`:

- Parse the five JSON files from `data/`.

- Flatten `rooms[].bookings[]` into the `Booking` table (each booking gets its own row keyed on `booking_id`).

- Flatten `events[].registrations[]` into the `Registration` table (composite key `[event_id, student_id]`).

- Use `upsert` keyed on the stable string ID everywhere — never a row-count check. Re-running seed must be safe. 5. Run the seed. Verify counts: 24 schedules, 20 rooms, 7 events, 8 announcements, 8 assignments, plus existing bookings and registrations from the seed JSON. 6. Export the Prisma client instance from `backend/src/models/prisma.ts` — this is the only file Agent Backend's services import Prisma from.
**Done when:** migration applied on Neon, seed counts verified, `prisma.ts` exported. Agent DB signals completion so Agents Backend, Frontend, and AI can unblock.
---
## Phase 2 — Backend CRUD API **Owner: Agent Backend** | *Agents Frontend, AI: blocked until Phase 2 is done* | *Depends on: Phase 1*
**Agent Backend tasks:** 1. Set up `backend/src/index.ts`: Express server, CORS (`FRONTEND_ORIGIN` from env), JSON body parsing, centralized error-handling middleware (consistent `{ error: string, details?: any }` shape). 2. For each of the five domains, implement the full stack: `routes/` → `controllers/` → `services/` → Prisma (via `models/prisma.ts`).

- Request/response bodies match the seed JSON field names exactly — no renaming.

- Input validation with zod on all POST / PUT bodies. 3. **Extra actions** (also in `services/`, callable by Agent AI later):

- `POST /api/rooms/:id/book`: check overlap against existing bookings for the same room on the same date; reject if conflict. Insert into `Booking` table.

- `DELETE /api/rooms/:id/bookings/:booking_id`: remove the booking row.

- `POST /api/events/:id/register`: check `registered < capacity`; reject if full. Increment `registered`, insert `Registration` row, set `status` to `"full"` if `registered >= capacity` after increment.

- `POST /api/events/:id/cancel`: decrement `registered`, delete `Registration` row for `DEFAULT_STUDENT_ID`, restore `status` to `"upcoming"` if it was `"full"`. 4. `GET /api/rooms/available`: accepts `date`, `start_time`, `end_time`, `min_capacity?`, `type?`, `equipment?` (comma-separated). Returns rooms that pass all filters and have no overlapping booking. (Mount this route *before* `GET /api/rooms/:id` in Express so the literal path `"available"` isn't caught as an `:id` param.) 5. Smoke-test every route with curl or a REST client. Verify: a successful booking, a rejected double-booking, a successful registration, a rejected over-capacity registration.
**Done when:** all routes in **Data → API Surface** respond correctly. Signal completion so Agents Frontend and AI can unblock.
---
## Phase 3 — Frontend Dashboard **Owner: Agent Frontend** | *Depends on: Phase 2*
**Agent Frontend tasks:** 1. Bootstrap with Vite + React + TypeScript. Install TanStack Query for data fetching/cache invalidation. 2. Create `frontend/src/services/api.ts`: a single Axios (or fetch) client pointed at `VITE_API_URL` (env var, default `http://localhost:4000/api`). One file per domain that wraps the relevant endpoints. 3. Build six pages: Schedules, Rooms, Events, Announcements, Assignments, Chat. 4. Each domain page: a list/table of records, an **Add** modal, an **Edit** modal, a **Delete** with confirmation. After every mutation, `invalidateQueries` so the list refetches — no manual page reload ever required. 5. **Rooms page extras:** a **Book** action per room (date picker, time range, posts to `/rooms/:id/book`); a collapsible booking list per room with a **Cancel** button per booking. 6. **Events page extras:** show `registered / capacity`. A **Register** button (posts to `/events/:id/register`); a **Cancel Registration** button if already registered. Disable Register if `status === "full"`. 7. **Chat page:** message list (user + agent turns), text input, calls `POST /api/agent/chat` with `{ message, history }`, appends the reply. History is kept in component state — the full prior turns array is sent each time. 8. Keep the UI clean and functional. A table with working modals beats a broken layout with animations. The UI/UX line item is 20 of 100 marks; correctness is what unlocks the other 80.
**Done when:** add/edit/delete/book/register all reflect instantly and survive a hard reload. Chat page sends and receives messages.
---
## Phase 4 — AI Agent (Function Calling) **Owner: Agent AI** | *Depends on: Phase 2*
**Agent AI tasks:** 1. Write `backend/src/services/gemini.ts`:

- Initialise the Gemini SDK (`@google/generative-ai`).

- Define the tool/function schema registry (see **Data → Agent Tool Schema**). Each tool maps directly to a service function from Agent Backend's `services/` — import and call those functions, do not write new data-access code.

- Implement the tool-call loop: send message + tools to Gemini → if the model returns a `function_call` part, execute the corresponding service function, collect the result → send back as a `function_response` part → repeat until the model returns text → return that text. 2. **Ask the human for `GEMINI_API_KEY`** before writing the first live call (while writing the code, not during testing). 3. Write the system prompt (inline string in `gemini.ts`):

- Always call a read tool before answering a factual question — never answer from training knowledge.

- Combine multiple read tools for cross-domain questions (e.g. schedule + events for "anything on campus I could drop into").

- Before calling a mutating tool, resolve a named entity (room number, event name) to its ID via a read tool.

- Never call a mutating tool with a guessed parameter — ask a clarifying question in plain text instead.

- Refuse clearly on: double-bookings (surface the existing booking detail), over-capacity registrations (state capacity and current count), anything outside the five domains.

- `register_for_event` and `cancel_event_registration` use `DEFAULT_STUDENT_ID`/`DEFAULT_STUDENT_NAME` from env — there is no login system, do not invent one. 4. Add `POST /api/agent/chat` route in `backend/src/routes/agent.ts`. Body: `{ message: string, history?: { role: "user"|"model", parts: any[] }[] }`. Response: `{ reply: string }`. 5. Smoke-test: ask "What classes do I have on Wednesday?" — verify via server logs that `get_schedule` was actually called, not just that the reply looks plausible.
**Done when:** the agent answers a simple factual question via a real, logged tool call. Signal completion so Phase 5 can proceed.
---
## Phase 5 — Integration & Data-Sync Proof **Owner: All agents verify together** | *Depends on: Phases 3 and 4*
1. Run backend and frontend together. Confirm all five domain pages load real data from Neon. 2. **Data-sync proof** (directly graded — `sample_queries.md` states judges will do this mid-evaluation):

- Open the Announcements page. Edit `ann-001` ("CSE 4113 Class Rescheduled") — change the body to something different, e.g. update the room or time.

- Immediately open the Chat page. Ask "Where is my CSE 4113 class this Sunday?"

- The agent's answer must reflect the edit with no restart, no cache clear, no artificial delay. 3. This must work every time, not just once.
**Done when:** the data-sync proof passes consistently.
---
## Phase 6 — Sample Query Verification **Owner: Agent AI verifies; Agent Backend and Agent Frontend fix any failures**
Run every query from `sample_queries/sample_queries.md` (the full list is in **Data → Sample Queries to Satisfy**). For each, confirm the expected behavior class.
Also run at least one improvised vague mutating request ("just book me any room tomorrow") and one out-of-scope request — confirm the agent asks / refuses. These behaviors are 10 of the agent's 40 marks even though they don't appear explicitly in the sample query list.
**Done when:** all nine sample queries pass, Phase 5 data-sync proof holds, and the clarify/refuse behaviors work.
---
## Phase 7 — README and Submission Checklist **Owner: Human dev, with Agent Backend providing the exact commands**
Replace `README.md` content (currently the hackathon's fork/participation guide — no longer needed) with the submission README. Per `SUBMISSION.md` it must contain exactly: 1. Project overview — one paragraph on what was built and how it works 2. Tech stack — Node.js/Express/TypeScript, React/TypeScript, Google Gemini, Neon PostgreSQL via Prisma 3. Setup instructions — exact commands to install and start backend and frontend 4. Environment variables — every required key, referencing `.env.example`, no real keys committed 5. How to use the agent — a short note on what kinds of questions to ask
Run through `SUBMISSION.md`'s own checklist: - [ ] Repo is public - [ ] All five data sections visible in the dashboard - [ ] Add/edit/delete work for all five and persist after reload - [ ] README has working local setup steps - [ ] No API keys committed
**Done when:** every box is checked. Repo visibility toggle and form submission are human owner tasks.
---
## Phase 8 — Deployment (Bonus, time-permitting only) **Owner: Human dev**
Deploy backend + Neon on Render/Railway/Fly.io (Neon is already hosted — just provide the same `DATABASE_URL`). Deploy frontend on Vercel/Netlify. All config via env vars, no hardcoded URLs.
**Skip entirely if Phase 7 finishes with little time left.** A broken deploy link is worse than no deploy link.
---
## Data
### Directory Structure ``` campusos-hackathon/ ├── README.md







 # replace content in Phase 7 ├── PROBLEM_STATEMENT.md ├── SUBMISSION.md ├── data/ │
 ├── schedules.json



# 24 records │
 ├── rooms.json





# 20 records │
 ├── events.json




 # 7 records │
 ├── announcements.json

# 8 records │
 └── assignments.json


# 8 records ├── schema/ │
 └── schema.md ├── sample_queries/ │
 └── sample_queries.md ├── backend/ │
 ├── prisma/ │
 │
 ├── schema.prisma

 # Agent DB owns this │
 │
 └── seed.ts




 # Agent DB owns this │
 ├── src/ │
 │
 ├── controllers/


# Agent Backend owns this │
 │
 ├── models/ │
 │
 │
 └── prisma.ts

 # Agent DB writes, Agent Backend reads │
 │
 ├── routes/




 # Agent Backend owns this │
 │
 │
 └── agent.ts


# Agent AI owns this file │
 │
 ├── services/



 # Agent Backend writes; Agent AI reads and calls │
 │
 │
 └── gemini.ts

 # Agent AI owns this file │
 │
 └── index.ts




# Agent Backend owns this ├── frontend/ │
 ├── src/ │
 │
 ├── components/


 # Agent Frontend owns this │
 │
 ├── pages/





# Agent Frontend owns this │
 │
 ├── services/



 # Agent Frontend owns this │
 │
 └── App.tsx




 # Agent Frontend owns this └── .env.example ```
### Environment Variables (`.env.example`) ``` # Neon PostgreSQL connection string — Agent DB asks for this before Phase 1 migration DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/campusos?sslmode=require"
# Google Gemini API key — Agent AI asks for this before Phase 4 live testing GEMINI_API_KEY="your-key-here"
PORT=4000 FRONTEND_ORIGIN="http://localhost:5173"
# NOT a secret — safe to commit. Resolves "my next class" / "register me". # 20-40532 / Sakibul Hassan recurs as a registrant in the seed events data. DEFAULT_STUDENT_ID="20-40532" DEFAULT_STUDENT_NAME="Sakibul Hassan" ```
### Domain Schema (from `schema/schema.md` — authoritative, exact field names)
**Schedules:** `id, course, title, day, start_time, end_time, room, instructor, section` **Rooms:** `id, room_number, type, capacity, equipment[], floor, status, bookings[]` → each booking: `booking_id, booked_by, date, start_time, end_time, purpose` **Events:** `id, name, description, date, start_time, end_time, end_date, venue, organizer, capacity, registered, registrations[], status` → each registration: `student_id, name` **Announcements:** `id, title, body, date, priority, posted_by, expires` **Assignments:** `id, course, course_title, title, description, assigned_date, deadline, submission_platform, status, marks`
Enum values: `day` = Sunday–Thursday (no Fri/Sat); `room.type` = classroom / lab / seminar; `room.status` = available / unavailable; `event.status` = upcoming / ongoing / completed / cancelled / full; `announcement.priority` = high / medium / low; `assignment.status` = pending / submitted / graded / late.
**Data quality note:** `schedules.json` references rooms `7C07` (sch-011, sch-012) and `9A05` (sch-020) that do not exist in `rooms.json`. `Schedule.room` is a plain string (not a foreign key), so inserts succeed — but any cross-reference against the `Room` table must handle a lookup miss gracefully.
### Prisma Schema ```prisma model Schedule {
 id



 String @id
 course

 String
 title


String
 day



String
 start_time String
 end_time
 String
 room


 String
 instructor String
 section

String

@@map("schedules") }
model Room {
 id




String

@id
 room_number String

@unique
 type



String
 capacity

Int
 equipment
 String[]
 floor


 Int
 status


String
 bookings

Booking[]

@@map("rooms") }
model Booking {
 booking_id String @id
 room_id

String
 room


 Room
 @relation(fields: [room_id], references: [id])
 booked_by
String
 date


 String
 start_time String
 end_time
 String
 purpose

String

@@map("bookings") }
model Event {
 id





String



 @id
 name




String
 description
 String
 date




String
 start_time

String
 end_time


String
 end_date


String
 venue



 String
 organizer

 String
 capacity


Int
 registered

Int





@default(0)
 status



String
 registrations Registration[]

@@map("events") }
model Registration {
 event_id
 String
 event


Event
@relation(fields: [event_id], references: [id])
 student_id String
 name


 String

@@id([event_id, student_id])
 @@map("registrations") }
model Announcement {
 id



String @id
 title

 String
 body


String
 date


String
 priority
String
 posted_by String
 expires
 String

@@map("announcements") }
model Assignment {
 id








String @id
 course






String
 course_title



String
 title






 String
 description



 String
 assigned_date


 String
 deadline





String
 submission_platform String
 status






String
 marks






 Int

@@map("assignments") } ```
### API Surface Base path: `/api`. All query params are snake_case.
| Domain | Routes | |---|---| | Schedules | `GET /schedules` `GET /schedules/:id` `POST /schedules` `PUT /schedules/:id` `DELETE /schedules/:id` | | Rooms | `GET /rooms` `GET /rooms/:id` `POST /rooms` `PUT /rooms/:id` `DELETE /rooms/:id` `GET /rooms/available?date=&start_time=&end_time=&min_capacity=&type=&equipment=` `POST /rooms/:id/book` `DELETE /rooms/:id/bookings/:booking_id` | | Events | `GET /events` `GET /events/:id` `POST /events` `PUT /events/:id` `DELETE /events/:id` `POST /events/:id/register` `POST /events/:id/cancel` | | Announcements | `GET /announcements` `GET /announcements/:id` `POST /announcements` `PUT /announcements/:id` `DELETE /announcements/:id` | | Assignments | `GET /assignments` `GET /assignments/:id` `POST /assignments` `PUT /assignments/:id` `DELETE /assignments/:id` | | Agent | `POST /agent/chat` |
### Agent Tool Schema (owned by Agent AI, calls Agent Backend's services)
| Tool | Purpose | Key params | |---|---|---| | `get_schedule` | list schedule entries | `day?`, `course?`, `instructor?` | | `get_assignments` | list assignments | `course?`, `status?`, `deadline_before?` | | `get_announcements` | list announcements | `priority?`, `since?` | | `get_events` | list/search events | `date?`, `name_contains?` | | `get_rooms` | list/filter rooms | `type?`, `min_capacity?`, `equipment?[]` | | `check_room_availability` | is a room free for a window | `room_number`, `date`, `start_time`, `end_time` | | `book_room` | create a booking | `room_number`, `date`, `start_time`, `end_time`, `purpose?`, `booked_by?` | | `cancel_room_booking` | remove a booking | `booking_id` | | `register_for_event` | register the default student | `event_id` | | `cancel_event_registration` | cancel the default student's registration | `event_id` |
Mutating tools (`book_room`, `cancel_room_booking`, `register_for_event`, `cancel_event_registration`) must never be called with a guessed parameter.
### Sample Queries to Satisfy *(full list from `sample_queries/sample_queries.md`)*
**Simple Lookups** 1. "When is my next class?" → `get_schedule` 2. "What classes do I have on Wednesday?" → `get_schedule(day="Wednesday")` 3. "What assignments do I have due this week?" → `get_assignments(deadline_before=<end of week>)` 4. "Show me all high priority announcements." → `get_announcements(priority="high")`
**Multi-Source Reasoning** 5. "I'm free until 2 PM — is there anything on campus I could drop into?" → `get_schedule` + `get_events`, cross-referenced 6. "Which labs have a projector and can fit at least 30 people?" → `get_rooms(type="lab", min_capacity=30, equipment=["projector"])`
**Actions** 7. "Book Room 7A02 tomorrow from 3 PM to 5 PM." → `check_room_availability` then `book_room` 8. "Register me for the Guest Lecture on Deep Learning." → `get_events(name_contains="Deep Learning")` to resolve to `evt-002`, then `register_for_event` 9. "I need a room for 5 people with a projector, tomorrow between 2 and 4." → `get_rooms` filtered, then `check_room_availability`, then present/book
Judges will also edit data through the dashboard mid-evaluation and immediately ask the agent about the change (see Phase 5).
### Scoring Rubric
| Criteria | Marks | |---|---| | Data Management | 20 | | CRUD Operations (persist correctly) | 20 | | AI Agent — correct answers | 10 | | AI Agent — correct actions | 10 | | AI Agent — always latest data | 10 | | AI Agent — vague/unauthorized handling | 10 | | UI/UX and Design | 20 | | **Total** | **100** | | Bonus: live deployment, clean/readable code | — |
