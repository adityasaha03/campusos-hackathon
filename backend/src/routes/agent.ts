import { Router, Request, Response, NextFunction } from 'express';
import { handleChatMessage } from '../services/gemini';

const router = Router();

// POST /api/agent/chat
router.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'message is required and must be a non-empty string' });
    }

    const reply = await handleChatMessage(message.trim(), history || []);
    return res.json({ reply });
  } catch (error: any) {
    console.error('❌ Error handling agent chat turn:', error);
    return next(error);
  }
});

export default router;
