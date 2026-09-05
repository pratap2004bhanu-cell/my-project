import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import { configurePassport } from './config/passport.js';
import configureSocket from './socket/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import authRoutes from './routes/auth.js';
import activityRoutes from './routes/activities.js';
import userRoutes from './routes/users.js';
import messageRoutes from './routes/messages.js';
import notificationRoutes from './routes/notifications.js';
import communityRoutes from './routes/communities.js';
import draftRoutes from './routes/drafts.js';
import templateRoutes from './routes/templates.js';
import reportRoutes from './routes/reports.js';
import refreshActivityStatuses from './utils/lifecycle.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const allowed = process.env.FRONTEND_URL || 'http://localhost:5173';
      try {
        const host = new URL(origin).hostname;
        if (host === 'localhost' || host.endsWith('.lhr.life') || origin === allowed) return cb(null, true);
      } catch { /* ignore malformed origin */ }
      return cb(null, false);
    },
    credentials: true,
  },
});

// Connect to MongoDB
await connectDB();

// Configure Passport
configurePassport();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(passport.initialize());

// Rate limiting
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
app.use('/api', apiLimiter);
app.use('/auth', authLimiter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Configure Socket.io
configureSocket(io);

// Make io accessible to routes
app.set('io', io);

// Serve the built frontend in production
const distDir = path.join(__dirname, '..', 'dist');
if (process.env.NODE_ENV === 'production' && existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^\/(?!api|auth|uploads|socket.io).*/, (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
  console.log(`Serving frontend from ${distDir}`);
}

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Keep activity statuses (upcoming -> ongoing -> completed) fresh
refreshActivityStatuses(io).catch(() => {});
setInterval(() => refreshActivityStatuses(io).catch(() => {}), 10 * 60 * 1000);