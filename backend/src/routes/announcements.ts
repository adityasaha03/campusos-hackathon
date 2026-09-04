import { Router } from 'express';
import * as announcementController from '../controllers/announcementController';
import { validateBody } from '../middleware/validate';
import { createAnnouncementSchema, updateAnnouncementSchema } from '../validation/schemas';

const router = Router();

router.get('/', announcementController.getAllAnnouncements);
router.get('/:id', announcementController.getAnnouncementById);
router.post('/', validateBody(createAnnouncementSchema), announcementController.createAnnouncement);
router.put('/:id', validateBody(updateAnnouncementSchema), announcementController.updateAnnouncement);
router.delete('/:id', announcementController.deleteAnnouncement);

export default router;
