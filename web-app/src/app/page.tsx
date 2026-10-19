'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Phone,
  PhoneIncoming,
  PhoneCall,
  Video,
  VideoOff,
  Mic,
  MicOff,
  MapPin,
  Calendar,
  Ticket,
  Crown,
  Sparkles,
  ShieldAlert,
  Headphones,
  Send,
  Upload,
  Building2,
  CheckCircle2,
  Ban,
  RefreshCw,
  Coins,
  LogOut,
  PhoneOff,
  Radio,
  KeyRound,
  Smartphone,
  UserPlus,
  Lock,
  Copy,
  Bell,
  MessageSquare,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

type UserRole =
  | 'USER'
  | 'CELEBRITY'
  | 'ORGANIZATION'
  | 'SUPPORT'
  | 'SUPER_ADMIN';

interface ActiveCallState {
  id: string;
  callType:
    | 'RANDOM_AUDIO'
    | 'RANDOM_VIDEO'
    | 'CELEBRITY_AUDIO'
    | 'CELEBRITY_VIDEO'
    | 'SUPPORT_AUDIO';
  status: 'RINGING' | 'ACTIVE';
  direction: 'INCOMING' | 'OUTGOING';
  peerName: string;
  peerSubtitle: string;
  roomId: string;
  isVideo: boolean;
  ratePerMin?: number;
}

interface LiveChatNotification {
  id: string;
  ticketId: string;
  ticketSubject: string;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: string;
}

const KERALA_LOCATIONS = [
  { label: 'Kochi (Current GPS)', city: 'Kochi', lat: 9.9312, lng: 76.2673 },
  { label: 'Trivandrum', city: 'Trivandrum', lat: 8.5241, lng: 76.9366 },
  { label: 'Kozhikode', city: 'Kozhikode', lat: 11.2588, lng: 75.7804 },
];

const PRE_SEEDED_TEST_ACCOUNTS = [
  {
    role: 'USER (Normal - Free)',
    name: 'Rahul Nair',
    phone: '+919876543210',
    otp: '111111',
    desc: 'Random Audio/Video Call, Events Booking, Customer Care',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
  {
    role: 'USER (Premium VIP)',
    name: 'Anjali Menon',
    phone: '+919876543211',
    otp: '222222',
    desc: 'Includes VIP Celebrity Audio & Video Calling + 650 Coins',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    role: 'CELEBRITY (Actor)',
    name: 'Aarav Krishna',
    phone: '+919876543220',
    otp: '333333',
    desc: 'Upload Photos/Videos, Set Call Rates, Receive Fan Calls, Support',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },
  {
    role: 'CELEBRITY (Singer)',
    name: 'Meera Nandan',
    phone: '+919876543221',
    otp: '333334',
    desc: 'Celebrity Singer Account — Media Gallery & VIP Calls',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },
  {
    role: 'ORGANIZATION',
    name: 'Malabar Live Events Pvt Ltd',
    phone: '+919876543230',
    otp: '444444',
    desc: 'Publish Location Events, Manage Tickets & Attendee Bookings',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    role: 'SUPPORT (Customer Care)',
    name: 'Lakshmi (Support Executive)',
    phone: '+919876543240',
    otp: '555555',
    desc: 'Customer Care Console — Receive Incoming Support Audio Calls & Live Chat',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  {
    role: 'SUPER_ADMIN',
    name: 'Platform Super Admin',
    phone: '+919876543250',
    otp: '999999',
    desc: 'Full Platform Control — Block/Limit Users, Restrict Calls, Verify',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
];

// Client Cookie & Per-Tab Session Storage Helpers
function setSessionCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function getSessionCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';').map((c) => c.trim());
  for (const c of cookies) {
    if (c.startsWith(`${name}=`)) {
      return decodeURIComponent(c.substring(name.length + 1));
    }
  }
  return null;
}

function clearSessionCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

// Web Audio API Synthesizer for Instant Chat & Call Notification Sounds (No external audio file needed)
function triggerSynthesizedSound(type: 'CHAT' | 'CALL') {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'CHAT') {
      // Pleasant two-note crystal chime (D5 -> A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.36);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.28);
      gain2.gain.setValueAtTime(0.001, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.18, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.5);
    } else {
      // Incoming call triple-pulse ring chime
      [0, 0.18, 0.36].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now + offset);
        osc.frequency.setValueAtTime(783.99, now + offset + 0.07);
        gain.gain.setValueAtTime(0.001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.16);
      });
    }
  } catch {
    // Ignore if browser blocked autoplay before first user interaction
  }
}

