import { Router, Response } from 'express';
import { db } from '../store/datastore';
import {
  authenticateJWT,
  AuthenticatedRequest,
} from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/calls/my-calls
 * Returns incoming (RINGING) and active (ACTIVE) calls for the logged-in user.
 * - For SUPPORT role: returns any RINGING or ACTIVE SUPPORT_AUDIO call assigned to them or any support agent.
 * - For CELEBRITY / USER: returns any RINGING or ACTIVE call where they are caller or receiver.
 */
router.get(
  '/my-calls',
  authenticateJWT,
  (req: AuthenticatedRequest, res: Response): void => {
    const user = req.user!;
    const allCalls = Array.from(db.callSessions.values());

    const activeOrRinging = allCalls.filter((c) => {
      if (c.status !== 'RINGING' && c.status !== 'ACTIVE') return false;

      if (user.role === 'SUPPORT' && c.callType === 'SUPPORT_AUDIO') {
        return true;
      }

      return c.callerId === user.id || c.receiverId === user.id;
    });

    // Sort newest first
    activeOrRinging.sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

    const incomingCalls = activeOrRinging.filter(
      (c) =>
        c.status === 'RINGING' &&
        (c.receiverId === user.id ||
          (user.role === 'SUPPORT' &&
            c.callType === 'SUPPORT_AUDIO' &&
            c.callerId !== user.id))
    );

    const outgoingRingingCall = activeOrRinging.find(
      (c) => c.status === 'RINGING' && c.callerId === user.id
    );

    const activeCall = activeOrRinging.find((c) => c.status === 'ACTIVE');

    const recentHistory = allCalls
      .filter((c) => {
        if (user.role === 'SUPPORT' && c.callType === 'SUPPORT_AUDIO') {
          return true;
        }
        return (
          c.callerId === user.id ||
          c.receiverId === user.id ||
          user.role === 'SUPER_ADMIN'
        );
      })
      .slice(-15)
      .reverse();

    res.json({
      incomingCalls,
      outgoingRingingCall: outgoingRingingCall || null,
      activeCall: activeCall || null,
      recentHistory,
    });
  }
);

/**
 * POST /api/calls/:id/accept
 * Receiver (Customer Care Support, Celebrity, or Normal User) accepts an incoming RINGING call
 */
router.post(
  '/:id/accept',
  authenticateJWT,
  (req: AuthenticatedRequest, res: Response): void => {
    const user = req.user!;
    const session = db.callSessions.get(req.params.id);

    if (!session) {
      res.status(404).json({ error: 'Call session not found' });
      return;
    }

    const canAccept =
      session.receiverId === user.id ||
      (user.role === 'SUPPORT' && session.callType === 'SUPPORT_AUDIO');

    if (!canAccept) {
      res.status(403).json({ error: 'Not authorized to accept this call' });
      return;
    }

    session.status = 'ACTIVE';
    session.receiverId = user.id;
    session.receiverName = user.displayName;
    session.startedAt = new Date().toISOString();

    res.json({
      success: true,
      message: `Connected call with ${session.callerName}`,
      callSession: session,
    });
  }
);

/**
 * POST /api/calls/:id/reject
 * Receiver declines an incoming RINGING call
 */
router.post(
  '/:id/reject',
  authenticateJWT,
  (req: AuthenticatedRequest, res: Response): void => {
    const session = db.callSessions.get(req.params.id);
    if (!session) {
      res.status(404).json({ error: 'Call session not found' });
      return;
    }

    session.status = 'REJECTED';
    session.endedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Call declined',
      callSession: session,
    });
  }
);

/**
 * POST /api/calls/:id/end
 * Either party ends an active or ringing call
 */
router.post(
  '/:id/end',
  authenticateJWT,
  (req: AuthenticatedRequest, res: Response): void => {
    const session = db.callSessions.get(req.params.id);
    if (!session) {
      res.status(404).json({ error: 'Call session not found' });
      return;
    }

    session.status = 'ENDED';
    session.endedAt = new Date().toISOString();
    session.durationSeconds = Math.max(
      1,
      Math.round(
        (Date.now() - new Date(session.startedAt).getTime()) / 1000
      )
    );

    res.json({
      success: true,
      message: 'Call ended',
      callSession: session,
    });
  }
);

export default router;
