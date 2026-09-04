import prisma from '../models/prisma';
import { HttpError } from '../errors/HttpError';

export interface AnnouncementFilters {
  priority?: string;
  since?: string;
}

export interface CreateAnnouncementInput {
  id?: string;
  title: string;
  body: string;
  date: string;
  priority: string;
  posted_by: string;
  expires: string;
}

export interface UpdateAnnouncementInput {
  title?: string;
  body?: string;
  date?: string;
  priority?: string;
  posted_by?: string;
  expires?: string;
}

export async function getAllAnnouncements(filters?: AnnouncementFilters) {
  const where: any = {};

  if (filters?.priority) {
    where.priority = { equals: filters.priority, mode: 'insensitive' };
  }
  if (filters?.since) {
    where.date = { gte: filters.since };
  }

  return prisma.announcement.findMany({
    where,
    orderBy: {
      date: 'desc',
    },
  });
}

export async function getAnnouncementById(id: string) {
  const announcement = await prisma.announcement.findUnique({
    where: { id },
  });
  if (!announcement) {
    throw new HttpError(404, `Announcement with id "${id}" not found`);
  }
  return announcement;
}

export async function createAnnouncement(data: CreateAnnouncementInput) {
  const id = data.id || `ann-${Date.now()}`;
  return prisma.announcement.create({
    data: {
      id,
      title: data.title,
      body: data.body,
      date: data.date,
      priority: data.priority,
      posted_by: data.posted_by,
      expires: data.expires,
    },
  });
}

export async function updateAnnouncement(id: string, data: UpdateAnnouncementInput) {
  await getAnnouncementById(id);
  return prisma.announcement.update({
    where: { id },
    data,
  });
}

export async function deleteAnnouncement(id: string) {
  await getAnnouncementById(id);
  return prisma.announcement.delete({
    where: { id },
  });
}
