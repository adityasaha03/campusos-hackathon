import prisma from '../models/prisma';
import { HttpError } from '../errors/HttpError';

export interface ScheduleFilters {
  day?: string;
  course?: string;
  instructor?: string;
  room?: string;
}

export interface CreateScheduleInput {
  id?: string;
  course: string;
  title: string;
  day: string;
  start_time: string;
  end_time: string;
  room: string;
  instructor: string;
  section: string;
}

export interface UpdateScheduleInput {
  course?: string;
  title?: string;
  day?: string;
  start_time?: string;
  end_time?: string;
  room?: string;
  instructor?: string;
  section?: string;
}

export async function getAllSchedules(filters?: ScheduleFilters) {
  const where: any = {};

  if (filters?.day) {
    where.day = { equals: filters.day, mode: 'insensitive' };
  }
  if (filters?.course) {
    where.course = { contains: filters.course, mode: 'insensitive' };
  }
  if (filters?.instructor) {
    where.instructor = { contains: filters.instructor, mode: 'insensitive' };
  }
  if (filters?.room) {
    where.room = { equals: filters.room, mode: 'insensitive' };
  }

  return prisma.schedule.findMany({
    where,
    orderBy: [
      { day: 'asc' },
      { start_time: 'asc' },
    ],
  });
}

export async function getScheduleById(id: string) {
  const schedule = await prisma.schedule.findUnique({
    where: { id },
  });
  if (!schedule) {
    throw new HttpError(404, `Schedule with id "${id}" not found`);
  }
  return schedule;
}

export async function createSchedule(data: CreateScheduleInput) {
  const id = data.id || `sch-${Date.now()}`;
  return prisma.schedule.create({
    data: {
      id,
      course: data.course,
      title: data.title,
      day: data.day,
      start_time: data.start_time,
      end_time: data.end_time,
      room: data.room,
      instructor: data.instructor,
      section: data.section,
    },
  });
}

export async function updateSchedule(id: string, data: UpdateScheduleInput) {
  await getScheduleById(id);
  return prisma.schedule.update({
    where: { id },
    data,
  });
}

export async function deleteSchedule(id: string) {
  await getScheduleById(id);
  return prisma.schedule.delete({
    where: { id },
  });
}
