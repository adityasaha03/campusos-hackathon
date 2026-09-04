import { Request, Response, NextFunction } from 'express';
import * as announcementService from '../services/announcementService';

export async function getAllAnnouncements(req: Request, res: Response, next: NextFunction) {
  try {
    const { priority, since } = req.query;
    const announcements = await announcementService.getAllAnnouncements({
      priority: priority as string | undefined,
      since: since as string | undefined,
    });
    res.json(announcements);
  } catch (err) {
    next(err);
  }
}

export async function getAnnouncementById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const announcement = await announcementService.getAnnouncementById(id);
    res.json(announcement);
  } catch (err) {
    next(err);
  }
}

export async function createAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const announcement = await announcementService.createAnnouncement(req.body);
    res.status(201).json(announcement);
  } catch (err) {
    next(err);
  }
}

export async function updateAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const updated = await announcementService.updateAnnouncement(id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await announcementService.deleteAnnouncement(id);
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (err) {
    next(err);
  }
}
