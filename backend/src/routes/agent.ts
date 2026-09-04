import { Router, Request, Response } from 'express';

const router = Router();

// Placeholder for Agent AI (Phase 4)
router.post('/chat', async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  // Agent AI will hook up gemini.ts here
  return res.json({
    reply: 'CampusOS AI Agent is being initialized in Phase 4.',
  });
});

export default router;
