import { Router, Response } from 'express';
import { db } from '../store/datastore';
import {
  authenticateJWT,
  AuthenticatedRequest,
} from '../middleware/auth.middleware';
import { CallSession, SupportMessage, SupportTicket } from '../types/models';

const router = Router();

/**
 * GET /api/support/tickets
 * Normal Users & Celebrities see their own support tickets;
 * SUPPORT and SUPER_ADMIN see all support tickets.
 */
router.get(
  '/tickets',
  authenticateJWT,
  (req: AuthenticatedRequest, res: Response): void => {
    const user = req.user!;
    const allTickets = Array.from(db.supportTickets.values());

    if (user.role === 'SUPPORT' || user.role === 'SUPER_ADMIN') {
      res.json({ tickets: allTickets });
      return;
    }

    const userTickets = allTickets.filter((t) => t.creatorId === user.id);
    res.json({ tickets: userTickets });
  }
);

/**
 * POST /api/support/tickets
 * Creates a new support ticket for Normal Users, Celebrities, or Organizations
 */
router.post(
  '/tickets',
  authenticateJWT,
  (req: AuthenticatedRequest, res: Response): void => {
    const user = req.user!;
    const { subject, message } = req.body as {
      subject?: string;
      message?: string;
    };

    if (!subject || !message) {
      res.status(400).json({ error: 'Subject and initial message are required' });
      return;
    }

    const supportAgent = Array.from(db.users.values()).find(
      (u) => u.role === 'SUPPORT'
    );

    const ticketId = `tkt-${Date.now()}`;
    const now = new Date().toISOString();
    const initialMsg: SupportMessage = {
      id: `msg-${Date.now()}`,
      ticketId,
      senderId: user.id,
      senderName: user.displayName,
      senderRole: user.role,
      content: message,
      createdAt: now,
    };

    const ticket: SupportTicket = {
      id: ticketId,
      creatorId: user.id,
      creatorName: user.displayName,
      creatorPhone: user.phone,
      creatorRole: user.role,
      assignedAgentId: supportAgent?.id,
      assignedAgentName: supportAgent?.displayName || 'Customer Care Desk',
      subject,
      status: 'OPEN',
      allowedCallModes: ['SUPPORT_AUDIO'],
      createdAt: now,
      messages: [initialMsg],
    };

    db.supportTickets.set(ticket.id, ticket);
    res.status(201).json({ success: true, ticket });
  }
);

/**
 * POST /api/support/tickets/:id/messages
 * Sends a two-way chat message between User/Celebrity and Customer Care Support
 */
router.post(
  '/tickets/:id/messages',
  authenticateJWT,
  (req: AuthenticatedRequest, res: Response): void => {
    const user = req.user!;
    const ticket = db.supportTickets.get(req.params.id);

    if (!ticket) {
      res.status(404).json({ error: 'Support ticket not found' });
      return;
    }

    const { content } = req.body as { content?: string };
    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Message content cannot be empty' });
      return;
    }

    const msg: SupportMessage = {
      id: `msg-${Date.now()}`,
      ticketId: ticket.id,
      senderId: user.id,
      senderName: user.displayName,
      senderRole: user.role,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    ticket.messages.push(msg);
    if (user.role === 'SUPPORT') {
      ticket.status = 'IN_PROGRESS';
    }

    res.status(201).json({
      success: true,
      message: msg,
      ticket,
    });
  }
);

/**
 * POST /api/support/call
 * Initiates an Audio Call (`SUPPORT_AUDIO`) between a Normal User / Celebrity and Customer Care Support.
 * Strictly prohibits Video Calls with Customer Care.
 */
router.post(
  '/call',
  authenticateJWT,
  (req: AuthenticatedRequest, res: Response): void => {
    const caller = req.user!;
    const { mode = 'AUDIO', targetUserId } = req.body as {
      mode?: string;
      targetUserId?: string;
    };

    // Explicitly block any attempt to start a Video Call with Customer Care
    if (mode.toUpperCase() === 'VIDEO') {
      res.status(400).json({
        error:
          'Video calls are not permitted with Customer Care Support. Only Audio Call and Live Text Chat are supported with Customer Care.',
        code: 'SUPPORT_VIDEO_NOT_ALLOWED',
      });
      return;
    }

    const targetReceiver =
      (targetUserId && db.users.get(targetUserId)) ||
      Array.from(db.users.values()).find((u) => u.role === 'SUPPORT');

    if (!targetReceiver) {
      res.status(404).json({ error: 'No Customer Care agent available' });
      return;
    }

    const session: CallSession = {
      id: `supcall-${Date.now()}`,
      callType: 'SUPPORT_AUDIO',
      callerId: caller.id,
      callerName: `${caller.displayName} (${caller.phone})`,
      callerRole: caller.role,
      receiverId: targetReceiver.id,
      receiverName: targetReceiver.displayName,
      receiverRole: targetReceiver.role,
      roomId: `support-audio-room-${Date.now()}`,
      status: 'RINGING',
      startedAt: new Date().toISOString(),
      durationSeconds: 0,
      coinsCharged: 0, // Customer Care Audio Calls are free
    };

    db.callSessions.set(session.id, session);

    res.status(201).json({
      success: true,
      message: `Calling ${targetReceiver.displayName} (Audio Only) — Ringing on Customer Care end...`,
      callSession: session,
    });
  }
);

export default router;
