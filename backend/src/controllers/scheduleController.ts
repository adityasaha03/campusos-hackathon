import { Request, Response, NextFunction } from 'express';
import * as scheduleService from '../services/scheduleService';

export async function getAllSchedules(req: Request, res: Response, next: NextFunction) {
  try {
    const { day, course, instructor, room } = req.query;
    const schedules = await scheduleService.getAllSchedules({
      day: day as string | undefined,
      course: course as string | undefined,
      instructor: instructor as string | undefined,
      room: room as string | undefined,
    });
    res.json(schedules);
  } catch (err) {
    next(err);
  }
}

export async function getScheduleById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const schedule = await scheduleService.getScheduleById(id);
    res.json(schedule);
  } catch (err) {
    next(err);
  }
}

export async function createSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const schedule = await scheduleService.createSchedule(req.body);
    res.status(201).json(schedule);
  } catch (err) {
    next(err);
  }
}

export async function updateSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const updated = await scheduleService.updateSchedule(id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await scheduleService.deleteSchedule(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
