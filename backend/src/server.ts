import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { setupSignalingGateway } from './socket/signaling.gateway';

const PORT = Number(process.env.PORT || 4000);

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

setupSignalingGateway(io);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(
      `🚀 Friends App Backend API & WebRTC Signaling Server running on http://localhost:${PORT}`
    );
  });
}

export { server, io };
