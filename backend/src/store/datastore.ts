import {
  CallSession,
  CelebrityMediaItem,
  EventBooking,
  EventItem,
  RestrictionType,
  SupportMessage,
  SupportTicket,
  User,
  UserRestriction,
  UserRole,
} from '../types/models';

/**
 * Haversine distance calculator (in kilometers) for PostGIS-equivalent spatial queries
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

class DataStore {
  public users: Map<string, User> = new Map();
  public otpCache: Map<string, { otp: string; expiresAt: number }> = new Map();
  public events: Map<string, EventItem> = new Map();
  public bookings: Map<string, EventBooking> = new Map();
  public callSessions: Map<string, CallSession> = new Map();
  public supportTickets: Map<string, SupportTicket> = new Map();
  public restrictions: Map<string, UserRestriction> = new Map();

  constructor() {
    this.seedInitialData();
  }

  public seedInitialData(): void {
    const now = new Date().toISOString();

    // 1. Normal User 1 (Standard Free Account)
    const user1: User = {
      id: 'usr-rahul-01',
      phone: '+919876543210',
      role: 'USER',
      displayName: 'Rahul Nair',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      language: 'Malayalam',
      city: 'Kochi',
      latitude: 9.9312,
      longitude: 76.2673,
      isVerified: true,
      isPremium: false,
      walletCoins: 120,
      status: 'ACTIVE',
      createdAt: now,
    };

    // 2. Normal User 2 (Premium Account for testing Celebrity Audio & Video Calls)
    const user2: User = {
      id: 'usr-anjali-02',
      phone: '+919876543211',
      role: 'USER',
      displayName: 'Anjali Menon',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
      language: 'Malayalam',
      city: 'Trivandrum',
      latitude: 8.5241,
      longitude: 76.9366,
      isVerified: true,
      isPremium: true,
      premiumPlanName: 'Gold VIP Pass (Audio + Video Celebrity Access)',
      premiumExpiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      walletCoins: 650,
      status: 'ACTIVE',
      createdAt: now,
    };

    // 3. Celebrity User 1
    const celeb1: User = {
      id: 'cel-tovino-01',
      phone: '+919876543220',
      role: 'CELEBRITY',
      displayName: 'Aarav Krishna (Actor)',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
      language: 'Malayalam',
      city: 'Kochi',
      latitude: 9.9816,
      longitude: 76.2999,
      isVerified: true,
      isPremium: true,
      walletCoins: 2400,
      status: 'ACTIVE',
      createdAt: now,
      celebrityProfile: {
        id: 'cprof-01',
        userId: 'cel-tovino-01',
        category: 'Film Actor & Youth Icon',
        bio: 'Malayalam Cinema Actor | Fitness Enthusiast | Connect with me live via Audio or Video Call!',
        audioRatePerMin: 30,
        videoRatePerMin: 75,
        availability: 'AVAILABLE',
        isApprovedByAdmin: true,
        followersCount: 148500,
        totalEarningsCoins: 18500,
        mediaGallery: [
          {
            id: 'med-01',
            celebrityId: 'cprof-01',
            mediaType: 'PHOTO',
            url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
            caption: 'Behind the scenes from our new movie shoot in Fort Kochi!',
            likesCount: 4320,
            createdAt: now,
          },
          {
            id: 'med-02',
            celebrityId: 'cprof-01',
            mediaType: 'VIDEO',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800',
            caption: 'Weekend workout routine & fan Q&A teaser reel 🎬',
            likesCount: 8910,
            createdAt: now,
          },
        ],
      },
    };

    // 4. Celebrity User 2
    const celeb2: User = {
      id: 'cel-sithara-02',
      phone: '+919876543221',
      role: 'CELEBRITY',
      displayName: 'Meera Nandan (Playback Singer)',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
      language: 'Malayalam',
      city: 'Kozhikode',
      latitude: 11.2588,
      longitude: 75.7804,
      isVerified: true,
      isPremium: true,
      walletCoins: 1890,
      status: 'ACTIVE',
      createdAt: now,
      celebrityProfile: {
        id: 'cprof-02',
        userId: 'cel-sithara-02',
        category: 'Playback Singer & Live Performer',
        bio: 'Award-winning playback singer & indie musician. Available for unplugged musical video & audio calls!',
        audioRatePerMin: 25,
        videoRatePerMin: 60,
        availability: 'AVAILABLE',
        isApprovedByAdmin: true,
        followersCount: 96400,
        totalEarningsCoins: 11200,
        mediaGallery: [
          {
            id: 'med-03',
            celebrityId: 'cprof-02',
            mediaType: 'PHOTO',
            url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800',
            caption: 'Live concert night at Kozhikode Beach Stage 🎶',
            likesCount: 5120,
            createdAt: now,
          },
          {
            id: 'med-04',
            celebrityId: 'cprof-02',
            mediaType: 'VIDEO',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
            caption: 'Acoustic studio jam session — call me live!',
            likesCount: 6430,
            createdAt: now,
          },
        ],
      },
    };

    // 5. Organization User
    const org1: User = {
      id: 'org-kerala-events-01',
      phone: '+919876543230',
      role: 'ORGANIZATION',
      displayName: 'Malabar Live Events Pvt Ltd',
      avatarUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200',
      language: 'Malayalam',
      city: 'Kochi',
      latitude: 9.9312,
      longitude: 76.2673,
      isVerified: true,
      isPremium: true,
      walletCoins: 500,
      status: 'ACTIVE',
      createdAt: now,
      organizationProfile: {
        id: 'oprof-01',
        userId: 'org-kerala-events-01',
        companyName: 'Malabar Live Events Pvt Ltd',
        registrationNumber: 'KL-EVT-2026-8821',
        website: 'https://malabarlive.example.com',
        isApprovedByAdmin: true,
      },
    };

    // 6. Customer Care Support User
    const support1: User = {
      id: 'sup-agent-01',
      phone: '+919876543240',
      role: 'SUPPORT',
      displayName: 'Lakshmi (Customer Care Executive)',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
      language: 'Malayalam',
      city: 'Kochi',
      latitude: 9.9312,
      longitude: 76.2673,
      isVerified: true,
      isPremium: false,
      walletCoins: 0,
      status: 'ACTIVE',
      createdAt: now,
    };

    // 7. Super Admin User
    const admin1: User = {
      id: 'adm-super-01',
      phone: '+919876543250',
      role: 'SUPER_ADMIN',
      displayName: 'Platform Super Admin',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200',
      language: 'Malayalam',
      city: 'Kochi',
      latitude: 9.9312,
      longitude: 76.2673,
      isVerified: true,
      isPremium: true,
      walletCoins: 99999,
      status: 'ACTIVE',
      createdAt: now,
    };

    [user1, user2, celeb1, celeb2, org1, support1, admin1].forEach((u) => {
      this.users.set(u.id, u);
    });

    // Seed Location-Based Events (Kochi, Trivandrum, Kozhikode)
    const sampleEvents: EventItem[] = [
      {
        id: 'evt-kochi-music-01',
        organizationId: 'oprof-01',
        organizationName: 'Malabar Live Events Pvt Ltd',
        title: 'Kochi Neon Music & Friends Fest 2026',
        description:
          'Live indie music festival, celebrity meet & greet, and community networking night at Bolgatty Palace Grounds.',
        category: 'Music Concert',
        bannerUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800',
        venueName: 'Bolgatty Event Island, Kochi',
        city: 'Kochi',
        latitude: 9.9854,
        longitude: 76.2663,
        startTime: new Date(Date.now() + 5 * 86400000).toISOString(),
        endTime: new Date(Date.now() + 5 * 86400000 + 18000000).toISOString(),
        ticketPrice: 499,
        totalCapacity: 500,
        bookedCount: 142,
        status: 'PUBLISHED',
        createdAt: now,
      },
      {
        id: 'evt-kochi-tech-02',
        organizationId: 'oprof-01',
        organizationName: 'Malabar Live Events Pvt Ltd',
        title: 'Kerala Creators & Startup Mixer',
        description:
          'Connect with digital creators, filmmakers, and startup founders in Infopark Kochi.',
        category: 'Networking & Meetup',
        bannerUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
        venueName: 'Infopark Convention Center, Kakkanad, Kochi',
        city: 'Kochi',
        latitude: 10.0104,
        longitude: 76.3621,
        startTime: new Date(Date.now() + 8 * 86400000).toISOString(),
        endTime: new Date(Date.now() + 8 * 86400000 + 14400000).toISOString(),
        ticketPrice: 299,
        totalCapacity: 250,
        bookedCount: 88,
        status: 'PUBLISHED',
        createdAt: now,
      },
      {
        id: 'evt-tvm-beach-03',
        organizationId: 'oprof-01',
        organizationName: 'Malabar Live Events Pvt Ltd',
        title: 'Shangumugham Sunset Acoustic Night',
        description:
          'An evening of Malayalam unplugged melodies, poetry, and seaside food stalls.',
        category: 'Cultural & Acoustic',
        bannerUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
        venueName: 'Shangumugham Beach Amphitheatre, Trivandrum',
        city: 'Trivandrum',
        latitude: 8.4812,
        longitude: 76.9125,
        startTime: new Date(Date.now() + 10 * 86400000).toISOString(),
        endTime: new Date(Date.now() + 10 * 86400000 + 14400000).toISOString(),
        ticketPrice: 350,
        totalCapacity: 400,
        bookedCount: 210,
        status: 'PUBLISHED',
        createdAt: now,
      },
      {
        id: 'evt-calicut-food-04',
        organizationId: 'oprof-01',
        organizationName: 'Malabar Live Events Pvt Ltd',
        title: 'Kozhikode Malabar Food & Music Carnival',
        description:
          'Authentic Malabar cuisine, live Mappila Paattu fusion bands, and celebrity appearances.',
        category: 'Food & Festival',
        bannerUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
        venueName: 'Swapna Nagari Trade Center, Kozhikode',
        city: 'Kozhikode',
        latitude: 11.2695,
        longitude: 75.7921,
        startTime: new Date(Date.now() + 12 * 86400000).toISOString(),
        endTime: new Date(Date.now() + 12 * 86400000 + 21600000).toISOString(),
        ticketPrice: 199,
        totalCapacity: 800,
        bookedCount: 345,
        status: 'PUBLISHED',
        createdAt: now,
      },
    ];

    sampleEvents.forEach((evt) => this.events.set(evt.id, evt));

    // Seed Support Tickets (from both Normal User and Celebrity)
    const ticket1: SupportTicket = {
      id: 'tkt-1001',
      creatorId: user1.id,
      creatorName: user1.displayName,
      creatorPhone: user1.phone,
      creatorRole: 'USER',
      assignedAgentId: support1.id,
      assignedAgentName: support1.displayName,
      subject: 'Question about upgrading to Premium for Celebrity Video Calls',
      status: 'OPEN',
      allowedCallModes: ['SUPPORT_AUDIO'],
      createdAt: now,
      messages: [
        {
          id: 'msg-1',
          ticketId: 'tkt-1001',
          senderId: user1.id,
          senderName: user1.displayName,
          senderRole: 'USER',
          content: 'നമസ്കാരം, എനിക്ക് സെലിബ്രിറ്റികളെ വീഡിയോ കോൾ ചെയ്യാൻ പ്രീമിയം പ്ലാൻ എങ്ങനെ ആക്ടിവേറ്റ് ചെയ്യാം?',
          createdAt: now,
        },
        {
          id: 'msg-2',
          ticketId: 'tkt-1001',
          senderId: support1.id,
          senderName: support1.displayName,
          senderRole: 'SUPPORT',
          content:
            'നമസ്കാരം രാഹുൽ! പ്രീമിയം പ്ലാൻ എടുത്താൽ നിങ്ങൾക്ക് സെലിബ്രിറ്റികളുമായി ഓഡിയോ കോളും വീഡിയോ കോളും ചെയ്യാം. സംശയമുണ്ടെങ്കിൽ ഇവിടുത്തെ Support Audio Call ബട്ടൺ അമർത്തി സംസാരിക്കാവുന്നതാണ്.',
          createdAt: now,
        },
      ],
    };

    const ticket2: SupportTicket = {
      id: 'tkt-1002',
      creatorId: celeb1.id,
      creatorName: celeb1.displayName,
      creatorPhone: celeb1.phone,
      creatorRole: 'CELEBRITY',
      assignedAgentId: support1.id,
      assignedAgentName: support1.displayName,
      subject: 'Celebrity Payout & Call Schedule Verification',
      status: 'IN_PROGRESS',
      allowedCallModes: ['SUPPORT_AUDIO'],
      createdAt: now,
      messages: [
        {
          id: 'msg-3',
          ticketId: 'tkt-1002',
          senderId: celeb1.id,
          senderName: celeb1.displayName,
          senderRole: 'CELEBRITY',
          content: 'Hi Support team, please verify my updated Video Call per-minute rate (75 coins/min).',
          createdAt: now,
        },
      ],
    };

    this.supportTickets.set(ticket1.id, ticket1);
    this.supportTickets.set(ticket2.id, ticket2);
  }

  public findUserByPhone(phone: string, role?: UserRole): User | undefined {
    for (const user of this.users.values()) {
      if (user.phone === phone && (!role || user.role === role)) {
        return user;
      }
    }
    return undefined;
  }

  public hasActiveRestriction(
    userId: string,
    restrictionType: RestrictionType
  ): UserRestriction | undefined {
    for (const r of this.restrictions.values()) {
      if (
        r.targetUserId === userId &&
        r.active &&
        (r.restrictionType === restrictionType || r.restrictionType === 'BLOCK_ACCOUNT')
      ) {
        if (!r.expiresAt || new Date(r.expiresAt).getTime() > Date.now()) {
          return r;
        }
      }
    }
    return undefined;
  }
}

export const db = new DataStore();
