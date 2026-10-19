import { Server as SocketIOServer, Socket } from 'socket.io';
import { db } from '../store/datastore';
import { CallSession } from '../types/models';

export interface QueueEntry {
  socketId: string;
  userId: string;
  displayName: string;
  city: string;
  language: string;
  mode: 'AUDIO' | 'VIDEO';
  joinedAt: number;
}

const randomAudioQueue: QueueEntry[] = [];
const randomVideoQueue: QueueEntry[] = [];
const userSocketMap: Map<string, string> = new Map();

export function setupSignalingGateway(io: SocketIOServer): void {
  io.on('connection', (socket: Socket) => {
    const userId = String(socket.handshake.query.userId || '');
    if (userId) {
      userSocketMap.set(userId, socket.id);
    }

    /**
     * Join Random Friend Queue (Supports both AUDIO and VIDEO modes for Normal Users)
     */
    socket.on(
      'queue:join',
      (payload: { userId: string; mode?: 'AUDIO' | 'VIDEO'; language?: string }) => {
        const user = db.users.get(payload.userId);
        if (!user) {
          socket.emit('queue:error', { error: 'User not found' });
          return;
        }

        if (user.status === 'BLOCKED') {
          socket.emit('queue:error', {
            error: 'Your account is blocked by the Super Admin.',
            code: 'ACCOUNT_BLOCKED',
          });
          return;
        }

        const mode = payload.mode === 'VIDEO' ? 'VIDEO' : 'AUDIO';
        const banType =
          mode === 'VIDEO' ? 'BAN_RANDOM_VIDEO' : 'BAN_RANDOM_AUDIO';
        const restriction = db.hasActiveRestriction(user.id, banType);
        if (restriction) {
          socket.emit('queue:error', {
            error: `Random ${mode} calls are restricted on your account: ${restriction.reason}`,
            code: banType,
          });
          return;
        }

        const targetQueue =
          mode === 'VIDEO' ? randomVideoQueue : randomAudioQueue;

        // Remove any stale entry for this user
        const existingIdx = targetQueue.findIndex(
          (q) => q.userId === user.id || q.socketId === socket.id
        );
        if (existingIdx !== -1) {
          targetQueue.splice(existingIdx, 1);
        }

        // Check if another online friend is waiting in the same mode queue
        const peerIdx = targetQueue.findIndex((q) => q.userId !== user.id);

        if (peerIdx !== -1) {
          const peer = targetQueue.splice(peerIdx, 1)[0];
          const roomId = `random-${mode.toLowerCase()}-${Date.now()}`;
          const callType = mode === 'VIDEO' ? 'RANDOM_VIDEO' : 'RANDOM_AUDIO';

          const session: CallSession = {
            id: `rnd-${Date.now()}`,
            callType,
            callerId: peer.userId,
            callerName: peer.displayName,
            callerRole: 'USER',
            receiverId: user.id,
            receiverName: user.displayName,
            receiverRole: 'USER',
            roomId,
            status: 'ACTIVE',
            startedAt: new Date().toISOString(),
            durationSeconds: 0,
            coinsCharged: 0,
          };
          db.callSessions.set(session.id, session);

          socket.join(roomId);
          const peerSocket = io.sockets.sockets.get(peer.socketId);
          peerSocket?.join(roomId);

          // Notify both matched friends
          peerSocket?.emit('match:found', {
            roomId,
            callType,
            mode,
            initiator: true,
            peer: {
              id: user.id,
              displayName: user.displayName,
              city: user.city,
              language: user.language,
            },
          });

          socket.emit('match:found', {
            roomId,
            callType,
            mode,
            initiator: false,
            peer: {
              id: peer.userId,
              displayName: peer.displayName,
              city: peer.city,
              language: peer.language,
            },
          });
        } else {
          targetQueue.push({
            socketId: socket.id,
            userId: user.id,
            displayName: user.displayName,
            city: user.city,
            language: payload.language || user.language,
            mode,
            joinedAt: Date.now(),
          });

          socket.emit('queue:waiting', {
            mode,
            message: `Waiting for an online friend for ${mode === 'VIDEO' ? 'Video' : 'Audio'} Call...`,
          });
        }
      }
    );

    socket.on('queue:leave', () => {
      removeSocketFromQueues(socket.id);
      socket.emit('queue:left', { success: true });
    });

    /**
     * WebRTC Signaling Relay (Offer, Answer, ICE Candidate)
     */
    socket.on(
      'webrtc:offer',
      (data: { roomId: string; sdp: unknown; mode: 'AUDIO' | 'VIDEO' }) => {
        socket.to(data.roomId).emit('webrtc:offer', {
          fromSocketId: socket.id,
          sdp: data.sdp,
          mode: data.mode,
        });
      }
    );

    socket.on('webrtc:answer', (data: { roomId: string; sdp: unknown }) => {
      socket.to(data.roomId).emit('webrtc:answer', {
        fromSocketId: socket.id,
        sdp: data.sdp,
      });
    });

    socket.on(
      'webrtc:ice-candidate',
      (data: { roomId: string; candidate: unknown }) => {
        socket.to(data.roomId).emit('webrtc:ice-candidate', {
          fromSocketId: socket.id,
          candidate: data.candidate,
        });
      }
    );

    /**
     * Customer Care Support Call Signaling — strictly enforces AUDIO only
     */
    socket.on(
      'support:call',
      (payload: { userId: string; mode?: string }) => {
        if (payload.mode && payload.mode.toUpperCase() === 'VIDEO') {
          socket.emit('support:error', {
            error:
              'Video calls are disabled for Customer Care Support. Use Audio Call or Chat.',
            code: 'SUPPORT_VIDEO_NOT_ALLOWED',
          });
          return;
        }
        const roomId = `support-audio-${Date.now()}`;
        socket.join(roomId);
        socket.emit('support:connected', {
          roomId,
          callType: 'SUPPORT_AUDIO',
          mode: 'AUDIO',
          agentName: 'Lakshmi (Customer Care Executive)',
        });
      }
    );

    socket.on('call:end', (data: { roomId: string }) => {
      socket.to(data.roomId).emit('call:ended', { roomId: data.roomId });
      socket.leave(data.roomId);
    });

    socket.on('disconnect', () => {
      removeSocketFromQueues(socket.id);
      if (userId) {
        userSocketMap.delete(userId);
      }
    });
  });
}

function removeSocketFromQueues(socketId: string): void {
  const idxAudio = randomAudioQueue.findIndex((q) => q.socketId === socketId);
  if (idxAudio !== -1) randomAudioQueue.splice(idxAudio, 1);

  const idxVideo = randomVideoQueue.findIndex((q) => q.socketId === socketId);
  if (idxVideo !== -1) randomVideoQueue.splice(idxVideo, 1);
}
