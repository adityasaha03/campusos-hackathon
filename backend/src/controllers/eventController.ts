import { Request, Response, NextFunction } from 'express';
import * as eventService from '../services/eventService';

export async function getAllEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const { date, name_contains, status } = req.query;
    const events = await eventService.getAllEvents({
      date: date as string | undefined,
      name_contains: name_contains as string | undefined,
      status: status as string | undefined,
    });
    res.json(events);
  } catch (err) {
    next(err);
  }
}

export async function getEventById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const event = await eventService.getEventById(id);
    res.json(event);
  } catch (err) {
    next(err);
  }
}

export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const event = await eventService.createEvent(req.body);
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
}

export async function updateEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const updated = await eventService.updateEvent(id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await eventService.deleteEvent(id);
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function registerForEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { student_id, name } = req.body || {};
    const result = await eventService.registerForEvent(id, student_id, name);
    res.status(201).json({
      success: true,
      event: result.event,
      registration: result.registration,
      message: 'Registered for event successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelEventRegistration(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { student_id } = req.body || {};
    const result = await eventService.cancelEventRegistration(id, student_id);
    res.json({
      success: true,
      event: result.event,
      cancelled_registration: result.cancelled_registration,
      message: 'Event registration cancelled successfully',
    });
  } catch (err) {
    next(err);
  }
}
