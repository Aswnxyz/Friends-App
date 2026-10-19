import { Router, Request, Response } from 'express';
import { db } from '../store/datastore';
import {
  authenticateJWT,
  AuthenticatedRequest,
  requireRoles,
} from '../middleware/auth.middleware';
import {
  AvailabilityStatus,
  CallSession,
  CelebrityMediaItem,
  MediaType,
} from '../types/models';

const router = Router();

/**
 * GET /api/celebrities
 * Lists all celebrity accounts along with their photo/video gallery, availability, and Audio/Video call rates
 */
router.get('/', (_req: Request, res: Response): void => {
  const celebrities = Array.from(db.users.values())
    .filter((u) => u.role === 'CELEBRITY' && u.celebrityProfile)
    .map((u) => ({
      ...u.celebrityProfile!,
      profileId: u.celebrityProfile!.id,
      id: u.id,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      city: u.city,
      language: u.language,
      isVerified: u.isVerified,
    }));

  res.json({ celebrities });
});

/**
 * POST /api/celebrities/media
 * Allows a CELEBRITY user to upload photos or videos to their profile gallery
 */
router.post(
  '/media',
  authenticateJWT,
  requireRoles('CELEBRITY', 'SUPER_ADMIN'),
  (req: AuthenticatedRequest, res: Response): void => {
    const user = req.user!;
    if (!user.celebrityProfile) {
      res.status(400).json({ error: 'Celebrity profile not initialized' });
      return;
    }

    const {
      mediaType = 'PHOTO',
      url,
      thumbnailUrl,
      caption = 'New update for my fans!',
    } = req.body as {
      mediaType?: MediaType;
      url?: string;
      thumbnailUrl?: string;
      caption?: string;
    };

    if (!url) {
      res.status(400).json({ error: 'Media URL is required' });
      return;
    }

    const mediaItem: CelebrityMediaItem = {
      id: `med-${Date.now()}`,
      celebrityId: user.celebrityProfile.id,
      mediaType: mediaType === 'VIDEO' ? 'VIDEO' : 'PHOTO',
      url,
      thumbnailUrl,
      caption,
      likesCount: 1,
      createdAt: new Date().toISOString(),
    };

    user.celebrityProfile.mediaGallery.unshift(mediaItem);

    res.status(201).json({
      success: true,
      mediaItem,
      gallery: user.celebrityProfile.mediaGallery,
    });
  }
);

/**
 * PATCH /api/celebrities/availability
 * Allows a CELEBRITY user to update their online status and per-minute Audio/Video call rates
 */
router.patch(
  '/availability',
  authenticateJWT,
  requireRoles('CELEBRITY', 'SUPER_ADMIN'),
  (req: AuthenticatedRequest, res: Response): void => {
    const user = req.user!;
    if (!user.celebrityProfile) {
      res.status(400).json({ error: 'Celebrity profile not found' });
      return;
    }

    const { availability, audioRatePerMin, videoRatePerMin } = req.body as {
      availability?: AvailabilityStatus;
      audioRatePerMin?: number;
      videoRatePerMin?: number;
    };

    if (availability) {
      user.celebrityProfile.availability = availability;
    }
    if (audioRatePerMin !== undefined) {
      user.celebrityProfile.audioRatePerMin = Number(audioRatePerMin);
    }
    if (videoRatePerMin !== undefined) {
      user.celebrityProfile.videoRatePerMin = Number(videoRatePerMin);
    }

    res.json({
      success: true,
      celebrityProfile: user.celebrityProfile,
    });
  }
);

/**
 * POST /api/celebrities/:id/call-initiate
 * Initiates an Audio Call (`CELEBRITY_AUDIO`) or Video Call (`CELEBRITY_VIDEO`) with a Celebrity.
 * Strictly requires the caller to have an active Premium Plan (`isPremium === true`) and sufficient wallet coins.
 */
router.post(
  '/:id/call-initiate',
  authenticateJWT,
  (req: AuthenticatedRequest, res: Response): void => {
    const caller = req.user!;
    const celebrityUser = db.users.get(req.params.id);

    if (
      !celebrityUser ||
      celebrityUser.role !== 'CELEBRITY' ||
      !celebrityUser.celebrityProfile
    ) {
      res.status(404).json({ error: 'Celebrity account not found' });
      return;
    }

    // 1. Enforce Premium Plan requirement for calling Celebrities
    if (!caller.isPremium) {
      res.status(403).json({
        error:
          'Calling Celebrities (Audio or Video) requires an active Premium Plan. Please upgrade your account to Premium first.',
        code: 'PREMIUM_REQUIRED',
      });
      return;
    }

    const { mode = 'VIDEO' } = req.body as { mode?: 'AUDIO' | 'VIDEO' };
    const callType =
      mode === 'AUDIO' ? 'CELEBRITY_AUDIO' : 'CELEBRITY_VIDEO';

    const profile = celebrityUser.celebrityProfile;
    if (profile.availability !== 'AVAILABLE') {
      res.status(400).json({
        error: `${celebrityUser.displayName} is currently ${profile.availability}`,
        code: 'CELEBRITY_UNAVAILABLE',
      });
      return;
    }

    const ratePerMin =
      callType === 'CELEBRITY_AUDIO'
        ? profile.audioRatePerMin
        : profile.videoRatePerMin;

    // 2. Enforce Wallet Coin balance for at least 1 minute
    if (caller.walletCoins < ratePerMin) {
      res.status(402).json({
        error: `Insufficient wallet coins. ${callType === 'CELEBRITY_VIDEO' ? 'Video' : 'Audio'} call requires ${ratePerMin} coins/min, and you have ${caller.walletCoins} coins.`,
        code: 'INSUFFICIENT_COINS',
        requiredCoins: ratePerMin,
        currentCoins: caller.walletCoins,
      });
      return;
    }

    // Deduct first minute upfront and credit celebrity
    caller.walletCoins -= ratePerMin;
    celebrityUser.walletCoins += ratePerMin;
    profile.totalEarningsCoins += ratePerMin;

    const roomId = `celeb-room-${Date.now()}`;
    const session: CallSession = {
      id: `call-${Date.now()}`,
      callType,
      callerId: caller.id,
      callerName: `${caller.displayName} (${caller.phone})`,
      callerRole: caller.role,
      receiverId: celebrityUser.id,
      receiverName: celebrityUser.displayName,
      receiverRole: 'CELEBRITY',
      roomId,
      status: 'RINGING',
      startedAt: new Date().toISOString(),
      durationSeconds: 60,
      coinsCharged: ratePerMin,
    };

    db.callSessions.set(session.id, session);

    res.status(201).json({
      success: true,
      message: `Calling ${celebrityUser.displayName} (${callType === 'CELEBRITY_VIDEO' ? 'Video Call' : 'Audio Call'}) — Ringing on Celebrity end...`,
      callSession: session,
      callerRemainingCoins: caller.walletCoins,
    });
  }
);

export default router;
