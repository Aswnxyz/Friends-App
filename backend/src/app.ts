import express, { Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import eventsRoutes from './routes/events.routes';
import celebrityRoutes from './routes/celebrity.routes';
import supportRoutes from './routes/support.routes';
import adminRoutes from './routes/admin.routes';
import callsRoutes from './routes/calls.routes';
import {
  authenticateJWT,
  AuthenticatedRequest,
} from './middleware/auth.middleware';
import { db } from './store/datastore';
import { CallSession } from './types/models';

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Friends App Unified API & WebRTC Signaling Server',
    supportedRoles: [
      'USER',
      'CELEBRITY',
      'ORGANIZATION',
      'SUPPORT',
      'SUPER_ADMIN',
    ],
    supportedCallTypes: [
      'RANDOM_AUDIO',
      'RANDOM_VIDEO',
      'CELEBRITY_AUDIO',
      'CELEBRITY_VIDEO',
      'SUPPORT_AUDIO',
    ],
  });
});

// Mount Core Role Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/celebrities', celebrityRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/calls', callsRoutes);

/**
 * POST /api/random/match
 * REST endpoint for initiating/matching a Random Friend Call in either AUDIO (`RANDOM_AUDIO`) or VIDEO (`RANDOM_VIDEO`) mode
 */
app.post(
  '/api/random/match',
  authenticateJWT,
  (req: AuthenticatedRequest, res: Response): void => {
    const caller = req.user!;
    const { mode = 'AUDIO' } = req.body as { mode?: 'AUDIO' | 'VIDEO' };

    const isVideo = mode === 'VIDEO';
    const restrictionType = isVideo ? 'BAN_RANDOM_VIDEO' : 'BAN_RANDOM_AUDIO';
    const restriction = db.hasActiveRestriction(caller.id, restrictionType);

    if (restriction) {
      res.status(403).json({
        error: `Random ${isVideo ? 'Video' : 'Audio'} Connect is restricted on your account: ${restriction.reason}`,
        code: restrictionType,
      });
      return;
    }

    // Find another active Normal User to pair with
    const candidates = Array.from(db.users.values()).filter(
      (u) =>
        u.role === 'USER' &&
        u.id !== caller.id &&
        u.status === 'ACTIVE' &&
        !db.hasActiveRestriction(u.id, restrictionType)
    );

    const matchedFriend =
      candidates[Math.floor(Math.random() * candidates.length)] || {
        id: 'usr-online-friend',
        displayName: 'Vishnu Menon',
        city: 'Kochi',
        language: 'Malayalam',
        avatarUrl:
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200',
      };

    const callType = isVideo ? 'RANDOM_VIDEO' : 'RANDOM_AUDIO';
    const roomId = `random-${mode.toLowerCase()}-${Date.now()}`;

    const session: CallSession = {
      id: `rnd-${Date.now()}`,
      callType,
      callerId: caller.id,
      callerName: caller.displayName,
      callerRole: 'USER',
      receiverId: matchedFriend.id,
      receiverName: matchedFriend.displayName,
      receiverRole: 'USER',
      roomId,
      status: 'ACTIVE',
      startedAt: new Date().toISOString(),
      durationSeconds: 0,
      coinsCharged: 0,
    };

    db.callSessions.set(session.id, session);

    res.status(201).json({
      success: true,
      callSession: session,
      matchedFriend: {
        id: matchedFriend.id,
        displayName: matchedFriend.displayName,
        city: matchedFriend.city,
        language: matchedFriend.language,
        avatarUrl: matchedFriend.avatarUrl,
      },
    });
  }
);

export default app;
