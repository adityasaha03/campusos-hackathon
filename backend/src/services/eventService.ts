import prisma from '../models/prisma';
import { HttpError } from '../errors/HttpError';

export interface EventFilters {
  date?: string;
  name_contains?: string;
  status?: string;
}

export interface CreateEventInput {
  id?: string;
  name: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  end_date?: string;
  venue: string;
  organizer: string;
  capacity: number;
  registered?: number;
  status?: string;
}

export interface UpdateEventInput {
  name?: string;
  description?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  end_date?: string;
  venue?: string;
  organizer?: string;
  capacity?: number;
  registered?: number;
  status?: string;
}

export async function getAllEvents(filters?: EventFilters) {
  const where: any = {};

  if (filters?.date) {
    where.date = filters.date;
  }
  if (filters?.name_contains) {
    where.name = { contains: filters.name_contains, mode: 'insensitive' };
  }
  if (filters?.status) {
    where.status = { equals: filters.status, mode: 'insensitive' };
  }

  return prisma.event.findMany({
    where,
    include: {
      registrations: true,
    },
    orderBy: [
      { date: 'asc' },
      { start_time: 'asc' },
    ],
  });
}

export async function getEventById(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      registrations: true,
    },
  });
  if (!event) {
    throw new HttpError(404, `Event with id "${id}" not found`);
  }
  return event;
}

export async function createEvent(data: CreateEventInput) {
  const id = data.id || `evt-${Date.now()}`;
  return prisma.event.create({
    data: {
      id,
      name: data.name,
      description: data.description,
      date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      end_date: data.end_date || data.date,
      venue: data.venue,
      organizer: data.organizer,
      capacity: data.capacity,
      registered: data.registered || 0,
      status: data.status || 'upcoming',
    },
    include: {
      registrations: true,
    },
  });
}

export async function updateEvent(id: string, data: UpdateEventInput) {
  await getEventById(id);
  return prisma.event.update({
    where: { id },
    data,
    include: {
      registrations: true,
    },
  });
}

export async function deleteEvent(id: string) {
  await getEventById(id);
  return prisma.event.delete({
    where: { id },
  });
}

export async function registerForEvent(
  id: string,
  studentId?: string,
  studentName?: string
) {
  const event = await getEventById(id);

  const finalStudentId = studentId || process.env.DEFAULT_STUDENT_ID || '20-40532';
  const finalStudentName = studentName || process.env.DEFAULT_STUDENT_NAME || 'Sakibul Hassan';

  // Check if already registered
  const existingRegistration = event.registrations.find(
    (r) => r.student_id === finalStudentId
  );
  if (existingRegistration) {
    throw new HttpError(400, `Student ${finalStudentId} is already registered for this event`);
  }

  // Check capacity
  if (event.registered >= event.capacity || event.status === 'full') {
    throw new HttpError(
      400,
      `Event "${event.name}" is already at full capacity (${event.registered}/${event.capacity})`
    );
  }

  const updatedCount = event.registered + 1;
  const newStatus = updatedCount >= event.capacity ? 'full' : event.status;

  const result = await prisma.$transaction([
    prisma.registration.create({
      data: {
        event_id: id,
        student_id: finalStudentId,
        name: finalStudentName,
      },
    }),
    prisma.event.update({
      where: { id },
      data: {
        registered: updatedCount,
        status: newStatus,
      },
      include: {
        registrations: true,
      },
    }),
  ]);

  return {
    registration: result[0],
    event: result[1],
  };
}

export async function cancelEventRegistration(
  id: string,
  studentId?: string
) {
  const event = await getEventById(id);

  const finalStudentId = studentId || process.env.DEFAULT_STUDENT_ID || '20-40532';

  const existingRegistration = event.registrations.find(
    (r) => r.student_id === finalStudentId
  );
  if (!existingRegistration) {
    throw new HttpError(404, `No registration found for student ${finalStudentId} in event "${id}"`);
  }

  const updatedCount = Math.max(0, event.registered - 1);
  const newStatus = event.status === 'full' ? 'upcoming' : event.status;

  const result = await prisma.$transaction([
    prisma.registration.delete({
      where: {
        event_id_student_id: {
          event_id: id,
          student_id: finalStudentId,
        },
      },
    }),
    prisma.event.update({
      where: { id },
      data: {
        registered: updatedCount,
        status: newStatus,
      },
      include: {
        registrations: true,
      },
    }),
  ]);

  return {
    cancelled_registration: result[0],
    event: result[1],
  };
}
