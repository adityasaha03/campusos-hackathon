import { Router } from 'express';
import * as scheduleController from '../controllers/scheduleController';
import { validateBody } from '../middleware/validate';
import { createScheduleSchema, updateScheduleSchema } from '../validation/schemas';

const router = Router();

router.get('/', scheduleController.getAllSchedules);
router.get('/:id', scheduleController.getScheduleById);
router.post('/', validateBody(createScheduleSchema), scheduleController.createSchedule);
router.put('/:id', validateBody(updateScheduleSchema), scheduleController.updateSchedule);
router.delete('/:id', scheduleController.deleteSchedule);

export default router;
