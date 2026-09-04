import { Router } from 'express';
import * as assignmentController from '../controllers/assignmentController';
import { validateBody } from '../middleware/validate';
import { createAssignmentSchema, updateAssignmentSchema } from '../validation/schemas';

const router = Router();

router.get('/', assignmentController.getAllAssignments);
router.get('/:id', assignmentController.getAssignmentById);
router.post('/', validateBody(createAssignmentSchema), assignmentController.createAssignment);
router.put('/:id', validateBody(updateAssignmentSchema), assignmentController.updateAssignment);
router.delete('/:id', assignmentController.deleteAssignment);

export default router;
