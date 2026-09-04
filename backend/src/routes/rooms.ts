import { Router } from 'express';
import * as roomController from '../controllers/roomController';
import { validateBody } from '../middleware/validate';
import { createRoomSchema, updateRoomSchema, bookRoomSchema } from '../validation/schemas';

const router = Router();

// List all rooms
router.get('/', roomController.getAllRooms);

// Available rooms - must be mounted BEFORE /:id
router.get('/available', roomController.getAvailableRooms);

// Single room by ID
router.get('/:id', roomController.getRoomById);

// Create room
router.post('/', validateBody(createRoomSchema), roomController.createRoom);

// Update room
router.put('/:id', validateBody(updateRoomSchema), roomController.updateRoom);

// Delete room
router.delete('/:id', roomController.deleteRoom);

// Book room
router.post('/:id/book', validateBody(bookRoomSchema), roomController.bookRoom);

// Cancel booking
router.delete('/:id/bookings/:booking_id', roomController.cancelRoomBooking);

export default router;
