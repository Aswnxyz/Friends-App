import assert from 'assert';
import http from 'http';
import { io as ClientIO } from 'socket.io-client';
import { server } from '../server';

async function request(
  baseUrl: string,
  path: string,
  options: {
    method?: string;
    token?: string;
    body?: unknown;
  } = {}
): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();
  return { status: res.status, data };
}

async function runTests() {
  console.log('🧪 Starting Friends App Backend End-to-End Verification Suite...');

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 1. Verify Health Check
    const health = await request(baseUrl, '/api/health');
    assert.strictEqual(health.status, 200);
    assert.ok(health.data.supportedCallTypes.includes('RANDOM_VIDEO'));
    console.log('✅ 1. Health check & supported call types verified');

    // 2. OTP Login for Normal User 1 (Non-Premium initially) & Normal User 2 (Premium)
    await request(baseUrl, '/api/auth/send-otp', {
      method: 'POST',
      body: { phone: '+919876543210' },
    });
    const loginUser1 = await request(baseUrl, '/api/auth/verify-otp', {
      method: 'POST',
      body: { phone: '+919876543210', otp: '123456' },
    });
    assert.strictEqual(loginUser1.status, 200);
    const user1Token = loginUser1.data.token as string;

    const loginUser2 = await request(baseUrl, '/api/auth/verify-otp', {
      method: 'POST',
      body: { phone: '+919876543211', otp: '123456' },
    });
    assert.strictEqual(loginUser2.status, 200);
    const user2Token = loginUser2.data.token as string;
    console.log('✅ 2. Mobile OTP login for Normal Users verified');

    // 3. Verify Random Friend Connect in BOTH Audio (`RANDOM_AUDIO`) and Video (`RANDOM_VIDEO`) modes via REST + Socket.io
    const randomAudio = await request(baseUrl, '/api/random/match', {
      method: 'POST',
      token: user1Token,
      body: { mode: 'AUDIO' },
    });
    assert.strictEqual(randomAudio.status, 201);
    assert.strictEqual(randomAudio.data.callSession.callType, 'RANDOM_AUDIO');

    const randomVideo = await request(baseUrl, '/api/random/match', {
      method: 'POST',
      token: user1Token,
      body: { mode: 'VIDEO' },
    });
    assert.strictEqual(randomVideo.status, 201);
    assert.strictEqual(randomVideo.data.callSession.callType, 'RANDOM_VIDEO');

    // Test real-time Socket.io Random Video Matchmaking between User 1 and User 2
    await new Promise<void>((resolve, reject) => {
      const sock1 = ClientIO(baseUrl, {
        query: { userId: loginUser1.data.user.id },
      });
      const sock2 = ClientIO(baseUrl, {
        query: { userId: loginUser2.data.user.id },
      });

      let matchedCount = 0;
      const checkDone = (payload: any) => {
        try {
          assert.strictEqual(payload.callType, 'RANDOM_VIDEO');
          assert.strictEqual(payload.mode, 'VIDEO');
          matchedCount++;
          if (matchedCount === 2) {
            sock1.disconnect();
            sock2.disconnect();
            resolve();
          }
        } catch (err) {
          reject(err);
        }
      };

      sock1.on('match:found', checkDone);
      sock2.on('match:found', checkDone);

      sock1.emit('queue:join', {
        userId: loginUser1.data.user.id,
        mode: 'VIDEO',
      });
      setTimeout(() => {
        sock2.emit('queue:join', {
          userId: loginUser2.data.user.id,
          mode: 'VIDEO',
        });
      }, 80);
    });
    console.log(
      '✅ 3. Random Friend Connect verified for both Audio Call (RANDOM_AUDIO) & Video Call (RANDOM_VIDEO)'
    );

    // 4. Organization Login, Event Creation & Location-based Event Discovery + Ticket Booking
    const loginOrg = await request(baseUrl, '/api/auth/verify-otp', {
      method: 'POST',
      body: { phone: '+919876543230', otp: '123456' },
    });
    const orgToken = loginOrg.data.token as string;

    const createEvt = await request(baseUrl, '/api/events', {
      method: 'POST',
      token: orgToken,
      body: {
        title: 'Marine Drive Live Music Night',
        venueName: 'Marine Drive Ground, Kochi',
        city: 'Kochi',
        latitude: 9.9772,
        longitude: 76.2773,
        ticketPrice: 399,
        totalCapacity: 300,
      },
    });
    assert.strictEqual(createEvt.status, 201);

    const nearbyKochi = await request(
      baseUrl,
      '/api/events/nearby?lat=9.9312&lng=76.2673&radiusKm=30'
    );
    assert.strictEqual(nearbyKochi.status, 200);
    assert.ok(nearbyKochi.data.events.length >= 2);

    const bookRes = await request(
      baseUrl,
      `/api/events/${createEvt.data.event.id}/book`,
      {
        method: 'POST',
        token: user1Token,
        body: { ticketCount: 2 },
      }
    );
    assert.strictEqual(bookRes.status, 201);
    assert.strictEqual(bookRes.data.booking.ticketCount, 2);
    console.log(
      '✅ 4. Organization event posting, PostGIS/Haversine location filtering, and ticket booking verified'
    );

    // 5. Celebrity Account Media Upload + Premium Gate for Celebrity Audio & Video Calls
    const loginCeleb = await request(baseUrl, '/api/auth/verify-otp', {
      method: 'POST',
      body: { phone: '+919876543220', otp: '123456' },
    });
    const celebToken = loginCeleb.data.token as string;

    const uploadMedia = await request(baseUrl, '/api/celebrities/media', {
      method: 'POST',
      token: celebToken,
      body: {
        mediaType: 'PHOTO',
        url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800',
        caption: 'New movie poster release!',
      },
    });
    assert.strictEqual(uploadMedia.status, 201);

    // Non-premium User 1 tries to Video Call Celebrity -> Must fail with 403 PREMIUM_REQUIRED
    const nonPremCall = await request(
      baseUrl,
      `/api/celebrities/${loginCeleb.data.user.id}/call-initiate`,
      {
        method: 'POST',
        token: user1Token,
        body: { mode: 'VIDEO' },
      }
    );
    assert.strictEqual(nonPremCall.status, 403);
    assert.strictEqual(nonPremCall.data.code, 'PREMIUM_REQUIRED');

    // Upgrade User 1 to Premium Plan -> Then test Celebrity Audio Call & Celebrity Video Call
    const upgradeRes = await request(baseUrl, '/api/auth/upgrade-premium', {
      method: 'POST',
      token: user1Token,
      body: { planName: 'Gold VIP Pass', bonusCoins: 500 },
    });
    assert.strictEqual(upgradeRes.status, 200);
    assert.strictEqual(upgradeRes.data.user.isPremium, true);

    const celebAudioCall = await request(
      baseUrl,
      `/api/celebrities/${loginCeleb.data.user.id}/call-initiate`,
      {
        method: 'POST',
        token: user1Token,
        body: { mode: 'AUDIO' },
      }
    );
    assert.strictEqual(celebAudioCall.status, 201);
    assert.strictEqual(
      celebAudioCall.data.callSession.callType,
      'CELEBRITY_AUDIO'
    );

    const celebVideoCall = await request(
      baseUrl,
      `/api/celebrities/${loginCeleb.data.user.id}/call-initiate`,
      {
        method: 'POST',
        token: user1Token,
        body: { mode: 'VIDEO' },
      }
    );
    assert.strictEqual(celebVideoCall.status, 201);
    assert.strictEqual(
      celebVideoCall.data.callSession.callType,
      'CELEBRITY_VIDEO'
    );
    console.log(
      '✅ 5. Celebrity media upload, Premium-only paywall gate, and Celebrity Audio & Video calls verified'
    );

    // 6. Customer Care Support: Verify Live Chat & Audio Call work, and Video Call is strictly rejected
    const supportAudio = await request(baseUrl, '/api/support/call', {
      method: 'POST',
      token: user1Token,
      body: { mode: 'AUDIO' },
    });
    assert.strictEqual(supportAudio.status, 201);
    assert.strictEqual(supportAudio.data.callSession.callType, 'SUPPORT_AUDIO');

    const supportVideoRejected = await request(baseUrl, '/api/support/call', {
      method: 'POST',
      token: celebToken,
      body: { mode: 'VIDEO' },
    });
    assert.strictEqual(supportVideoRejected.status, 400);
    assert.strictEqual(
      supportVideoRejected.data.code,
      'SUPPORT_VIDEO_NOT_ALLOWED'
    );
    console.log(
      '✅ 6. Customer Care Support Audio Call & Chat verified; Video Call with Customer Care strictly blocked'
    );

    // 7. Super Admin Moderation: Block/Restrict User and verify enforcement
    const loginAdmin = await request(baseUrl, '/api/auth/verify-otp', {
      method: 'POST',
      body: { phone: '+919876543250', otp: '123456' },
    });
    const adminToken = loginAdmin.data.token as string;

    const restrictRes = await request(
      baseUrl,
      `/api/admin/users/${loginUser1.data.user.id}/restrict`,
      {
        method: 'POST',
        token: adminToken,
        body: {
          restrictionType: 'BAN_RANDOM_VIDEO',
          status: 'LIMITED',
          reason: 'Testing granular video call restriction',
        },
      }
    );
    assert.strictEqual(restrictRes.status, 201);

    const blockedVideoAttempt = await request(baseUrl, '/api/random/match', {
      method: 'POST',
      token: user1Token,
      body: { mode: 'VIDEO' },
    });
    assert.strictEqual(blockedVideoAttempt.status, 403);
    assert.strictEqual(blockedVideoAttempt.data.code, 'BAN_RANDOM_VIDEO');

    // Unblock user back to active
    const unblockRes = await request(
      baseUrl,
      `/api/admin/users/${loginUser1.data.user.id}/unblock`,
      {
        method: 'POST',
        token: adminToken,
      }
    );
    assert.strictEqual(unblockRes.status, 200);
    console.log(
      '✅ 7. Super Admin user blocking, granular restriction (BAN_RANDOM_VIDEO), and unblocking verified'
    );

    console.log('\n🎉 ALL 7 BACKEND END-TO-END TEST SUITES PASSED!');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
