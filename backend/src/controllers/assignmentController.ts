import { Request, Response, NextFunction } from 'express';
import * as assignmentService from '../services/assignmentService';

export async function getAllAssignments(req: Request, res: Response, next: NextFunction) {
  try {
    const { course, status, deadline_before } = req.query;
    const assignments = await assignmentService.getAllAssignments({
      course: course as string | undefined,
      status: status as string | undefined,
      deadline_before: deadline_before as string | undefined,
    });
    res.json(assignments);
  } catch (err) {
    next(err);
  }
}

export async function getAssignmentById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const assignment = await assignmentService.getAssignmentById(id);
    res.json(assignment);
  } catch (err) {
    next(err);
  }
}

export async function createAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const assignment = await assignmentService.createAssignment(req.body);
    res.status(201).json(assignment);
  } catch (err) {
    next(err);
  }
}

export async function updateAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const updated = await assignmentService.updateAssignment(id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await assignmentService.deleteAssignment(id);
    res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (err) {
    next(err);
  }
}
