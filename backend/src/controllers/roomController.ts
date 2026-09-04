import { Request, Response, NextFunction } from 'express';
import * as roomService from '../services/roomService';
import { HttpError } from '../errors/HttpError';

export async function getAllRooms(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, min_capacity, equipment } = req.query;
    let equipmentList: string[] | undefined;
    if (typeof equipment === 'string') {
      equipmentList = equipment.split(',').map((e) => e.trim()).filter(Boolean);
    } else if (Array.isArray(equipment)) {
      equipmentList = equipment.map(String);
    }

    const rooms = await roomService.getAllRooms({
      type: type as string | undefined,
      min_capacity: min_capacity ? Number(min_capacity) : undefined,
      equipment: equipmentList,
    });
    res.json(rooms);
  } catch (err) {
    next(err);
  }
}

export async function getAvailableRooms(req: Request, res: Response, next: NextFunction) {
  try {
    const { date, start_time, end_time, min_capacity, type, equipment } = req.query;

    if (!date || !start_time || !end_time) {
      throw new HttpError(400, 'date, start_time, and end_time query parameters are required');
    }

    let equipmentList: string[] | undefined;
    if (typeof equipment === 'string') {
      equipmentList = equipment.split(',').map((e) => e.trim()).filter(Boolean);
    } else if (Array.isArray(equipment)) {
      equipmentList = equipment.map(String);
    }

    const availableRooms = await roomService.getAvailableRooms({
      date: String(date),
      start_time: String(start_time),
      end_time: String(end_time),
      min_capacity: min_capacity ? Number(min_capacity) : undefined,
      type: type as string | undefined,
      equipment: equipmentList,
    });
    res.json(availableRooms);
  } catch (err) {
    next(err);
  }
}

export async function getRoomById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const room = await roomService.getRoomById(id);
    res.json(room);
  } catch (err) {
    next(err);
  }
}

export async function createRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const room = await roomService.createRoom(req.body);
    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
}

export async function updateRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const updated = await roomService.updateRoom(id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await roomService.deleteRoom(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function bookRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const booking = await roomService.bookRoom(id, req.body);
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
}

export async function cancelRoomBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, booking_id } = req.params;
    await roomService.cancelRoomBooking(booking_id, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
