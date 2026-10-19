export type UserRole =
  | 'USER'
  | 'CELEBRITY'
  | 'ORGANIZATION'
  | 'SUPPORT'
  | 'SUPER_ADMIN';

export type AccountStatus = 'ACTIVE' | 'BLOCKED' | 'LIMITED' | 'SUSPENDED';

export type AvailabilityStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

export type MediaType = 'PHOTO' | 'VIDEO';

export type CallType =
  | 'RANDOM_AUDIO'
  | 'RANDOM_VIDEO'
  | 'CELEBRITY_AUDIO'
  | 'CELEBRITY_VIDEO'
  | 'SUPPORT_AUDIO';

export type RestrictionType =
  | 'BLOCK_ACCOUNT'
  | 'BAN_RANDOM_AUDIO'
  | 'BAN_RANDOM_VIDEO'
  | 'BAN_EVENT_POST'
  | 'RATE_LIMIT';

export interface CelebrityMediaItem {
  id: string;
  celebrityId: string;
  mediaType: MediaType;
  url: string;
  thumbnailUrl?: string;
  caption: string;
  likesCount: number;
  createdAt: string;
}

export interface CelebrityProfile {
  id: string;
  userId: string;
  category: string;
  bio: string;
  audioRatePerMin: number;
  videoRatePerMin: number;
  availability: AvailabilityStatus;
  isApprovedByAdmin: boolean;
  followersCount: number;
  totalEarningsCoins: number;
  mediaGallery: CelebrityMediaItem[];
}

export interface OrganizationProfile {
  id: string;
  userId: string;
  companyName: string;
  registrationNumber: string;
  website?: string;
  isApprovedByAdmin: boolean;
}

export interface User {
  id: string;
  phone: string;
  role: UserRole;
  displayName: string;
  avatarUrl: string;
  language: string;
  city: string;
  latitude: number;
  longitude: number;
  isVerified: boolean;
  isPremium: boolean;
  premiumPlanName?: string;
  premiumExpiresAt?: string;
  walletCoins: number;
  status: AccountStatus;
  createdAt: string;
  celebrityProfile?: CelebrityProfile;
  organizationProfile?: OrganizationProfile;
}

export interface EventItem {
  id: string;
  organizationId: string;
  organizationName: string;
  title: string;
  description: string;
  category: string;
  bannerUrl: string;
  venueName: string;
  city: string;
  latitude: number;
  longitude: number;
  startTime: string;
  endTime: string;
  ticketPrice: number;
  totalCapacity: number;
  bookedCount: number;
  status: 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  distanceKm?: number;
}

export interface EventBooking {
  id: string;
  eventId: string;
  eventTitle: string;
  venueName: string;
  startTime: string;
  userId: string;
  userName: string;
  userPhone: string;
  ticketCount: number;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  paymentRef: string;
  qrCodeHash: string;
  bookedAt: string;
}

export interface CallSession {
  id: string;
  callType: CallType;
  callerId: string;
  callerName: string;
  callerRole: UserRole;
  receiverId: string;
  receiverName: string;
  receiverRole: UserRole;
  roomId: string;
  status: 'RINGING' | 'ACTIVE' | 'ENDED' | 'REJECTED';
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  coinsCharged: number;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorPhone: string;
  creatorRole: UserRole;
  assignedAgentId?: string;
  assignedAgentName?: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  /** Customer Care Support strictly allows Audio Call and Text Chat only (no Video Call) */
  allowedCallModes: ['SUPPORT_AUDIO'];
  createdAt: string;
  messages: SupportMessage[];
}

export interface UserRestriction {
  id: string;
  targetUserId: string;
  targetUserName: string;
  targetUserRole: UserRole;
  adminUserId: string;
  restrictionType: RestrictionType;
  reason: string;
  active: boolean;
  expiresAt?: string;
  createdAt: string;
}