export default function FriendsAppWeb() {
  // Session & Authentication State
  const [isSessionChecking, setIsSessionChecking] = useState<boolean>(true);
  const [token, setToken] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Login / Register Screen State
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpRequested, setOtpRequested] = useState<boolean>(false);
  const [detectedAccountInfo, setDetectedAccountInfo] = useState<{
    isExistingUser: boolean;
    existingName: string | null;
    existingRole: string | null;
    demoOtp: string;
  } | null>(null);

  // Registration-only fields
  const [registerRole, setRegisterRole] = useState<UserRole>('USER');
  const [registerName, setRegisterName] = useState<string>('');
  const [registerCity, setRegisterCity] = useState<string>('Kochi');
  const [registerExtra, setRegisterExtra] = useState<string>('');

  // Status Toast
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Device Preview Mode (Full Web vs iPhone iOS Frame vs Android Frame)
  const [previewDevice, setPreviewDevice] = useState<
    'WEB' | 'IPHONE' | 'ANDROID'
  >('WEB');

  // Navigation Tabs inside Logged-In Home Page
  const [activeTab, setActiveTab] = useState<string>('HOME_PRIMARY');

  // Call & Matchmaking State
  const [randomMode, setRandomMode] = useState<'AUDIO' | 'VIDEO'>('VIDEO');
  const [isMatching, setIsMatching] = useState<boolean>(false);
  const [incomingCalls, setIncomingCalls] = useState<any[]>([]);
  const [recentCallHistory, setRecentCallHistory] = useState<any[]>([]);
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [callSeconds, setCallSeconds] = useState<number>(0);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Location & Events State
  const [selectedLocation, setSelectedLocation] = useState(KERALA_LOCATIONS[0]);
  const [radiusKm, setRadiusKm] = useState<number>(60);
  const [events, setEvents] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [newEventForm, setNewEventForm] = useState({
    title: '',
    venueName: '',
    city: 'Kochi',
    category: 'Music Concert',
    ticketPrice: 399,
    totalCapacity: 300,
    description: '',
  });

  // Celebrities State
  const [celebrities, setCelebrities] = useState<any[]>([]);
  const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);
  const [newMediaForm, setNewMediaForm] = useState({
    mediaType: 'PHOTO' as 'PHOTO' | 'VIDEO',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    caption: '',
  });
  const [celebRatesForm, setCelebRatesForm] = useState({
    availability: 'AVAILABLE',
    audioRatePerMin: 30,
    videoRatePerMin: 75,
  });

  // Customer Care Support & Real-Time Chat Notifications State
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string>('');
  const [chatInput, setChatInput] = useState<string>('');
  const [newTicketSubject, setNewTicketSubject] = useState<string>('');
  const [newTicketMsg, setNewTicketMsg] = useState<string>('');

  // Unread Chat Count & Floating Live Notification State
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [unreadByTicket, setUnreadByTicket] = useState<Record<string, number>>(
    {}
  );
  const [liveChatAlerts, setLiveChatAlerts] = useState<LiveChatNotification[]>(
    []
  );

  // Refs for real-time polling comparison without stale closures
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const seenIncomingCallIdsRef = useRef<Set<string>>(new Set());
  const initialTicketsSeededRef = useRef<boolean>(false);
  const activeTabRef = useRef<string>(activeTab);
  const activeTicketIdRef = useRef<string>(activeTicketId);
  const soundEnabledRef = useRef<boolean>(soundEnabled);
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    activeTicketIdRef.current = activeTicketId;
  }, [activeTicketId]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Super Admin State
  const [adminOverview, setAdminOverview] = useState<any>(null);

  const notify = (type: 'success' | 'error' | 'info', text: string) => {
    setStatusBanner({ type, text });
  };

  const playNotificationSound = (type: 'CHAT' | 'CALL') => {
    if (!soundEnabledRef.current) return;
    triggerSynthesizedSound(type);
  };

  // Total unread chat count across all tickets
  const totalUnreadChatCount = Object.values(unreadByTicket).reduce(
    (sum, count) => sum + count,
    0
  );

  // Clear unread count for a ticket when the user views it on the SUPPORT tab
  useEffect(() => {
    if (activeTab === 'SUPPORT' && activeTicketId) {
      setUnreadByTicket((prev) => {
        if (!prev[activeTicketId]) return prev;
        const updated = { ...prev };
        delete updated[activeTicketId];
        return updated;
      });
    }
  }, [activeTab, activeTicketId]);

  // Set default home tab based on logged-in user's role
  const setDefaultTabForRole = (role: UserRole) => {
    switch (role) {
      case 'USER':
        setActiveTab('RANDOM_CONNECT');
        break;
      case 'CELEBRITY':
        setActiveTab('CELEBRITY_STUDIO');
        break;
      case 'ORGANIZATION':
        setActiveTab('ORG_EVENTS');
        break;
      case 'SUPPORT':
        setActiveTab('SUPPORT');
        break;
      case 'SUPER_ADMIN':
        setActiveTab('ADMIN_CONTROL');
        break;
    }
  };

  // Reset seen tracking when switching users
  const resetRealtimeTrackingForUser = () => {
    seenMessageIdsRef.current = new Set();
    seenIncomingCallIdsRef.current = new Set();
    initialTicketsSeededRef.current = false;
    setUnreadByTicket({});
    setLiveChatAlerts([]);
  };

  // Restore session from tab sessionStorage first, then cookie
  useEffect(() => {
    async function restoreSession() {
      const savedToken =
        (typeof window !== 'undefined'
          ? sessionStorage.getItem('friends_tab_token')
          : null) || getSessionCookie('friends_client_token');

      if (!savedToken) {
        setIsSessionChecking(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          resetRealtimeTrackingForUser();
          setToken(savedToken);
          setCurrentUser(data.user);
          setDefaultTabForRole(data.user.role);
          if (data.user.celebrityProfile) {
            setCelebRatesForm({
              availability: data.user.celebrityProfile.availability,
              audioRatePerMin: data.user.celebrityProfile.audioRatePerMin,
              videoRatePerMin: data.user.celebrityProfile.videoRatePerMin,
            });
          }
        } else {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('friends_tab_token');
          }
          clearSessionCookie('friends_client_token');
        }
      } catch {
        // Backend unreachable
      } finally {
        setIsSessionChecking(false);
      }
    }
    restoreSession();
  }, []);

  // REAL-TIME SYNC LOOP (Every 1.5s): Polls BOTH Incoming/Active Calls AND Support Chat Messages dynamically without page refresh!
  useEffect(() => {
    if (!token || !currentUser) return;

    const syncRealtimeCallsAndChats = async () => {
      // 1. Sync Calls (/api/calls/my-calls)
      try {
        const callRes = await fetch(`${API_BASE}/calls/my-calls`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (callRes.ok) {
          const callData = await callRes.json();
          const incList: any[] = callData.incomingCalls || [];
          setIncomingCalls(incList);
          setRecentCallHistory(callData.recentHistory || []);

          // Play ring sound if a brand-new incoming call arrived
          for (const inc of incList) {
            if (!seenIncomingCallIdsRef.current.has(inc.id)) {
              seenIncomingCallIdsRef.current.add(inc.id);
              playNotificationSound('CALL');
            }
          }

          if (callData.activeCall) {
            const c = callData.activeCall;
            const isVideo =
              c.callType === 'RANDOM_VIDEO' || c.callType === 'CELEBRITY_VIDEO';
            const isCaller = c.callerId === currentUser.id;
            const peerName = isCaller ? c.receiverName : c.callerName;

            setActiveCall((prev) => {
              if (prev && prev.id === c.id && prev.status === 'ACTIVE') {
                return prev;
              }
              return {
                id: c.id,
                callType: c.callType,
                status: 'ACTIVE',
                direction: isCaller ? 'OUTGOING' : 'INCOMING',
                peerName,
                peerSubtitle:
                  c.callType === 'SUPPORT_AUDIO'
                    ? '24/7 Customer Care Support • Audio Call Connected'
                    : `${c.callType.replace('_', ' ')} • Live WebRTC Connected`,
                roomId: c.roomId,
                isVideo,
              };
            });
          } else if (callData.outgoingRingingCall) {
            const c = callData.outgoingRingingCall;
            const isVideo =
              c.callType === 'RANDOM_VIDEO' || c.callType === 'CELEBRITY_VIDEO';
            setActiveCall((prev) => {
              if (prev && prev.id === c.id && prev.status === 'RINGING') {
                return prev;
              }
              return {
                id: c.id,
                callType: c.callType,
                status: 'RINGING',
                direction: 'OUTGOING',
                peerName: c.receiverName,
                peerSubtitle: `Ringing ${c.receiverName}... Waiting for them to pick up`,
                roomId: c.roomId,
                isVideo,
              };
            });
          } else {
            setActiveCall((prev) => {
              if (
                prev &&
                prev.callType !== 'RANDOM_AUDIO' &&
                prev.callType !== 'RANDOM_VIDEO'
              ) {
                return null;
              }
              return prev;
            });
          }
        }
      } catch {}

      // 2. Sync Support Tickets & Live Text Chat Messages (/api/support/tickets)
      try {
        const tktRes = await fetch(`${API_BASE}/support/tickets`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (tktRes.ok) {
          const tktData = await tktRes.json();
          const fetchedTickets: any[] = tktData.tickets || [];

          // Sort tickets so the one with the most recent message appears first
          fetchedTickets.sort((a, b) => {
            const aLast =
              a.messages?.[a.messages.length - 1]?.createdAt || a.createdAt;
            const bLast =
              b.messages?.[b.messages.length - 1]?.createdAt || b.createdAt;
            return new Date(bLast).getTime() - new Date(aLast).getTime();
          });

          if (!initialTicketsSeededRef.current) {
            // First load for this session: seed existing message IDs so old history doesn't chime
            for (const t of fetchedTickets) {
              for (const m of t.messages || []) {
                seenMessageIdsRef.current.add(m.id);
              }
            }
            initialTicketsSeededRef.current = true;
            setTickets(fetchedTickets);
            if (!activeTicketIdRef.current && fetchedTickets.length > 0) {
              setActiveTicketId(fetchedTickets[0].id);
            }
          } else {
            // Subsequent real-time polls: detect any newly arrived messages!
            const newlyArrivedAlerts: LiveChatNotification[] = [];
            const unreadDeltaByTicket: Record<string, number> = {};

            for (const t of fetchedTickets) {
              for (const m of t.messages || []) {
                if (!seenMessageIdsRef.current.has(m.id)) {
                  seenMessageIdsRef.current.add(m.id);

                  // If the message was sent by someone else (e.g. User -> Customer Care, or Customer Care -> User)
                  if (m.senderId !== currentUser.id) {
                    newlyArrivedAlerts.push({
                      id: m.id,
                      ticketId: t.id,
                      ticketSubject: t.subject,
                      senderName: m.senderName,
                      senderRole: m.senderRole,
                      content: m.content,
                      createdAt: m.createdAt,
                    });

                    const isCurrentlyViewingThisTicket =
                      activeTabRef.current === 'SUPPORT' &&
                      activeTicketIdRef.current === t.id;

                    if (!isCurrentlyViewingThisTicket) {
                      unreadDeltaByTicket[t.id] =
                        (unreadDeltaByTicket[t.id] || 0) + 1;
                    }
                  }
                }
              }
            }

            setTickets(fetchedTickets);
            if (!activeTicketIdRef.current && fetchedTickets.length > 0) {
              setActiveTicketId(fetchedTickets[0].id);
            }

            if (newlyArrivedAlerts.length > 0) {
              // Play pleasant chat notification chime!
              playNotificationSound('CHAT');

              // Add floating notification popup at top-right (keep latest 4)
              setLiveChatAlerts((prev) =>
                [...newlyArrivedAlerts, ...prev].slice(0, 4)
              );

              // Auto-scroll chat window if viewing support chat
              setTimeout(() => {
                chatMessagesEndRef.current?.scrollIntoView({
                  behavior: 'smooth',
                });
              }, 100);
            }

            if (Object.keys(unreadDeltaByTicket).length > 0) {
              setUnreadByTicket((prev) => {
                const next = { ...prev };
                for (const [tId, delta] of Object.entries(
                  unreadDeltaByTicket
                )) {
                  next[tId] = (next[tId] || 0) + delta;
                }
                return next;
              });
            }
          }
        }
      } catch {}
    };

    syncRealtimeCallsAndChats();
    const interval = setInterval(syncRealtimeCallsAndChats, 1500);
    return () => clearInterval(interval);
  }, [token, currentUser]);

  // Step 1 of Auth: Send OTP to Mobile Number
  const handleSendOtp = async (e?: React.FormEvent, overridePhone?: string) => {
    if (e) e.preventDefault();
    const targetPhone = (overridePhone ?? phoneInput).trim();
    if (!targetPhone || targetPhone.length < 8) {
      notify(
        'error',
        'ദയവായി ശരിയായ മൊബൈൽ നമ്പർ നൽകുക (Enter a valid mobile number)'
      );
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify('error', data.error || 'Failed to send OTP');
        return;
      }

      setPhoneInput(data.phone);
      setOtpRequested(true);
      setOtpInput(data.demoOtp);
      setDetectedAccountInfo({
        isExistingUser: data.isExistingUser,
        existingName: data.existingName,
        existingRole: data.existingRole,
        demoOtp: data.demoOtp,
      });

      if (data.isExistingUser) {
        notify(
          'info',
          `OTP sent to ${data.phone} (${data.existingName} • ${data.existingRole}). Dummy OTP: ${data.demoOtp}`
        );
      } else {
        notify(
          'info',
          `OTP sent to new number ${data.phone}. Dummy OTP: ${data.demoOtp}`
        );
      }
    } catch {
      notify(
        'error',
        'Backend server at http://localhost:4000 is not reachable.'
      );
    }
  };

  // Step 2 of Auth: Verify OTP & Establish Session Cookie
  const handleVerifyOtpAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim() || !otpInput.trim()) {
      notify('error', 'Mobile number and 6-digit OTP are required');
      return;
    }

    try {
      const selectedCityObj =
        KERALA_LOCATIONS.find((l) => l.city === registerCity) ||
        KERALA_LOCATIONS[0];

      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: phoneInput.trim(),
          otp: otpInput.trim(),
          mode: authMode,
          role: registerRole,
          displayName: registerName.trim() || undefined,
          city: registerCity,
          latitude: selectedCityObj.lat,
          longitude: selectedCityObj.lng,
          companyName:
            registerRole === 'ORGANIZATION'
              ? registerExtra || registerName
              : undefined,
          category:
            registerRole === 'CELEBRITY'
              ? registerExtra || 'Film & Media Artist'
              : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        notify('error', data.error || 'Invalid OTP or Login blocked');
        return;
      }

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('friends_tab_token', data.token);
      }
      setSessionCookie('friends_client_token', data.token, 7);

      resetRealtimeTrackingForUser();
      setToken(data.token);
      setCurrentUser(data.user);
      setDefaultTabForRole(data.user.role);
      if (data.user.celebrityProfile) {
        setCelebRatesForm({
          availability: data.user.celebrityProfile.availability,
          audioRatePerMin: data.user.celebrityProfile.audioRatePerMin,
          videoRatePerMin: data.user.celebrityProfile.videoRatePerMin,
        });
      }

      notify(
        'success',
        `Welcome ${data.user.displayName}! Logged into ${data.user.role} Home Page.`
      );
    } catch {
      notify('error', 'Failed to verify OTP with server.');
    }
  };

  // Logout & Clear Session Cookies
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {}
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('friends_tab_token');
    }
    clearSessionCookie('friends_client_token');
    resetRealtimeTrackingForUser();
    setActiveCall(null);
    setIncomingCalls([]);
    setTickets([]);
    setActiveTicketId('');
    setToken('');
    setCurrentUser(null);
    setOtpRequested(false);
    setOtpInput('');
    setDetectedAccountInfo(null);
    notify(
      'info',
      'Logged out of current account. You can now log in as another role (e.g. Customer Care +919876543240).'
    );
  };

  // Jump directly to a specific support chat ticket & clear its unread badge
  const handleOpenChatTicket = (ticketId?: string) => {
    setActiveTab('SUPPORT');
    const targetId =
      ticketId ||
      Object.keys(unreadByTicket)[0] ||
      activeTicketId ||
      tickets[0]?.id;

    if (targetId) {
      setActiveTicketId(targetId);
      setUnreadByTicket((prev) => {
        const next = { ...prev };
        delete next[targetId];
        return next;
      });
      setLiveChatAlerts((prev) =>
        prev.filter((alert) => alert.ticketId !== targetId)
      );
    }
    setTimeout(() => {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  // Accept an Incoming Call
  const handleAcceptIncomingCall = async (callId: string) => {
    try {
      const res = await fetch(`${API_BASE}/calls/${callId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        notify('error', data.error || 'Could not accept call');
        return;
      }

      const c = data.callSession;
      const isVideo =
        c.callType === 'RANDOM_VIDEO' || c.callType === 'CELEBRITY_VIDEO';

      setActiveCall({
        id: c.id,
        callType: c.callType,
        status: 'ACTIVE',
        direction: 'INCOMING',
        peerName: c.callerName,
        peerSubtitle:
          c.callType === 'SUPPORT_AUDIO'
            ? `Customer Care Audio Call with ${c.callerName} (${c.callerRole})`
            : `Live ${isVideo ? 'Video' : 'Audio'} Call with ${c.callerName}`,
        roomId: c.roomId,
        isVideo,
      });
      setIsCameraOn(isVideo);
      setIncomingCalls((prev) => prev.filter((item) => item.id !== callId));
      notify(
        'success',
        `Accepted call from ${c.callerName}! Microphone active.`
      );
    } catch {
      notify('error', 'Failed to accept incoming call');
    }
  };

  // Reject / Decline an Incoming Call
  const handleRejectIncomingCall = async (callId: string) => {
    try {
      await fetch(`${API_BASE}/calls/${callId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setIncomingCalls((prev) => prev.filter((item) => item.id !== callId));
      notify('info', 'Incoming call declined.');
    } catch {}
  };

  // End Active or Outgoing Ringing Call on Server
  const handleEndCall = async () => {
    if (activeCall?.id) {
      try {
        await fetch(`${API_BASE}/calls/${activeCall.id}/end`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }
    setActiveCall(null);
    notify('info', 'Call ended.');
  };

  // Call duration timer (counts up when call status is ACTIVE)
  useEffect(() => {
    if (!activeCall || activeCall.status !== 'ACTIVE') {
      setCallSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeCall]);

  // WebRTC Local Camera & Microphone handling when call is active or ringing
  useEffect(() => {
    async function startLocalMedia() {
      if (!activeCall) {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
        return;
      }

      if (
        typeof navigator !== 'undefined' &&
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia
      ) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: activeCall.isVideo,
          });
          mediaStreamRef.current = stream;
          if (localVideoRef.current && activeCall.isVideo) {
            localVideoRef.current.srcObject = stream;
          }
        } catch {
          // Fallback visual indicator if camera/mic permission is denied
        }
      }
    }
    startLocalMedia();
  }, [activeCall]);

  // Refresh data whenever user or location changes
  useEffect(() => {
    if (!token || !currentUser) return;
    fetchEvents();
    fetchCelebrities();
    fetchBookings();
    if (currentUser.role === 'SUPER_ADMIN') {
      fetchAdminOverview();
    }
  }, [token, selectedLocation, radiusKm, currentUser?.role]);

  const fetchEvents = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/events/nearby?lat=${selectedLocation.lat}&lng=${selectedLocation.lng}&radiusKm=${radiusKm}`
      );
      const data = await res.json();
      if (res.ok) setEvents(data.events || []);
    } catch {}
  };

  const fetchCelebrities = async () => {
    try {
      const res = await fetch(`${API_BASE}/celebrities`);
      const data = await res.json();
      if (res.ok) setCelebrities(data.celebrities || []);
    } catch {}
  };

  const fetchBookings = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/events/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setMyBookings(data.bookings || []);
    } catch {}
  };

  const fetchSupportTickets = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/support/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.tickets) {
        setTickets(data.tickets);
        if (!activeTicketId && data.tickets.length > 0) {
          setActiveTicketId(data.tickets[0].id);
        }
      }
    } catch {}
  };

  const fetchAdminOverview = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setAdminOverview(data);
    } catch {}
  };

  // 1. Start Random Friend Call (Supports BOTH Audio Call & Video Call between Normal Users)
  const handleStartRandomMatch = async (mode: 'AUDIO' | 'VIDEO') => {
    setRandomMode(mode);
    setIsMatching(true);
    try {
      const res = await fetch(`${API_BASE}/random/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      setIsMatching(false);

      if (!res.ok) {
        notify('error', data.error || 'Matchmaking failed');
        return;
      }

      setActiveCall({
        id: data.callSession.id,
        callType: mode === 'VIDEO' ? 'RANDOM_VIDEO' : 'RANDOM_AUDIO',
        status: 'ACTIVE',
        direction: 'OUTGOING',
        peerName: data.matchedFriend.displayName,
        peerSubtitle: `${data.matchedFriend.city} • ${data.matchedFriend.language} • Random Friend ${mode === 'VIDEO' ? 'Video' : 'Audio'} Call`,
        roomId: data.callSession.roomId,
        isVideo: mode === 'VIDEO',
      });
      setIsCameraOn(mode === 'VIDEO');
      notify(
        'success',
        `Matched with ${data.matchedFriend.displayName} for a live ${mode === 'VIDEO' ? 'Video' : 'Audio'} Call!`
      );
    } catch {
      setIsMatching(false);
      notify('error', 'Network error while connecting to matchmaking queue.');
    }
  };

  // 2. Book Event Ticket
  const handleBookEvent = async (eventId: string) => {
    try {
      const res = await fetch(`${API_BASE}/events/${eventId}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ticketCount: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify('error', data.error || 'Ticket booking failed');
        return;
      }
      notify('success', `Ticket Booked! QR Pass: ${data.booking.qrCodeHash}`);
      fetchEvents();
      fetchBookings();
    } catch {
      notify('error', 'Failed to book event ticket');
    }
  };

  // 3. Initiate Celebrity Call (Audio or Video — Requires Premium Plan; Rings Celebrity Account!)
  const handleCallCelebrity = async (
    celebrityId: string,
    celebrityName: string,
    mode: 'AUDIO' | 'VIDEO',
    ratePerMin: number
  ) => {
    try {
      const res = await fetch(
        `${API_BASE}/celebrities/${celebrityId}/call-initiate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ mode }),
        }
      );
      const data = await res.json();
      if (res.status === 403 && data.code === 'PREMIUM_REQUIRED') {
        setShowPremiumModal(true);
        notify(
          'info',
          'Premium Plan is required to Audio or Video call Celebrities!'
        );
        return;
      }
      if (!res.ok) {
        notify('error', data.error || 'Unable to start Celebrity call');
        return;
      }

      setCurrentUser((prev: any) => ({
        ...prev,
        walletCoins: data.callerRemainingCoins,
      }));
      setActiveCall({
        id: data.callSession.id,
        callType: mode === 'VIDEO' ? 'CELEBRITY_VIDEO' : 'CELEBRITY_AUDIO',
        status: 'RINGING',
        direction: 'OUTGOING',
        peerName: celebrityName,
        peerSubtitle: `Ringing ${celebrityName} • ${mode === 'VIDEO' ? 'Video' : 'Audio'} Call (${ratePerMin} Coins/min)`,
        roomId: data.callSession.roomId,
        isVideo: mode === 'VIDEO',
        ratePerMin,
      });
      setIsCameraOn(mode === 'VIDEO');
      notify('success', data.message);
    } catch {
      notify('error', 'Error initiating Celebrity call');
    }
  };

  // 4. Upgrade to Premium Plan
  const handleUpgradePremium = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/upgrade-premium`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planName: 'Gold VIP Pass (Celebrity Audio + Video Access)',
          bonusCoins: 500,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        setShowPremiumModal(false);
        notify('success', data.message);
      }
    } catch {
      notify('error', 'Failed to upgrade to Premium');
    }
  };

  // 5. Customer Care Support Audio Call (Strictly Audio Only — Rings Customer Care Account!)
  const handleSupportAudioCall = async (targetUserId?: string) => {
    try {
      const res = await fetch(`${API_BASE}/support/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mode: 'AUDIO', targetUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify('error', data.error || 'Support call failed');
        return;
      }
      setActiveCall({
        id: data.callSession.id,
        callType: 'SUPPORT_AUDIO',
        status: 'RINGING',
        direction: 'OUTGOING',
        peerName: data.callSession.receiverName,
        peerSubtitle:
          'Ringing Customer Care Support (Audio Call Only) — Open Customer Care (+919876543240) to Answer!',
        roomId: data.callSession.roomId,
        isVideo: false,
      });
      setIsCameraOn(false);
      notify(
        'success',
        `${data.message} (Log in as Customer Care +919876543240 in another tab or switch account to see & accept the incoming call!)`
      );
    } catch {
      notify('error', 'Could not start Customer Care Audio Call');
    }
  };

  // 6. Send Support Chat Message (Or Auto-Create Ticket if a new user doesn't have one yet)
  const handleSendSupportMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    try {
      if (!activeTicketId) {
        // Auto-create a support ticket so new users can chat immediately
        const res = await fetch(`${API_BASE}/support/tickets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subject: `Live Chat with ${currentUser?.displayName || 'User'}`,
            message: chatInput.trim(),
          }),
        });
        const data = await res.json();
        if (res.ok && data.ticket) {
          for (const m of data.ticket.messages || []) {
            seenMessageIdsRef.current.add(m.id);
          }
          setChatInput('');
          setActiveTicketId(data.ticket.id);
          fetchSupportTickets();
          setTimeout(() => {
            chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
        return;
      }

      const res = await fetch(
        `${API_BASE}/support/tickets/${activeTicketId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: chatInput.trim() }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        if (data.message?.id) {
          seenMessageIdsRef.current.add(data.message.id);
        }
        setChatInput('');
        fetchSupportTickets();
        setTimeout(() => {
          chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch {}
  };

  // 7. Create New Support Ticket
  const handleCreateSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketMsg.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/support/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: newTicketSubject,
          message: newTicketMsg,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ticket) {
        for (const m of data.ticket.messages || []) {
          seenMessageIdsRef.current.add(m.id);
        }
        setNewTicketSubject('');
        setNewTicketMsg('');
        fetchSupportTickets();
        setActiveTicketId(data.ticket.id);
        notify('success', 'Support ticket created!');
      }
    } catch {}
  };

  // 8. Organization: Create New Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cityCoords =
        KERALA_LOCATIONS.find(
          (l) => l.city.toLowerCase() === newEventForm.city.toLowerCase()
        ) || KERALA_LOCATIONS[0];

      const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newEventForm,
          latitude: cityCoords.lat,
          longitude: cityCoords.lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify('error', data.error || 'Failed to publish event');
        return;
      }
      notify('success', `Event "${data.event.title}" published!`);
      setNewEventForm({
        title: '',
        venueName: '',
        city: 'Kochi',
        category: 'Music Concert',
        ticketPrice: 399,
        totalCapacity: 300,
        description: '',
      });
      fetchEvents();
    } catch {
      notify('error', 'Failed to publish event');
    }
  };

  // 9. Celebrity: Upload Photo or Video & Update Availability/Rates
  const handleCelebrityMediaUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/celebrities/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newMediaForm),
      });
      const data = await res.json();
      if (res.ok) {
        notify(
          'success',
          `Uploaded new ${newMediaForm.mediaType} to your Celebrity profile!`
        );
        setNewMediaForm({ ...newMediaForm, caption: '' });
        fetchCelebrities();
      } else {
        notify('error', data.error || 'Upload failed');
      }
    } catch {}
  };

  const handleUpdateCelebrityAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/celebrities/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(celebRatesForm),
      });
      if (res.ok) {
        notify(
          'success',
          'Updated your Celebrity Call Availability & Per-Minute Rates!'
        );
        fetchCelebrities();
      }
    } catch {}
  };

  // 10. Super Admin: Restrict / Block or Unblock User
  const handleAdminRestrict = async (
    targetUserId: string,
    restrictionType: string
  ) => {
    try {
      const res = await fetch(
        `${API_BASE}/admin/users/${targetUserId}/restrict`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            restrictionType,
            status:
              restrictionType === 'BLOCK_ACCOUNT' ? 'BLOCKED' : 'LIMITED',
            reason: `Applied ${restrictionType} by Super Admin`,
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        notify('success', data.message);
        fetchAdminOverview();
      }
    } catch {}
  };

  const handleAdminUnblock = async (targetUserId: string) => {
    try {
      const res = await fetch(
        `${API_BASE}/admin/users/${targetUserId}/unblock`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        notify('success', data.message);
        fetchAdminOverview();
      }
    } catch {}
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const rem = (sec % 60).toString().padStart(2, '0');
    return `${mins}:${rem}`;
  };

  const activeTicket = tickets.find((t) => t.id === activeTicketId);

  if (isSessionChecking) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 mx-auto flex items-center justify-center font-bold text-xl animate-pulse">
            F
          </div>
          <p className="text-xs text-slate-400">Verifying session cookie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-lg shadow-lg">
              F
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight">
                  Friends App
                </h1>
                {currentUser && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                    {currentUser.role} PORTAL
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Random Audio/Video Connect • Celebrity Calls • Location Events •
                24/7 Support
              </p>
            </div>
          </div>

          {/* Device View Mode Switcher (Full Web vs iPhone iOS vs Android Native Preview) */}
          <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setPreviewDevice('WEB')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                previewDevice === 'WEB'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🌐 Desktop Web
            </button>
            <button
              onClick={() => setPreviewDevice('IPHONE')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                previewDevice === 'IPHONE'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📱 iPhone (iOS)
            </button>
            <button
              onClick={() => setPreviewDevice('ANDROID')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                previewDevice === 'ANDROID'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🤖 Android
            </button>
          </div>

          {/* Right Header: Live Unread Chat Counter + Sound Toggle + User Session + Logout */}
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              {/* Sound Chime Toggle */}
              <button
                type="button"
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  if (next) triggerSynthesizedSound('CHAT');
                }}
                className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition ${
                  soundEnabled
                    ? 'bg-slate-950 border-slate-800 text-emerald-400 hover:border-emerald-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
                title={
                  soundEnabled
                    ? 'Notification Sound ON (Click to mute)'
                    : 'Notification Sound Muted (Click to enable)'
                }
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>

              {/* TOP-RIGHT UNREAD CHAT NOTIFICATION BADGE (Visible from anywhere on the website!) */}
              <button
                type="button"
                onClick={() => handleOpenChatTicket()}
                className={`relative px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                  totalUnreadChatCount > 0
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/20 animate-pulse'
                    : 'bg-slate-950/90 border-slate-800 text-slate-300 hover:border-cyan-500/40 hover:text-white'
                }`}
                title="View Customer Care Live Chat Messages"
              >
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  {totalUnreadChatCount > 0 && (
                    <span className=" -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow">
                      {totalUnreadChatCount}
                    </span>
                  )}
                </div>
                <span className="hidden md:inline">
                  {totalUnreadChatCount > 0
                    ? `${totalUnreadChatCount} New Chat${totalUnreadChatCount > 1 ? 's' : ''}`
                    : 'Support Chat'}
                </span>
                {totalUnreadChatCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                    {totalUnreadChatCount}
                  </span>
                )}
              </button>

              <div className="hidden sm:flex items-center gap-2.5 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-slate-800">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-7 h-7 rounded-full object-cover"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-100 leading-none">
                    {currentUser.displayName}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {currentUser.phone} • {currentUser.walletCoins} Coins
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Mobile OTP Authentication</span>
            </div>
          )}
        </div>
      </header>

      {/* FLOATING TOP-RIGHT LIVE CHAT NOTIFICATION POPUPS (Appears automatically without page refresh!) */}
      {currentUser && liveChatAlerts.length > 0 && (
        <div className="fixed top-20 right-4 z-50 w-80 sm:w-96 space-y-2.5 pointer-events-auto">
          {liveChatAlerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-2xl border-2 border-cyan-400 bg-slate-900/95 backdrop-blur-md p-4 shadow-2xl shadow-cyan-950/60 space-y-2.5 animate-in fade-in slide-in-from-right-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shrink-0">
                    <Bell className="w-4 h-4 animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950">
                        NEW CHAT MESSAGE
                      </span>
                      <span className="text-[11px] text-cyan-300 font-semibold">
                        {alert.senderRole}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white mt-0.5">
                      {alert.senderName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setLiveChatAlerts((prev) =>
                      prev.filter((item) => item.id !== alert.id)
                    )
                  }
                  className="text-slate-400 hover:text-white p-1"
                  title="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200">
                <p className="text-[10px] text-slate-400 mb-0.5">
                  Ticket: {alert.ticketSubject}
                </p>
                <p className="font-medium line-clamp-2">{alert.content}</p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenChatTicket(alert.ticketId)}
                  className="w-full py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Open Chat & Reply (ചാറ്റ് കാണുക)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Notification Toast */}
      {statusBanner && (
        <div className="max-w-7xl mx-auto w-full px-4 pt-3">
          <div
            className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm border ${
              statusBanner.type === 'error'
                ? 'bg-rose-950/70 border-rose-700 text-rose-200'
                : statusBanner.type === 'info'
                  ? 'bg-amber-950/70 border-amber-700 text-amber-200'
                  : 'bg-emerald-950/70 border-emerald-700 text-emerald-200'
            }`}
          >
            <span>{statusBanner.text}</span>
            <button
              onClick={() => setStatusBanner(null)}
              className="text-xs underline ml-4 opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          SCREEN A: NOT LOGGED IN -> DEDICATED MOBILE NUMBER + OTP LOGIN / REGISTER SCREEN
         ===================================================================== */}
      {!currentUser ? (
        <main
          className={
            previewDevice === 'WEB'
              ? 'max-w-6xl mx-auto w-full px-4 py-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'
              : 'max-w-[430px] mx-auto w-full my-6 px-4 py-6 rounded-[44px] border-[8px] border-slate-800 bg-slate-950 shadow-2xl flex flex-col gap-6'
          }
        >
          {previewDevice !== 'WEB' && (
            <div className="flex flex-col items-center justify-center pb-2 border-b border-slate-800/80">
              <div
                className={
                  previewDevice === 'IPHONE'
                    ? 'w-28 h-6 rounded-full bg-black border border-slate-800 flex items-center justify-center text-[10px] text-sky-400 font-semibold'
                    : 'w-4 h-4 rounded-full bg-black border border-slate-700 mb-1'
                }
              >
                {previewDevice === 'IPHONE' ? 'iOS Dynamic Island' : ''}
              </div>
              <span className="text-[11px] font-bold text-slate-400 mt-1">
                {previewDevice === 'IPHONE'
                  ? '📱 iPhone 16 Pro • Native iOS Login'
                  : '🤖 Android 15 • Native Login'}
              </span>
            </div>
          )}

          {/* Left Column: Mobile Number + OTP Login & Registration Card */}
          <div
            className={
              previewDevice === 'WEB'
                ? 'lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-7 shadow-2xl space-y-6'
                : 'rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-5'
            }
          >
            {/* Login vs Register Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('LOGIN');
                  setOtpRequested(false);
                }}
                className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  authMode === 'LOGIN'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Login (ലോഗിൻ)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('REGISTER');
                  setOtpRequested(false);
                }}
                className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  authMode === 'REGISTER'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Register (പുതിയ അക്കൗണ്ട്)
              </button>
            </div>

            <div>
              <h2 className="text-xl font-bold">
                {authMode === 'LOGIN'
                  ? 'Sign in with Mobile Number & OTP'
                  : 'Create a New Friends App Account'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {authMode === 'LOGIN'
                  ? 'നിങ്ങളുടെ മൊബൈൽ നമ്പറും ഒടിപിയും നൽകുമ്പോൾ ആ നമ്പറിലുള്ള യൂസറുടെ (User / Celebrity / Organization / Support / Super Admin) ഹോം പേജിലേക്ക് നേരിട്ട് പ്രവേശിക്കും.'
                  : 'മൊബൈൽ നമ്പറും ഒടിപിയും ഉപയോഗിച്ച് പുതിയ അക്കൗണ്ട് രജിസ്റ്റർ ചെയ്യാം.'}
              </p>
            </div>

            <form onSubmit={handleVerifyOtpAndLogin} className="space-y-4">
              {/* Mobile Number Input + Get OTP Button */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Mobile Number (മൊബൈൽ നമ്പർ)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={phoneInput}
                    onChange={(e) => {
                      setPhoneInput(e.target.value);
                      setOtpRequested(false);
                    }}
                    placeholder="+919876543210"
                    className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-bold transition shrink-0"
                  >
                    Get OTP
                  </button>
                </div>
              </div>

              {/* Registration Fields */}
              {authMode === 'REGISTER' && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-950/90 border border-slate-800">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Select Account Type (അക്കൗണ്ട് തരം)
                    </label>
                    <select
                      value={registerRole}
                      onChange={(e) =>
                        setRegisterRole(e.target.value as UserRole)
                      }
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs"
                    >
                      <option value="USER">
                        Normal User (ഫ്രണ്ട്സ് കണക്ട് & ഇവന്റ് ബുക്കിങ്)
                      </option>
                      <option value="CELEBRITY">
                        Celebrity Account (സെലിബ്രിറ്റി അക്കൗണ്ട്)
                      </option>
                      <option value="ORGANIZATION">
                        Organization / Event Company (ഇവന്റ് കമ്പനി)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Full Name / Organization Name
                    </label>
                    <input
                      type="text"
                      required
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      City / Location (ലൊക്കേഷൻ)
                    </label>
                    <select
                      value={registerCity}
                      onChange={(e) => setRegisterCity(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs"
                    >
                      <option value="Kochi">Kochi</option>
                      <option value="Trivandrum">Trivandrum</option>
                      <option value="Kozhikode">Kozhikode</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Detected User Badge after clicking Get OTP */}
              {detectedAccountInfo && (
                <div className="p-3.5 rounded-xl bg-indigo-950/50 border border-indigo-500/40 text-xs space-y-1">
                  {detectedAccountInfo.isExistingUser ? (
                    <>
                      <p className="font-bold text-indigo-200">
                        Account Found: {detectedAccountInfo.existingName}
                      </p>
                      <p className="text-indigo-300">
                        Role:{' '}
                        <span className="font-mono font-bold">
                          {detectedAccountInfo.existingRole}
                        </span>{' '}
                        • Dummy OTP:{' '}
                        <span className="font-mono font-bold text-emerald-400">
                          {detectedAccountInfo.demoOtp}
                        </span>
                      </p>
                    </>
                  ) : (
                    <p className="text-amber-300">
                      New Mobile Number! Enter OTP{' '}
                      <strong className="font-mono">
                        {detectedAccountInfo.demoOtp}
                      </strong>{' '}
                      to create & login.
                    </p>
                  )}
                </div>
              )}

              {/* 6-Digit OTP Input */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  6-Digit OTP (ഒടിപി)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="Enter 6-digit OTP (e.g. 111111)"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-10 pr-4 py-2.5 text-sm font-mono tracking-widest focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg transition"
              >
                {authMode === 'LOGIN'
                  ? 'Verify OTP & Login to Home Page'
                  : 'Verify OTP & Create Account'}
              </button>
            </form>
          </div>

          {/* Right Column: Dummy Mobile Numbers & OTPs Directory for Testing All 5 Roles */}
          <div
            className={
              previewDevice === 'WEB'
                ? 'lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-900/50 p-7 space-y-5'
                : 'rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-4'
            }
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Test Credentials Directory (ഡമ്മി മൊബൈൽ നമ്പറുകളും ഒടിപിയും)
              </span>
              <h3 className="text-lg font-bold mt-1">
                Mobile Numbers & Dummy OTPs for Each User Role
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                ഓരോ യൂസർ റോളിലും ലോഗിൻ ചെയ്ത് അവരുടെ ഹോം പേജ് കാണാൻ താഴെ കൊടുത്തിരിക്കുന്ന മൊബൈൽ നമ്പറും ഒടിപിയും ഉപയോഗിക്കുക:
              </p>
            </div>

            <div className="space-y-2.5">
              {PRE_SEEDED_TEST_ACCOUNTS.map((acc) => (
                <div
                  key={acc.phone}
                  className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/90 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${acc.badgeColor}`}
                      >
                        {acc.role}
                      </span>
                      <span className="font-bold text-sm text-white">
                        {acc.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{acc.desc}</p>
                    <div className="flex items-center gap-4 text-xs pt-0.5">
                      <span className="font-mono text-slate-200">
                        📱 Mobile: <strong>{acc.phone}</strong>
                      </span>
                      <span className="font-mono text-emerald-400">
                        🔑 OTP: <strong>{acc.otp}</strong>
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('LOGIN');
                      setPhoneInput(acc.phone);
                      setOtpInput(acc.otp);
                      handleSendOtp(undefined, acc.phone);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Fill Mobile & OTP
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      ) : (
        /* =====================================================================
           SCREEN B: LOGGED-IN USER -> ROLE-SPECIFIC HOME PAGE & WORKSPACE
           ===================================================================== */
        <>
          {/* 1. REAL-TIME INCOMING CALL ALERT BANNER (FOR CUSTOMER CARE, CELEBRITY, OR USER) */}
          {incomingCalls.length > 0 && (
            <div className="max-w-7xl mx-auto w-full px-4 pt-4 space-y-3">
              {incomingCalls.map((inc) => (
                <div
                  key={inc.id}
                  className="rounded-2xl border-2 border-emerald-500 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300">
                      <PhoneIncoming className="w-7 h-7 animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-slate-950 uppercase">
                          INCOMING {inc.callType.replace('_', ' ')} (ഇൻകമിംഗ് കോൾ)
                        </span>
                        <span className="text-xs text-emerald-300 font-semibold">
                          From {inc.callerRole}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-1">
                        {inc.callerName} is calling you...
                      </h3>
                      <p className="text-xs text-slate-300">
                        {inc.callType === 'SUPPORT_AUDIO'
                          ? 'Customer Care Audio Support Call (Audio Only — Click Accept to talk)'
                          : `Incoming ${inc.callType.includes('VIDEO') ? 'Video' : 'Audio'} Call`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleAcceptIncomingCall(inc.id)}
                      className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition"
                    >
                      <Phone className="w-4 h-4" />
                      Accept Call (കോൾ എടുക്കുക)
                    </button>
                    <button
                      onClick={() => handleRejectIncomingCall(inc.id)}
                      className="px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition"
                    >
                      <PhoneOff className="w-4 h-4" />
                      Decline (നിരസിക്കുക)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. ACTIVE OR OUTGOING RINGING WEBRTC CALL OVERLAY */}
          {activeCall && (
            <div className="max-w-7xl mx-auto w-full px-4 pt-4">
              <div
                className={`rounded-2xl border p-5 shadow-2xl ${
                  activeCall.status === 'RINGING'
                    ? 'border-amber-500/50 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900'
                    : 'border-indigo-500/40 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900'
                }`}
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-400 flex items-center justify-center">
                        {activeCall.isVideo ? (
                          <Video className="w-8 h-8 text-indigo-300 animate-pulse" />
                        ) : (
                          <PhoneCall className="w-8 h-8 text-emerald-300 animate-pulse" />
                        )}
                      </div>
                      <span
                        className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          activeCall.status === 'RINGING'
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-emerald-500 text-slate-950'
                        }`}
                      >
                        {activeCall.status}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {activeCall.callType.replace('_', ' ')}
                        </span>
                        {activeCall.status === 'ACTIVE' ? (
                          <span className="text-sm font-mono text-emerald-400">
                            {formatDuration(callSeconds)}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-300 animate-pulse">
                            🔔 Ringing on receiver&apos;s screen...
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold mt-1">
                        {activeCall.peerName}
                      </h3>
                      <p className="text-xs text-slate-300">
                        {activeCall.peerSubtitle}
                      </p>
                    </div>
                  </div>

                  {/* Video Streams (Shown only for RANDOM_VIDEO and CELEBRITY_VIDEO; never for SUPPORT_AUDIO) */}
                  {activeCall.isVideo && (
                    <div className="flex items-center gap-3">
                      <div className="relative w-44 h-28 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 flex items-center justify-center">
                        {isCameraOn ? (
                          <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-xs text-slate-500 flex flex-col items-center gap-1">
                            <VideoOff className="w-5 h-5" />
                            <span>Camera Off</span>
                          </div>
                        )}
                        <span className="absolute bottom-1.5 left-2 text-[10px] bg-black/70 px-1.5 py-0.5 rounded text-white">
                          You ({currentUser?.displayName})
                        </span>
                      </div>
                      <div className="relative w-44 h-28 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/40 flex flex-col items-center justify-center">
                        <Video className="w-6 h-6 text-indigo-300 mb-1" />
                        <span className="text-xs font-medium text-indigo-100">
                          {activeCall.peerName}
                        </span>
                        <span className="text-[10px] text-indigo-300">
                          {activeCall.status === 'ACTIVE'
                            ? 'HD WebRTC Video Connected'
                            : 'Waiting for Answer...'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Call Controls */}
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`p-3 rounded-xl border transition ${
                        isMuted
                          ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                      }`}
                      title="Toggle Microphone"
                    >
                      {isMuted ? (
                        <MicOff className="w-5 h-5" />
                      ) : (
                        <Mic className="w-5 h-5" />
                      )}
                    </button>

                    {activeCall.isVideo && (
                      <button
                        onClick={() => setIsCameraOn(!isCameraOn)}
                        className={`p-3 rounded-xl border transition ${
                          !isCameraOn
                            ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                            : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                        }`}
                        title="Toggle Camera"
                      >
                        {isCameraOn ? (
                          <Video className="w-5 h-5" />
                        ) : (
                          <VideoOff className="w-5 h-5" />
                        )}
                      </button>
                    )}

                    {(activeCall.callType === 'RANDOM_AUDIO' ||
                      activeCall.callType === 'RANDOM_VIDEO') && (
                      <button
                        onClick={() =>
                          handleStartRandomMatch(
                            activeCall.isVideo ? 'VIDEO' : 'AUDIO'
                          )
                        }
                        className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Next Friend
                      </button>
                    )}

                    <button
                      onClick={handleEndCall}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg"
                    >
                      <PhoneOff className="w-4 h-4" />
                      End Call
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Logged-In Role-Specific Home Container */}
          <main
            className={
              previewDevice === 'WEB'
                ? 'max-w-7xl mx-auto w-full px-4 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6'
                : 'max-w-[430px] mx-auto w-full my-6 px-4 py-6 rounded-[44px] border-[8px] border-slate-800 bg-slate-950 shadow-2xl flex flex-col gap-5 relative'
            }
          >
            {previewDevice !== 'WEB' && (
              <div className="flex flex-col items-center justify-center pb-2 border-b border-slate-800/80">
                <div
                  className={
                    previewDevice === 'IPHONE'
                      ? 'w-28 h-6 rounded-full bg-black border border-slate-800 flex items-center justify-center text-[10px] text-sky-400 font-semibold'
                      : 'w-4 h-4 rounded-full bg-black border border-slate-700 mb-1'
                  }
                >
                  {previewDevice === 'IPHONE' ? 'iOS Dynamic Island' : ''}
                </div>
                <span className="text-[11px] font-bold text-slate-400 mt-1">
                  {previewDevice === 'IPHONE'
                    ? '📱 iPhone 16 Pro • Native iOS SwiftUI Preview'
                    : '🤖 Android 15 • Jetpack Compose Preview'}
                </span>
              </div>
            )}

            {/* Left Sidebar: Current Logged-In Account Card */}
            <aside
              className={
                previewDevice === 'WEB'
                  ? 'lg:col-span-3 space-y-5'
                  : 'space-y-4'
              }
            >
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.displayName}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-700"
                  />
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {currentUser.role}
                    </span>
                    <h2 className="font-bold text-base mt-1">
                      {currentUser.displayName}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                      {currentUser.phone}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block">Account Tier</span>
                    <span
                      className={`font-bold flex items-center gap-1 mt-0.5 ${
                        currentUser.isPremium
                          ? 'text-amber-400'
                          : 'text-slate-200'
                      }`}
                    >
                      {currentUser.isPremium ? (
                        <>
                          <Crown className="w-3.5 h-3.5" /> Premium VIP
                        </>
                      ) : (
                        'Standard Free'
                      )}
                    </span>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block">Wallet Coins</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                      <Coins className="w-3.5 h-3.5" /> {currentUser.walletCoins}
                    </span>
                  </div>
                </div>

                {/* Quick Unread Chat Summary Card in Sidebar */}
                <button
                  type="button"
                  onClick={() => handleOpenChatTicket()}
                  className={`w-full p-3 rounded-xl border text-left text-xs flex items-center justify-between transition ${
                    totalUnreadChatCount > 0
                      ? 'bg-cyan-950/60 border-cyan-400 text-cyan-100'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    Unread Support Chats
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-extrabold text-[11px] ${
                      totalUnreadChatCount > 0
                        ? 'bg-rose-500 text-white animate-bounce'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {totalUnreadChatCount}
                  </span>
                </button>

                {!currentUser.isPremium && currentUser.role === 'USER' && (
                  <button
                    onClick={() => setShowPremiumModal(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:brightness-110 transition"
                  >
                    <Crown className="w-4 h-4" />
                    Upgrade to Premium (Celebrity Calls)
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-rose-950/60 text-slate-300 hover:text-rose-200 border border-slate-800 hover:border-rose-700 text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out / Switch Account
                </button>
              </div>

              {/* Multi-Tab / Real-Time Chat & Call Tip */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-2 text-xs">
                <h4 className="font-semibold text-indigo-300">
                  💡 Live Two-Way Chat & Audio Call
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Open <strong>http://localhost:3005</strong> in 2 tabs (e.g.
                  User in Tab 1,{' '}
                  <strong className="text-cyan-300">
                    Customer Care +919876543240 (OTP: 555555)
                  </strong>{' '}
                  in Tab 2). Messages and calls appear live with sound &amp;
                  unread count badges without refreshing!
                </p>
              </div>
            </aside>

            {/* Right Main Role-Specific Workspace */}
            <section
              className={
                previewDevice === 'WEB'
                  ? 'lg:col-span-9 space-y-6'
                  : 'space-y-5'
              }
            >
              {/* Role-Specific Navigation Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
                {/* 1. NORMAL USER TABS */}
                {currentUser.role === 'USER' && (
                  <>
                    <button
                      onClick={() => setActiveTab('RANDOM_CONNECT')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                        activeTab === 'RANDOM_CONNECT'
                          ? 'bg-indigo-600 text-white shadow-lg'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Radio className="w-4 h-4" />
                      Random Friend Connect (Audio & Video)
                    </button>
                    <button
                      onClick={() => setActiveTab('CELEBRITIES')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                        activeTab === 'CELEBRITIES'
                          ? 'bg-pink-600 text-white shadow-lg'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      Celebrities (Photos, Videos & Calls)
                    </button>
                    <button
                      onClick={() => setActiveTab('EVENTS')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                        activeTab === 'EVENTS'
                          ? 'bg-emerald-600 text-white shadow-lg'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      Nearby Events & Tickets
                    </button>
                    <button
                      onClick={() => handleOpenChatTicket()}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                        activeTab === 'SUPPORT'
                          ? 'bg-cyan-600 text-white shadow-lg'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Headphones className="w-4 h-4" />
                      <span>Customer Care (Audio & Chat)</span>
                      {totalUnreadChatCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-bounce">
                          {totalUnreadChatCount}
                        </span>
                      )}
                    </button>
                  </>
                )}

                {/* 2. CELEBRITY TABS */}
                {currentUser.role === 'CELEBRITY' && (
                  <>
                    <button
                      onClick={() => setActiveTab('CELEBRITY_STUDIO')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                        activeTab === 'CELEBRITY_STUDIO'
                          ? 'bg-pink-600 text-white shadow-lg'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      Celebrity Studio (Upload Photos/Videos & Call Rates)
                    </button>
                    <button
                      onClick={() => setActiveTab('CELEBRITIES')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                        activeTab === 'CELEBRITIES'
                          ? 'bg-indigo-600 text-white shadow-lg'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      My Public Profile & Media Gallery
                    </button>
                    <button
                      onClick={() => handleOpenChatTicket()}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                        activeTab === 'SUPPORT'
                          ? 'bg-cyan-600 text-white shadow-lg'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Headphones className="w-4 h-4" />
                      <span>Customer Care Support (Audio & Chat)</span>
                      {totalUnreadChatCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-bounce">
                          {totalUnreadChatCount}
                        </span>
                      )}
                    </button>
                  </>
                )}

                {/* 3. ORGANIZATION TABS */}
                {currentUser.role === 'ORGANIZATION' && (
                  <>
                    <button
                      onClick={() => setActiveTab('ORG_EVENTS')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                        activeTab === 'ORG_EVENTS'
                          ? 'bg-emerald-600 text-white shadow-lg'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      Post New Event (ഇവന്റ് പോസ്റ്റ് ചെയ്യുക)
                    </button>
                    <button
                      onClick={() => setActiveTab('EVENTS')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                        activeTab === 'EVENTS'
                          ? 'bg-indigo-600 text-white shadow-lg'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Ticket className="w-4 h-4" />
                      Listed Events & Ticket Bookings
                    </button>
                    <button
                      onClick={() => handleOpenChatTicket()}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                        activeTab === 'SUPPORT'
                          ? 'bg-cyan-600 text-white shadow-lg'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Headphones className="w-4 h-4" />
                      <span>Customer Care Support</span>
                      {totalUnreadChatCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-bounce">
                          {totalUnreadChatCount}
                        </span>
                      )}
                    </button>
                  </>
                )}

                {/* 4. CUSTOMER CARE SUPPORT TABS */}
                {currentUser.role === 'SUPPORT' && (
                  <button
                    onClick={() => setActiveTab('SUPPORT')}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 bg-cyan-600 text-white shadow-lg"
                  >
                    <Headphones className="w-4 h-4" />
                    <span>
                      Customer Care Agent Console (Incoming Calls & Live Chat)
                    </span>
                    {totalUnreadChatCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-bounce">
                        {totalUnreadChatCount} New
                      </span>
                    )}
                  </button>
                )}

                {/* 5. SUPER ADMIN TABS */}
                {currentUser.role === 'SUPER_ADMIN' && (
                  <>
                    <button
                      onClick={() => setActiveTab('ADMIN_CONTROL')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                        activeTab === 'ADMIN_CONTROL'
                          ? 'bg-rose-600 text-white shadow-lg'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4" />
                      Super Admin Moderation & Restrictions
                    </button>
                    <button
                      onClick={() => setActiveTab('EVENTS')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                        activeTab === 'EVENTS'
                          ? 'bg-emerald-600 text-white shadow-lg'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      All Platform Events
                    </button>
                    <button
                      onClick={() => setActiveTab('CELEBRITIES')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                        activeTab === 'CELEBRITIES'
                          ? 'bg-pink-600 text-white shadow-lg'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      All Celebrities
                    </button>
                    <button
                      onClick={() => handleOpenChatTicket()}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                        activeTab === 'SUPPORT'
                          ? 'bg-cyan-600 text-white shadow-lg'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>Support Tickets & Call Queue</span>
                      {totalUnreadChatCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                          {totalUnreadChatCount}
                        </span>
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* VIEW: RANDOM FRIEND CONNECT (NORMAL USER) */}
              {activeTab === 'RANDOM_CONNECT' && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
                  <div>
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                      Random Friend Discovery (റാണ്ടം ഫ്രണ്ട് കണക്ട്)
                    </span>
                    <h2 className="text-2xl font-bold mt-1">
                      Connect with Online Friends via Live Audio or Video Call
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                      ഓൺലൈനിലുള്ള മറ്റ് ഫ്രണ്ട്സുമായി റാണ്ടമായി ഓഡിയോ കോളോ വീഡിയോ കോളോ വഴി തത്സമയം സംസാരിക്കാം.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 flex flex-col justify-between space-y-5 hover:border-indigo-500/50 transition">
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                          <Phone className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold">
                          Random Audio Call (ഓഡിയോ കോൾ)
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Voice-only matchmaking with another online user. Safe,
                          fast, and crystal-clear WebRTC audio stream.
                        </p>
                      </div>
                      <button
                        onClick={() => handleStartRandomMatch('AUDIO')}
                        disabled={isMatching}
                        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition"
                      >
                        <Phone className="w-4 h-4" />
                        {isMatching && randomMode === 'AUDIO'
                          ? 'Searching Online Friends...'
                          : 'Start Random Audio Call'}
                      </button>
                    </div>

                    <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-6 flex flex-col justify-between space-y-5 hover:border-purple-500/60 transition">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                            <Video className="w-6 h-6" />
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            USER ↔ USER VIDEO
                          </span>
                        </div>
                        <h3 className="text-lg font-bold">
                          Random Video Call (വീഡിയോ കോൾ)
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Face-to-face live WebRTC video call with random online
                          friends. Includes camera toggle, mic mute, and instant
                          &ldquo;Next Friend&rdquo; skip.
                        </p>
                      </div>
                      <button
                        onClick={() => handleStartRandomMatch('VIDEO')}
                        disabled={isMatching}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition"
                      >
                        <Video className="w-4 h-4" />
                        {isMatching && randomMode === 'VIDEO'
                          ? 'Matching Video Partner...'
                          : 'Start Random Video Call'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW: CELEBRITY STUDIO (ONLY FOR LOGGED-IN CELEBRITY ROLE) */}
              {activeTab === 'CELEBRITY_STUDIO' &&
                currentUser.role === 'CELEBRITY' && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-pink-500/30 bg-slate-900/70 p-6 space-y-5">
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-pink-400" />
                        <div>
                          <h2 className="text-xl font-bold">
                            Celebrity Studio — {currentUser.displayName}
                          </h2>
                          <p className="text-xs text-slate-400">
                            നിങ്ങളുടെ ഫോട്ടോസും വീഡിയോസും പോസ്റ്റ് ചെയ്യാം, ഓഡിയോ/വീഡിയോ കോൾ നിരക്കുകളും സ്റ്റാറ്റസും ക്രമീകരിക്കാം.
                          </p>
                        </div>
                      </div>

                      <form
                        onSubmit={handleCelebrityMediaUpload}
                        className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800"
                      >
                        <select
                          value={newMediaForm.mediaType}
                          onChange={(e) =>
                            setNewMediaForm({
                              ...newMediaForm,
                              mediaType: e.target.value as 'PHOTO' | 'VIDEO',
                            })
                          }
                          className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs"
                        >
                          <option value="PHOTO">Upload Photo (ഫോട്ടോ)</option>
                          <option value="VIDEO">Upload Video (വീഡിയോ)</option>
                        </select>
                        <input
                          type="text"
                          value={newMediaForm.url}
                          onChange={(e) =>
                            setNewMediaForm({
                              ...newMediaForm,
                              url: e.target.value,
                            })
                          }
                          placeholder="Photo / Video URL"
                          className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs"
                        />
                        <input
                          type="text"
                          required
                          value={newMediaForm.caption}
                          onChange={(e) =>
                            setNewMediaForm({
                              ...newMediaForm,
                              caption: e.target.value,
                            })
                          }
                          placeholder="Caption for fans..."
                          className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs"
                        />
                        <button
                          type="submit"
                          className="md:col-span-3 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs flex items-center justify-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          Publish Photo / Video to My Celebrity Feed
                        </button>
                      </form>

                      <form
                        onSubmit={handleUpdateCelebrityAvailability}
                        className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800"
                      >
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">
                            Call Availability Status
                          </label>
                          <select
                            value={celebRatesForm.availability}
                            onChange={(e) =>
                              setCelebRatesForm({
                                ...celebRatesForm,
                                availability: e.target.value,
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs"
                          >
                            <option value="AVAILABLE">
                              AVAILABLE (Ready for Fan Calls)
                            </option>
                            <option value="BUSY">BUSY</option>
                            <option value="OFFLINE">OFFLINE</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">
                            Audio Call Rate (Coins/min)
                          </label>
                          <input
                            type="number"
                            value={celebRatesForm.audioRatePerMin}
                            onChange={(e) =>
                              setCelebRatesForm({
                                ...celebRatesForm,
                                audioRatePerMin: Number(e.target.value),
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">
                            Video Call Rate (Coins/min)
                          </label>
                          <input
                            type="number"
                            value={celebRatesForm.videoRatePerMin}
                            onChange={(e) =>
                              setCelebRatesForm({
                                ...celebRatesForm,
                                videoRatePerMin: Number(e.target.value),
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs"
                          />
                        </div>
                        <button
                          type="submit"
                          className="md:col-span-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
                        >
                          Save Availability & Per-Minute Call Rates
                        </button>
                      </form>
                    </div>
                  </div>
                )}

              {/* VIEW: ORGANIZATION EVENT PUBLISHER */}
              {activeTab === 'ORG_EVENTS' &&
                currentUser.role === 'ORGANIZATION' && (
                  <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/70 p-6 space-y-5">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-6 h-6 text-emerald-400" />
                      <div>
                        <h2 className="text-xl font-bold">
                          Organization Event Publisher (
                          {currentUser.displayName})
                        </h2>
                        <p className="text-xs text-slate-400">
                          നിങ്ങളുടെ കമ്പനിയുടെ പുതിയ ഇവന്റുകൾ പോസ്റ്റ് ചെയ്യാനും ടിക്കറ്റ് ബുക്കിങ്ങുകൾ മാനേജ് ചെയ്യാനും സാധിക്കും.
                        </p>
                      </div>
                    </div>

                    <form
                      onSubmit={handleCreateEvent}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2"
                    >
                      <input
                        type="text"
                        required
                        value={newEventForm.title}
                        onChange={(e) =>
                          setNewEventForm({
                            ...newEventForm,
                            title: e.target.value,
                          })
                        }
                        placeholder="Event Title (e.g. Kochi Indie Music Night)"
                        className="rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs"
                      />
                      <input
                        type="text"
                        required
                        value={newEventForm.venueName}
                        onChange={(e) =>
                          setNewEventForm({
                            ...newEventForm,
                            venueName: e.target.value,
                          })
                        }
                        placeholder="Venue Name (e.g. JLN Stadium Grounds)"
                        className="rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs"
                      />
                      <select
                        value={newEventForm.city}
                        onChange={(e) =>
                          setNewEventForm({
                            ...newEventForm,
                            city: e.target.value,
                          })
                        }
                        className="rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs"
                      >
                        <option value="Kochi">Kochi</option>
                        <option value="Trivandrum">Trivandrum</option>
                        <option value="Kozhikode">Kozhikode</option>
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={newEventForm.ticketPrice}
                          onChange={(e) =>
                            setNewEventForm({
                              ...newEventForm,
                              ticketPrice: Number(e.target.value),
                            })
                          }
                          placeholder="Ticket Price (₹)"
                          className="rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs"
                        />
                        <input
                          type="number"
                          value={newEventForm.totalCapacity}
                          onChange={(e) =>
                            setNewEventForm({
                              ...newEventForm,
                              totalCapacity: Number(e.target.value),
                            })
                          }
                          placeholder="Total Capacity"
                          className="rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs"
                        />
                      </div>
                      <textarea
                        value={newEventForm.description}
                        onChange={(e) =>
                          setNewEventForm({
                            ...newEventForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Event description & highlights..."
                        className="md:col-span-2 rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs"
                        rows={2}
                      />
                      <button
                        type="submit"
                        className="md:col-span-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg"
                      >
                        Publish Location-Tagged Event
                      </button>
                    </form>
                  </div>
                )}

              {/* VIEW: CELEBRITIES LOUNGE */}
              {activeTab === 'CELEBRITIES' && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold text-pink-400 uppercase tracking-wider">
                        Verified Celebrity Lounge (സെലിബ്രിറ്റി പ്രൊഫൈലുകൾ)
                      </span>
                      <h2 className="text-2xl font-bold mt-1">
                        Explore Celebrity Photos, Videos & Direct Audio/Video
                        Calls
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        പ്രീമിയം അക്കൗണ്ട് ഉള്ള യൂസേഴ്സിന് സെലിബ്രിറ്റികളെ നേരിട്ട് ഓഡിയോ കോളോ വീഡിയോ കോളോ ചെയ്യാൻ സാധിക്കും.
                      </p>
                    </div>
                    {!currentUser?.isPremium && currentUser?.role === 'USER' && (
                      <button
                        onClick={() => setShowPremiumModal(true)}
                        className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shrink-0"
                      >
                        <Crown className="w-4 h-4" />
                        Unlock Premium Calling
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {celebrities.map((celeb) => (
                      <div
                        key={celeb.id}
                        className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden flex flex-col justify-between"
                      >
                        <div className="p-5 space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={celeb.avatarUrl}
                                alt={celeb.displayName}
                                className="w-16 h-16 rounded-2xl object-cover border border-pink-500/40"
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h3 className="font-bold text-base">
                                    {celeb.displayName}
                                  </h3>
                                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                                </div>
                                <p className="text-xs text-pink-400 font-medium">
                                  {celeb.category}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {celeb.followersCount.toLocaleString()}{' '}
                                  followers • {celeb.city}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                celeb.availability === 'AVAILABLE'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {celeb.availability}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            {celeb.bio}
                          </p>

                          <div className="space-y-2">
                            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                              Photos & Videos ({celeb.mediaGallery?.length || 0}
                              )
                            </h4>
                            <div className="grid grid-cols-2 gap-2.5">
                              {(celeb.mediaGallery || []).map((media: any) => (
                                <div
                                  key={media.id}
                                  className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 h-32"
                                >
                                  <img
                                    src={
                                      media.mediaType === 'VIDEO'
                                        ? media.thumbnailUrl || media.url
                                        : media.url
                                    }
                                    alt={media.caption}
                                    className="w-full h-full object-cover group-hover:scale-105 transition"
                                  />
                                  <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded bg-black/75 text-white">
                                    {media.mediaType}
                                  </span>
                                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2">
                                    <p className="text-[11px] text-slate-100 line-clamp-1">
                                      {media.caption}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-950/90 border-t border-slate-800 grid grid-cols-2 gap-3">
                          <button
                            onClick={() =>
                              handleCallCelebrity(
                                celeb.id,
                                celeb.displayName,
                                'AUDIO',
                                celeb.audioRatePerMin
                              )
                            }
                            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
                          >
                            <Phone className="w-4 h-4 text-indigo-400" />
                            <span>Audio Call ({celeb.audioRatePerMin}/m)</span>
                          </button>
                          <button
                            onClick={() =>
                              handleCallCelebrity(
                                celeb.id,
                                celeb.displayName,
                                'VIDEO',
                                celeb.videoRatePerMin
                              )
                            }
                            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow transition"
                          >
                            <Video className="w-4 h-4" />
                            <span>Video Call ({celeb.videoRatePerMin}/m)</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VIEW: LOCATION-BASED EVENTS & TICKET BOOKING */}
              {activeTab === 'EVENTS' && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                        Location-Based Event Discovery (ലൊക്കേഷൻ അനുസരിച്ചുള്ള ഇവന്റുകൾ)
                      </span>
                      <h2 className="text-2xl font-bold mt-1">
                        Upcoming Events Near {selectedLocation.city}
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        നിങ്ങളുടെ ലൊക്കേഷന് അടുത്തുള്ള ഇവന്റുകൾ കാണാനും ടിക്കറ്റ് ബുക്ക് ചെയ്യാനും സാധിക്കും.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={selectedLocation.city}
                        onChange={(e) => {
                          const loc =
                            KERALA_LOCATIONS.find(
                              (l) => l.city === e.target.value
                            ) || KERALA_LOCATIONS[0];
                          setSelectedLocation(loc);
                        }}
                        className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-medium"
                      >
                        {KERALA_LOCATIONS.map((loc) => (
                          <option key={loc.city} value={loc.city}>
                            📍 {loc.label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={radiusKm}
                        onChange={(e) => setRadiusKm(Number(e.target.value))}
                        className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-medium"
                      >
                        <option value={30}>Within 30 km</option>
                        <option value={60}>Within 60 km</option>
                        <option value={500}>All Kerala (500 km)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {events.map((evt) => (
                      <div
                        key={evt.id}
                        className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative h-40 bg-slate-950">
                            <img
                              src={evt.bannerUrl}
                              alt={evt.title}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full bg-black/80 text-emerald-300 border border-emerald-500/30">
                              📍 {evt.distanceKm} km away • {evt.city}
                            </span>
                            <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-600 text-white">
                              ₹{evt.ticketPrice}
                            </span>
                          </div>
                          <div className="p-5 space-y-2">
                            <span className="text-[11px] text-emerald-400 font-semibold uppercase">
                              {evt.category} • Hosted by {evt.organizationName}
                            </span>
                            <h3 className="text-lg font-bold">{evt.title}</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              {evt.description}
                            </p>
                            <div className="pt-2 flex flex-wrap gap-3 text-xs text-slate-300">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                {evt.venueName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                {new Date(evt.startTime).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-xs text-slate-400">
                            <strong className="text-slate-200">
                              {evt.totalCapacity - evt.bookedCount}
                            </strong>{' '}
                            / {evt.totalCapacity} seats left
                          </span>
                          <button
                            onClick={() => handleBookEvent(evt.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow transition"
                          >
                            <Ticket className="w-4 h-4" />
                            Book Ticket (₹{evt.ticketPrice})
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {myBookings.length > 0 && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-emerald-400" />
                        Booked Event Passes ({myBookings.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {myBookings.map((bk) => (
                          <div
                            key={bk.id}
                            className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-bold text-slate-100">
                                {bk.eventTitle}
                              </p>
                              <p className="text-slate-400">
                                {bk.venueName} • Booked by {bk.userName}
                              </p>
                              <p className="font-mono text-[11px] text-emerald-400 mt-1">
                                QR: {bk.qrCodeHash}
                              </p>
                            </div>
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold">
                              {bk.ticketCount}x PAID
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* VIEW: CUSTOMER CARE SUPPORT (AUDIO CALL & LIVE REAL-TIME CHAT) */}
              {activeTab === 'SUPPORT' && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                          24/7 Customer Care Support Desk (കസ്റ്റമർ കെയർ സപ്പോർട്ട്)
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          ● LIVE REAL-TIME SYNC
                        </span>
                      </div>
                      <h2 className="text-xl font-bold mt-1">
                        {currentUser.role === 'SUPPORT'
                          ? 'Customer Care Agent Console — Incoming Audio Calls & Support Chat'
                          : 'Live Support Chat & Audio Call for Users and Celebrities'}
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        പേജ് റിഫ്രഷ് ചെയ്യാതെ തന്നെ മെസ്സേജുകൾ തത്സമയം (Real-Time) ശബ്ദ നോട്ടിഫിക്കേഷനോടെ ഇവിടെ കാണാം.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {currentUser.role !== 'SUPPORT' ? (
                        <button
                          onClick={() => handleSupportAudioCall()}
                          className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition"
                        >
                          <Phone className="w-4 h-4" />
                          Call Customer Care (Audio Only)
                        </button>
                      ) : (
                        activeTicket && (
                          <button
                            onClick={() =>
                              handleSupportAudioCall(activeTicket.creatorId)
                            }
                            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition"
                          >
                            <PhoneCall className="w-4 h-4" />
                            Call Back {activeTicket.creatorName} (Audio Only)
                          </button>
                        )
                      )}
                      <span
                        className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 text-xs flex items-center gap-1.5 cursor-not-allowed"
                        title="Video calling is disabled for Customer Care Support"
                      >
                        <VideoOff className="w-4 h-4 text-rose-400" />
                        No Video Call
                      </span>
                    </div>
                  </div>

                  {/* Customer Care Incoming & Recent Audio Calls Queue */}
                  {recentCallHistory.length > 0 && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                        <PhoneIncoming className="w-4 h-4" />
                        Support Audio Call Queue & Recent Call Logs (
                        {recentCallHistory.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {recentCallHistory.slice(0, 4).map((c: any) => (
                          <div
                            key={c.id}
                            className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                              c.status === 'RINGING'
                                ? 'bg-emerald-950/60 border-emerald-500 text-white'
                                : c.status === 'ACTIVE'
                                  ? 'bg-indigo-950/60 border-indigo-500 text-white'
                                  : 'bg-slate-900/70 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div>
                              <p className="font-bold">
                                {c.callerName} → {c.receiverName}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {c.callType} • Status:{' '}
                                <strong className="text-cyan-300">
                                  {c.status}
                                </strong>
                              </p>
                            </div>
                            {c.status === 'RINGING' &&
                              c.callerId !== currentUser.id && (
                                <button
                                  onClick={() => handleAcceptIncomingCall(c.id)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs shrink-0"
                                >
                                  Accept Call
                                </button>
                              )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    <div className="md:col-span-5 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Support Conversations ({tickets.length})
                          </h3>
                          {totalUnreadChatCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                              {totalUnreadChatCount} Unread
                            </span>
                          )}
                        </div>
                        {tickets.map((t) => {
                          const ticketUnread = unreadByTicket[t.id] || 0;
                          const lastMsg =
                            t.messages?.[t.messages.length - 1]?.content ||
                            t.subject;
                          return (
                            <button
                              key={t.id}
                              onClick={() => handleOpenChatTicket(t.id)}
                              className={`w-full text-left p-3.5 rounded-xl border text-xs transition ${
                                activeTicketId === t.id
                                  ? 'bg-cyan-950/40 border-cyan-500/60 text-white shadow'
                                  : ticketUnread > 0
                                    ? 'bg-rose-950/30 border-rose-500/60 text-white animate-pulse'
                                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-900'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold">
                                  {t.creatorName} ({t.creatorRole})
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {ticketUnread > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                                      {ticketUnread} new
                                    </span>
                                  )}
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                                    {t.status}
                                  </span>
                                </div>
                              </div>
                              <p className="text-[11px] text-cyan-300/90 font-medium mt-1 line-clamp-1">
                                {t.subject}
                              </p>
                              <p className="text-slate-400 mt-0.5 line-clamp-1">
                                💬 {lastMsg}
                              </p>
                            </button>
                          );
                        })}
                      </div>

                      {currentUser.role !== 'SUPPORT' && (
                        <form
                          onSubmit={handleCreateSupportTicket}
                          className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
                        >
                          <h4 className="text-xs font-bold text-slate-200">
                            Open New Support Ticket
                          </h4>
                          <input
                            type="text"
                            value={newTicketSubject}
                            onChange={(e) =>
                              setNewTicketSubject(e.target.value)
                            }
                            placeholder="Issue Subject"
                            className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs"
                          />
                          <textarea
                            value={newTicketMsg}
                            onChange={(e) => setNewTicketMsg(e.target.value)}
                            placeholder="Describe your question or issue..."
                            rows={2}
                            className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs"
                          />
                          <button
                            type="submit"
                            className="w-full py-2 rounded-lg bg-slate-800 hover:bg-cyan-600 text-white text-xs font-semibold transition"
                          >
                            Create Support Ticket
                          </button>
                        </form>
                      )}
                    </div>

                    <div className="md:col-span-7 rounded-xl bg-slate-950 border border-slate-800 p-4 flex flex-col justify-between min-h-[380px]">
                      {activeTicket ? (
                        <>
                          <div className="space-y-3 overflow-y-auto max-h-80 pr-1">
                            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                              <div>
                                <h4 className="font-bold text-sm">
                                  {activeTicket.subject}
                                </h4>
                                <p className="text-[11px] text-slate-400">
                                  Opened by {activeTicket.creatorName} (
                                  {activeTicket.creatorRole}) • Assigned to{' '}
                                  {activeTicket.assignedAgentName}
                                </p>
                              </div>
                              <span className="text-[10px] text-emerald-400 font-semibold">
                                ● Auto-Syncing Live
                              </span>
                            </div>

                            {activeTicket.messages.map((m: any) => (
                              <div
                                key={m.id}
                                className={`p-3 rounded-xl text-xs max-w-[85%] ${
                                  m.senderId === currentUser?.id
                                    ? 'ml-auto bg-cyan-600/20 border border-cyan-500/30 text-cyan-100'
                                    : 'bg-slate-900 border border-slate-800 text-slate-200'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="font-bold text-[11px]">
                                    {m.senderName} ({m.senderRole})
                                  </span>
                                  {m.createdAt && (
                                    <span className="text-[10px] text-slate-500">
                                      {new Date(m.createdAt).toLocaleTimeString(
                                        [],
                                        {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          second: '2-digit',
                                        }
                                      )}
                                    </span>
                                  )}
                                </div>
                                <p>{m.content}</p>
                              </div>
                            ))}
                            <div ref={chatMessagesEndRef} />
                          </div>

                          <form
                            onSubmit={handleSendSupportMessage}
                            className="pt-3 border-t border-slate-800 flex gap-2 mt-4"
                          >
                            <input
                              type="text"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              placeholder="Type a message (instantly delivered without page refresh)..."
                              className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs focus:border-cyan-500 focus:outline-none"
                            />
                            <button
                              type="submit"
                              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Send
                            </button>
                          </form>
                        </>
                      ) : (
                        <div className="flex flex-col justify-between h-full">
                          <div className="text-center text-xs text-slate-400 my-auto space-y-2 p-6">
                            <MessageSquare className="w-8 h-8 text-cyan-400 mx-auto opacity-80" />
                            <p className="font-bold text-slate-200 text-sm">
                              Start a Live Chat with Customer Care
                            </p>
                            <p>
                              താഴെ കാണുന്ന ബോക്സിൽ നിങ്ങളുടെ മെസ്സേജ് ടൈപ്പ് ചെയ്ത് Send അമർത്തിയാൽ ഉടൻ തന്നെ കസ്റ്റമർ കെയറിലേക്ക് ചാറ്റ് എത്തും.
                            </p>
                          </div>
                          <form
                            onSubmit={handleSendSupportMessage}
                            className="pt-3 border-t border-slate-800 flex gap-2 mt-4"
                          >
                            <input
                              type="text"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              placeholder="Type your first message to Customer Care..."
                              className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs focus:border-cyan-500 focus:outline-none"
                            />
                            <button
                              type="submit"
                              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Send
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW: SUPER ADMIN CONTROL PANEL */}
              {activeTab === 'ADMIN_CONTROL' &&
                currentUser.role === 'SUPER_ADMIN' &&
                adminOverview && (
                  <div className="rounded-2xl border border-rose-500/30 bg-slate-900/70 p-6 space-y-6">
                    <div>
                      <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                        Super Admin Platform Control (സൂപ്പർ അഡ്മിൻ പാനൽ)
                      </span>
                      <h2 className="text-xl font-bold mt-1">
                        Manage Users, Block Accounts & Apply Call/Event
                        Restrictions
                      </h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-xs text-slate-400">
                          Total Accounts
                        </span>
                        <p className="text-2xl font-bold mt-1">
                          {adminOverview.stats.totalUsers}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-xs text-slate-400">
                          Premium VIP Users
                        </span>
                        <p className="text-2xl font-bold text-amber-400 mt-1">
                          {adminOverview.stats.premiumUsersCount}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-xs text-slate-400">
                          Published Events
                        </span>
                        <p className="text-2xl font-bold text-emerald-400 mt-1">
                          {adminOverview.stats.totalEvents}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-xs text-slate-400">
                          Blocked / Restricted
                        </span>
                        <p className="text-2xl font-bold text-rose-400 mt-1">
                          {adminOverview.stats.blockedOrRestrictedCount}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        All Platform Users & Moderation Actions
                      </h3>
                      <div className="space-y-2">
                        {adminOverview.users.map((u: any) => (
                          <div
                            key={u.id}
                            className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-100">
                                  {u.displayName}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[10px]">
                                  {u.role}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                    u.status === 'ACTIVE'
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-rose-500/20 text-rose-300'
                                  }`}
                                >
                                  {u.status}
                                </span>
                              </div>
                              <p className="text-slate-400 mt-0.5 font-mono">
                                {u.phone} • {u.city}
                              </p>
                            </div>

                            {u.role !== 'SUPER_ADMIN' && (
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleAdminRestrict(
                                      u.id,
                                      'BAN_RANDOM_VIDEO'
                                    )
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-medium"
                                >
                                  Restrict Video Call
                                </button>
                                <button
                                  onClick={() =>
                                    handleAdminRestrict(u.id, 'BLOCK_ACCOUNT')
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 font-medium flex items-center gap-1"
                                >
                                  <Ban className="w-3.5 h-3.5" /> Block User
                                </button>
                                {u.status !== 'ACTIVE' && (
                                  <button
                                    onClick={() => handleAdminUnblock(u.id)}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-medium"
                                  >
                                    Unblock
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
            </section>
          </main>
        </>
      )}

      {/* Premium Plan Upgrade Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl border border-amber-500/40 bg-slate-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  Upgrade to Friends Gold VIP Pass
                </h3>
                <p className="text-xs text-slate-400">
                  സെലിബ്രിറ്റികളെ ഓഡിയോ & വീഡിയോ കോൾ ചെയ്യാൻ പ്രീമിയം പ്ലാൻ ആക്ടിവേറ്റ് ചെയ്യുക.
                </p>
              </div>
            </div>

            <ul className="space-y-2 text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <li>✅ Direct 1-on-1 Audio Calls with Verified Celebrities</li>
              <li>✅ Direct 1-on-1 HD Video Calls with Verified Celebrities</li>
              <li>✅ +500 Instant Bonus Wallet Coins included</li>
              <li>✅ Priority Verified Badge on Random Audio/Video Connect</li>
            </ul>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPremiumModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleUpgradePremium}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-bold shadow-lg"
              >
                Activate Premium (₹499/mo)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
