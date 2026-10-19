import { Router, Response } from 'express';
import { db } from '../store/datastore';
import {
  authenticateJWT,
  AuthenticatedRequest,
  requireRoles,
} from '../middleware/auth.middleware';
import {
  AccountStatus,
  RestrictionType,
  UserRestriction,
} from '../types/models';

const router = Router();

/**
 * GET /api/admin/overview
 * Super Admin platform overview metrics, users, events, calls, and active restrictions
 */
router.get(
  '/overview',
  authenticateJWT,
  requireRoles('SUPER_ADMIN'),
  (_req: AuthenticatedRequest, res: Response): void => {
    const users = Array.from(db.users.values());
    const events = Array.from(db.events.values());
    const bookings = Array.from(db.bookings.values());
    const calls = Array.from(db.callSessions.values());
    const restrictions = Array.from(db.restrictions.values());
    const tickets = Array.from(db.supportTickets.values());

    res.json({
      stats: {
        totalUsers: users.length,
        normalUsersCount: users.filter((u) => u.role === 'USER').length,
        celebritiesCount: users.filter((u) => u.role === 'CELEBRITY').length,
        organizationsCount: users.filter((u) => u.role === 'ORGANIZATION').length,
        supportAgentsCount: users.filter((u) => u.role === 'SUPPORT').length,
        premiumUsersCount: users.filter((u) => u.isPremium).length,
        blockedOrRestrictedCount: users.filter((u) => u.status !== 'ACTIVE').length,
        totalEvents: events.length,
        totalBookings: bookings.length,
        totalCallSessions: calls.length,
        openSupportTickets: tickets.filter((t) => t.status !== 'RESOLVED').length,
      },
      users,
      restrictions,
      recentCalls: calls.slice(-20).reverse(),
    });
  }
);

/**
 * POST /api/admin/users/:id/restrict
 * Allows SUPER_ADMIN to block, suspend, limit, or apply granular call/event restrictions to any user
 */
router.post(
  '/users/:id/restrict',
  authenticateJWT,
  requireRoles('SUPER_ADMIN'),
  (req: AuthenticatedRequest, res: Response): void => {
    const admin = req.user!;
    const targetUser = db.users.get(req.params.id);

    if (!targetUser) {
      res.status(404).json({ error: 'Target user not found' });
      return;
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      res.status(400).json({ error: 'Cannot restrict another Super Admin' });
      return;
    }

    const {
      restrictionType = 'BLOCK_ACCOUNT',
      status = 'BLOCKED',
      reason = 'Violation of platform community guidelines',
    } = req.body as {
      restrictionType?: RestrictionType;
      status?: AccountStatus;
      reason?: string;
    };

    if (restrictionType === 'BLOCK_ACCOUNT') {
      targetUser.status = 'BLOCKED';
    } else if (status) {
      targetUser.status = status;
    } else {
      targetUser.status = 'LIMITED';
    }

    const restriction: UserRestriction = {
      id: `rst-${Date.now()}`,
      targetUserId: targetUser.id,
      targetUserName: targetUser.displayName,
      targetUserRole: targetUser.role,
      adminUserId: admin.id,
      restrictionType,
      reason,
      active: true,
      createdAt: new Date().toISOString(),
    };

    db.restrictions.set(restriction.id, restriction);

    res.status(201).json({
      success: true,
      message: `Applied ${restrictionType} (${targetUser.status}) to ${targetUser.displayName}`,
      user: targetUser,
      restriction,
    });
  }
);

/**
 * POST /api/admin/users/:id/unblock
 * Restores a blocked or limited user back to ACTIVE status and clears active restrictions
 */
router.post(
  '/users/:id/unblock',
  authenticateJWT,
  requireRoles('SUPER_ADMIN'),
  (req: AuthenticatedRequest, res: Response): void => {
    const targetUser = db.users.get(req.params.id);
    if (!targetUser) {
      res.status(404).json({ error: 'Target user not found' });
      return;
    }

    targetUser.status = 'ACTIVE';
    for (const r of db.restrictions.values()) {
      if (r.targetUserId === targetUser.id && r.active) {
        r.active = false;
      }
    }

    res.json({
      success: true,
      message: `${targetUser.displayName} has been restored to ACTIVE status`,
      user: targetUser,
    });
  }
);

/**
 * PATCH /api/admin/verify/:userId
 * Approves a Celebrity or Organization account
 */
router.patch(
  '/verify/:userId',
  authenticateJWT,
  requireRoles('SUPER_ADMIN'),
  (req: AuthenticatedRequest, res: Response): void => {
    const targetUser = db.users.get(req.params.userId);
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    targetUser.isVerified = true;
    if (targetUser.celebrityProfile) {
      targetUser.celebrityProfile.isApprovedByAdmin = true;
    }
    if (targetUser.organizationProfile) {
      targetUser.organizationProfile.isApprovedByAdmin = true;
    }

    res.json({
      success: true,
      user: targetUser,
    });
  }
);

export default router;
