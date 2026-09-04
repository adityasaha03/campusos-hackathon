import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import scheduleRoutes from './routes/schedules.js';
import roomRoutes from './routes/rooms';
import eventRoutes from './routes/events';
import announcementRoutes from './routes/announcements';
import assignmentRoutes from './routes/assignments';
import agentRoutes from './routes/agent';
import { errorHandler } from './middleware/errorHandler';

dotenv.config({ path: '../../.env' });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://campusos-hackathon-8rtyi500h-misfortune500.vercel.app';

// Middleware
const allowedOrigins = [
  FRONTEND_ORIGIN,
  'https://campusos-hackathon-8rtyi500h-misfortune500.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Domain API routes
app.use('/api/schedules', scheduleRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/agent', agentRoutes);

// Centralized error handling
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 CampusOS Backend API server running on port ${PORT}`);
    console.log(`📡 Base API URL: ${process.env.RENDER_EXTERNAL_URL || 'https://campusos-hackathon-1.onrender.com'}/api (Local: http://localhost:${PORT}/api)`);
  });
}

export default app;
