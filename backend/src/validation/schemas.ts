import { z } from 'zod';

export const createScheduleSchema = z.object({
  id: z.string().optional(),
  course: z.string().min(1, 'Course is required'),
  title: z.string().min(1, 'Title is required'),
  day: z.enum(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'start_time must be HH:MM'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'end_time must be HH:MM'),
  room: z.string().min(1, 'Room is required'),
  instructor: z.string().min(1, 'Instructor is required'),
  section: z.string().min(1, 'Section is required'),
});

export const updateScheduleSchema = createScheduleSchema.partial();

export const createRoomSchema = z.object({
  id: z.string().optional(),
  room_number: z.string().min(1, 'room_number is required'),
  type: z.enum(['classroom', 'lab', 'seminar']),
  capacity: z.number().int().positive('capacity must be a positive integer'),
  equipment: z.array(z.string()).default([]),
  floor: z.number().int(),
  status: z.enum(['available', 'unavailable']),
});

export const updateRoomSchema = createRoomSchema.partial();

export const bookRoomSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'start_time must be HH:MM'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'end_time must be HH:MM'),
  booked_by: z.string().optional().default('Sakibul Hassan'),
  purpose: z.string().optional().default('General study / meeting'),
});

export const createEventSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'name is required'),
  description: z.string().min(1, 'description is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'start_time must be HH:MM'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'end_time must be HH:MM'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'end_date must be YYYY-MM-DD').optional(),
  venue: z.string().min(1, 'venue is required'),
  organizer: z.string().min(1, 'organizer is required'),
  capacity: z.number().int().positive('capacity must be a positive integer'),
  registered: z.number().int().nonnegative().optional().default(0),
  status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled', 'full']).optional().default('upcoming'),
});

export const updateEventSchema = createEventSchema.partial();

export const registerEventSchema = z.object({
  student_id: z.string().optional(),
  name: z.string().optional(),
});

export const cancelEventRegistrationSchema = z.object({
  student_id: z.string().optional(),
});

export const createAnnouncementSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'title is required'),
  body: z.string().min(1, 'body is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  priority: z.enum(['high', 'medium', 'low']),
  posted_by: z.string().min(1, 'posted_by is required'),
  expires: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expires must be YYYY-MM-DD'),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

export const createAssignmentSchema = z.object({
  id: z.string().optional(),
  course: z.string().min(1, 'course is required'),
  course_title: z.string().min(1, 'course_title is required'),
  title: z.string().min(1, 'title is required'),
  description: z.string().min(1, 'description is required'),
  assigned_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'assigned_date must be YYYY-MM-DD'),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'deadline must be YYYY-MM-DD'),
  submission_platform: z.string().min(1, 'submission_platform is required'),
  status: z.enum(['pending', 'submitted', 'graded', 'late']),
  marks: z.number().int().nonnegative('marks must be a non-negative integer'),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();
