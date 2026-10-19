import { Router, Request, Response } from 'express';
import { calculateDistanceKm, db } from '../store/datastore';
import {
  authenticateJWT,
  AuthenticatedRequest,
  requireRoles,
} from '../middleware/auth.middleware';
import { EventBooking, EventItem } from '../types/models';

const router = Router();

/**
 * GET /api/events/nearby
 * Returns events filtered and sorted by distance from the user's location (lat, lng, radiusKm, city)
 */
router.get('/nearby', (req: Request, res: Response): void => {
  const lat = req.query.lat ? parseFloat(String(req.query.lat)) : 9.9312;
  const lng = req.query.lng ? parseFloat(String(req.query.lng)) : 76.2673;
  const radiusKm = req.query.radiusKm
    ? parseFloat(String(req.query.radiusKm))
    : 500;
  const cityFilter = req.query.city ? String(req.query.city).toLowerCase() : '';

  const allEvents = Array.from(db.events.values()).filter(
    (e) => e.status === 'PUBLISHED'
  );

  const enriched = allEvents
    .map((evt) => {
      const distanceKm = calculateDistanceKm(
        lat,
        lng,
        evt.latitude,
        evt.longitude
      );
      return { ...evt, distanceKm };
    })
    .filter((evt) => {
      if (cityFilter && cityFilter !== 'all') {
        return evt.city.toLowerCase().includes(cityFilter);
      }
      return evt.distanceKm <= radiusKm;
    })
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

  res.json({
    userLocation: { lat, lng, radiusKm },
    count: enriched.length,
    events: enriched,
  });
});

/**
 * POST /api/events
 * Allows ORGANIZATION (or SUPER_ADMIN) users to publish new location-based events
 */
router.post(
  '/',
  authenticateJWT,
  requireRoles('ORGANIZATION', 'SUPER_ADMIN'),
  (req: AuthenticatedRequest, res: Response): void => {
    const user = req.user!;

    // Check if Super Admin placed an event posting ban on this organization
    const restriction = db.hasActiveRestriction(user.id, 'BAN_EVENT_POST');
    if (restriction) {
      res.status(403).json({
        error: `Event posting restricted by Super Admin: ${restriction.reason}`,
        code: 'EVENT_POST_RESTRICTED',
      });
      return;
    }

    const {
      title,
      description,
      category = 'Live Event',
      bannerUrl = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
      venueName,
      city,
      latitude = 9.9312,
      longitude = 76.2673,
      startTime,
      endTime,
      ticketPrice = 299,
      totalCapacity = 200,
    } = req.body as Partial<EventItem>;

    if (!title || !venueName || !city) {
      res.status(400).json({
        error: 'Event title, venueName, and city are required',
      });
      return;
    }

    const newEvent: EventItem = {
      id: `evt-${Date.now()}`,
      organizationId: user.organizationProfile?.id || user.id,
      organizationName:
        user.organizationProfile?.companyName || user.displayName,
      title,
      description: description || `Hosted by ${user.displayName} at ${venueName}`,
      category,
      bannerUrl,
      venueName,
      city,
      latitude: Number(latitude),
      longitude: Number(longitude),
      startTime:
        startTime || new Date(Date.now() + 7 * 86400000).toISOString(),
      endTime:
        endTime ||
        new Date(Date.now() + 7 * 86400000 + 14400000).toISOString(),
      ticketPrice: Number(ticketPrice),
      totalCapacity: Number(totalCapacity),
      bookedCount: 0,
      status: 'PUBLISHED',
      createdAt: new Date().toISOString(),
    };

    db.events.set(newEvent.id, newEvent);
    res.status(201).json({
      success: true,
      event: newEvent,
    });
  }
);

/**
 * POST /api/events/:id/book
 * Books tickets for an event for any authenticated user
 */
router.post(
  '/:id/book',
  authenticateJWT,
  (req: AuthenticatedRequest, res: Response): void => {
    const user = req.user!;
    const event = db.events.get(req.params.id);

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const ticketCount = Math.max(1, Number(req.body.ticketCount || 1));
    if (event.bookedCount + ticketCount > event.totalCapacity) {
      res.status(400).json({
        error: 'Not enough tickets remaining for this event',
      });
      return;
    }

    event.bookedCount += ticketCount;
    const totalAmount = event.ticketPrice * ticketCount;

    const booking: EventBooking = {
      id: `bk-${Date.now()}`,
      eventId: event.id,
      eventTitle: event.title,
      venueName: event.venueName,
      startTime: event.startTime,
      userId: user.id,
      userName: user.displayName,
      userPhone: user.phone,
      ticketCount,
      totalAmount,
      paymentStatus: 'PAID',
      paymentRef: `RZP_${Date.now()}`,
      qrCodeHash: `FRIENDS-QR-${event.id.toUpperCase()}-${user.id.slice(-4).toUpperCase()}-${Date.now().toString().slice(-5)}`,
      bookedAt: new Date().toISOString(),
    };

    db.bookings.set(booking.id, booking);

    res.status(201).json({
      success: true,
      message: `Successfully booked ${ticketCount} ticket(s) for ${event.title}`,
      booking,
      event,
    });
  }
);

/**
 * GET /api/events/my-bookings
 * Returns bookings for the current user (or all bookings for an Organization's events)
 */
router.get(
  '/my-bookings',
  authenticateJWT,
  (req: AuthenticatedRequest, res: Response): void => {
    const user = req.user!;
    const allBookings = Array.from(db.bookings.values());

    if (user.role === 'ORGANIZATION' || user.role === 'SUPER_ADMIN') {
      res.json({ bookings: allBookings });
      return;
    }

    const userBookings = allBookings.filter((b) => b.userId === user.id);
    res.json({ bookings: userBookings });
  }
);

export default router;
