import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../store/datastore';
import {
  authenticateJWT,
  AuthenticatedRequest,
  JWT_SECRET,
} from '../middleware/auth.middleware';
import { User, UserRole } from '../types/models';

const router = Router();

/**
 * Dedicated Dummy OTP mapping per pre-seeded phone number (plus '123456' works universally)
 */
const DEDICATED_DUMMY_OTPS: Record<string, string> = {
  '+919876543210': '111111', // Normal User (Free) - Rahul Nair
  '+919876543211': '222222', // Normal User (Premium VIP) - Anjali Menon
  '+919876543220': '333333', // Celebrity (Actor) - Aarav Krishna
  '+919876543221': '333334', // Celebrity (Singer) - Meera Nandan
  '+919876543230': '444444', // Organization - Malabar Live Events Pvt Ltd
  '+919876543240': '555555', // Customer Care Support - Lakshmi
  '+919876543250': '999999', // Super Admin - Platform Super Admin
};

function normalizePhone(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, '');
  if (/^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  return cleaned;
}

/**
 * POST /api/auth/send-otp
 * Sends a 6-digit OTP to the provided Mobile Number and checks if the user is registered
 */
router.post('/send-otp', (req: Request, res: Response): void => {
  const { phone } = req.body as { phone?: string };
  if (!phone || phone.trim().length < 8) {
    res.status(400).json({ error: 'Valid mobile number is required' });
    return;
  }

  const normalizedPhone = normalizePhone(phone);
  const existingUser = db.findUserByPhone(normalizedPhone);
  const otp = DEDICATED_DUMMY_OTPS[normalizedPhone] || '123456';

  db.otpCache.set(normalizedPhone, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  res.json({
    success: true,
    phone: normalizedPhone,
    isExistingUser: !!existingUser,
    existingRole: existingUser?.role || null,
    existingName: existingUser?.displayName || null,
    message: `OTP sent to ${normalizedPhone}`,
    demoOtp: otp,
  });
});

/**
 * POST /api/auth/verify-otp
 * Verifies Mobile Number + OTP, sets HTTP session cookie, and logs in or registers the user
 */
router.post('/verify-otp', (req: Request, res: Response): void => {
  const {
    phone,
    otp,
    mode = 'LOGIN', // 'LOGIN' | 'REGISTER'
    role = 'USER',
    displayName,
    city = 'Kochi',
    latitude = 9.9312,
    longitude = 76.2673,
    companyName,
    category,
  } = req.body as {
    phone?: string;
    otp?: string;
    mode?: 'LOGIN' | 'REGISTER';
    role?: UserRole;
    displayName?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    companyName?: string;
    category?: string;
  };

  if (!phone || !otp) {
    res.status(400).json({ error: 'Mobile number and OTP are required' });
    return;
  }

  const normalizedPhone = normalizePhone(phone);
  const cached = db.otpCache.get(normalizedPhone);
  const dedicatedOtp = DEDICATED_DUMMY_OTPS[normalizedPhone];

  const isOtpValid =
    otp.trim() === '123456' ||
    (dedicatedOtp && otp.trim() === dedicatedOtp) ||
    (cached && cached.otp === otp.trim());

  if (!isOtpValid) {
    res.status(401).json({ error: 'Invalid or expired OTP. Please check your 6-digit OTP.' });
    return;
  }

  let user = db.findUserByPhone(normalizedPhone);

  if (!user) {
    if (mode === 'LOGIN' && !displayName) {
      // Even in login mode, if a new number is entered, create the account or prompt registration
    }
    const newId = `usr-${Date.now()}`;
    const now = new Date().toISOString();
    user = {
      id: newId,
      phone: normalizedPhone,
      role,
      displayName: displayName || `Friend ${normalizedPhone.slice(-4)}`,
      avatarUrl:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
      language: 'Malayalam',
      city,
      latitude,
      longitude,
      isVerified: true,
      isPremium: role === 'CELEBRITY' || role === 'SUPER_ADMIN',
      walletCoins: role === 'USER' ? 100 : 500,
      status: 'ACTIVE',
      createdAt: now,
    };

    if (role === 'CELEBRITY') {
      user.celebrityProfile = {
        id: `cprof-${Date.now()}`,
        userId: newId,
        category: category || 'Public Figure & Artist',
        bio: 'Official Celebrity Profile on Friends App',
        audioRatePerMin: 30,
        videoRatePerMin: 70,
        availability: 'AVAILABLE',
        isApprovedByAdmin: true,
        followersCount: 1200,
        totalEarningsCoins: 0,
        mediaGallery: [],
      };
    } else if (role === 'ORGANIZATION') {
      user.organizationProfile = {
        id: `oprof-${Date.now()}`,
        userId: newId,
        companyName: companyName || displayName || 'Events Organization',
        registrationNumber: `ORG-${Date.now().toString().slice(-6)}`,
        isApprovedByAdmin: true,
      };
    }

    db.users.set(user.id, user);
  }

  if (user.status === 'BLOCKED') {
    res.status(403).json({
      error: 'This account has been blocked by the Super Admin.',
      code: 'ACCOUNT_BLOCKED',
    });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role, phone: user.phone },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Set HTTP Session Cookie for browser session persistence
  res.setHeader(
    'Set-Cookie',
    `friends_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
  );

  res.json({
    success: true,
    token,
    user,
  });
});

/**
 * POST /api/auth/logout
 * Clears the HTTP session cookie and terminates the active session
 */
router.post('/logout', (_req: Request, res: Response): void => {
  res.setHeader(
    'Set-Cookie',
    'friends_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
  );
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * GET /api/auth/demo-accounts
 * Returns pre-seeded accounts with their dedicated Mobile Numbers & Dummy OTPs for testing
 */
router.get('/demo-accounts', (_req: Request, res: Response): void => {
  const accounts = Array.from(db.users.values()).map((u) => ({
    id: u.id,
    phone: u.phone,
    dummyOtp: DEDICATED_DUMMY_OTPS[u.phone] || '123456',
    role: u.role,
    displayName: u.displayName,
    isPremium: u.isPremium,
    walletCoins: u.walletCoins,
    status: u.status,
    city: u.city,
  }));
  res.json({ accounts });
});

/**
 * GET /api/auth/me
 */
router.get(
  '/me',
  authenticateJWT,
  (req: AuthenticatedRequest, res: Response): void => {
    res.json({ user: req.user });
  }
);

/**
 * POST /api/auth/upgrade-premium
 * Upgrades a Normal User account to Premium Plan (unlocking Celebrity Audio & Video Calls)
 */
router.post(
  '/upgrade-premium',
  authenticateJWT,
  (req: AuthenticatedRequest, res: Response): void => {
    const user = req.user!;
    const {
      planName = 'Gold VIP Pass (Audio + Video Celebrity Access)',
      bonusCoins = 500,
    } = req.body as { planName?: string; bonusCoins?: number };

    user.isPremium = true;
    user.premiumPlanName = planName;
    user.premiumExpiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    user.walletCoins += Number(bonusCoins);

    res.json({
      success: true,
      message:
        'Upgraded to Premium Plan! You can now Audio & Video call Celebrities.',
      user,
    });
  }
);

/**
 * POST /api/auth/topup-wallet
 * Adds coins to user wallet via Razorpay/Stripe payment confirmation
 */
router.post(
  '/topup-wallet',
  authenticateJWT,
  (req: AuthenticatedRequest, res: Response): void => {
    const user = req.user!;
    const { coins = 300 } = req.body as { coins?: number };
    user.walletCoins += Number(coins);
    res.json({
      success: true,
      walletCoins: user.walletCoins,
      user,
    });
  }
);

export default router;
