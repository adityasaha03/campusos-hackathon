import { Router } from 'express';
import * as eventController from '../controllers/eventController';
import { validateBody } from '../middleware/validate';
import {
  createEventSchema,
  updateEventSchema,
  registerEventSchema,
  cancelEventRegistrationSchema,
} from '../validation/schemas';

const router = Router();

router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);
router.post('/', validateBody(createEventSchema), eventController.createEvent);
router.put('/:id', validateBody(updateEventSchema), eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);
router.post('/:id/register', validateBody(registerEventSchema), eventController.registerForEvent);
router.post('/:id/cancel', validateBody(cancelEventRegistrationSchema), eventController.cancelEventRegistration);

export default router;
