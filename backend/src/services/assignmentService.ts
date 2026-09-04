import prisma from '../models/prisma';
import { HttpError } from '../errors/HttpError';

export interface AssignmentFilters {
  course?: string;
  status?: string;
  deadline_before?: string;
}

export interface CreateAssignmentInput {
  id?: string;
  course: string;
  course_title: string;
  title: string;
  description: string;
  assigned_date: string;
  deadline: string;
  submission_platform: string;
  status: string;
  marks: number;
}

export interface UpdateAssignmentInput {
  course?: string;
  course_title?: string;
  title?: string;
  description?: string;
  assigned_date?: string;
  deadline?: string;
  submission_platform?: string;
  status?: string;
  marks?: number;
}

export async function getAllAssignments(filters?: AssignmentFilters) {
  const where: any = {};

  if (filters?.course) {
    where.course = { contains: filters.course, mode: 'insensitive' };
  }
  if (filters?.status) {
    where.status = { equals: filters.status, mode: 'insensitive' };
  }
  if (filters?.deadline_before) {
    where.deadline = { lte: filters.deadline_before };
  }

  return prisma.assignment.findMany({
    where,
    orderBy: {
      deadline: 'asc',
    },
  });
}

export async function getAssignmentById(id: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id },
  });
  if (!assignment) {
    throw new HttpError(404, `Assignment with id "${id}" not found`);
  }
  return assignment;
}

export async function createAssignment(data: CreateAssignmentInput) {
  const id = data.id || `asgn-${Date.now()}`;
  return prisma.assignment.create({
    data: {
      id,
      course: data.course,
      course_title: data.course_title,
      title: data.title,
      description: data.description,
      assigned_date: data.assigned_date,
      deadline: data.deadline,
      submission_platform: data.submission_platform,
      status: data.status,
      marks: data.marks,
    },
  });
}

export async function updateAssignment(id: string, data: UpdateAssignmentInput) {
  await getAssignmentById(id);
  return prisma.assignment.update({
    where: { id },
    data,
  });
}

export async function deleteAssignment(id: string) {
  await getAssignmentById(id);
  return prisma.assignment.delete({
    where: { id },
  });
}
