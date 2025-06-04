import { createServer } from 'node:http';
import next from 'next';
import { Server } from 'socket.io';
import 'dotenv/config';

import './controllers/cronJobController.js';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || 'localhost';
const port = parseInt(process.env.PORT || '3000');
const clientURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173';

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: [clientURL],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', socket => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join-room', roomId => {
      socket.join(roomId);
      socket.to(roomId).emit('user-joined', socket.id);
    });

    socket.on('offer', ({ offer, to }) => {
      io.to(to).emit('offer', { offer, from: socket.id });
    });

    socket.on('answer', ({ answer, to }) => {
      io.to(to).emit('answer', { answer, from: socket.id });
    });

    socket.on('ice-candidate', ({ candidate, to }) => {
      io.to(to).emit('ice-candidate', { candidate, from: socket.id });
    });

    socket.on('video-toggled', ({ to, isVideoOff, userInfo }) => {
      socket.to(to).emit('video-toggled', { isVideoOff, userInfo });
    });

    socket.on('send-message', ({ to, from, text, time }) => {
      io.to(to).emit('receive-message', { from, text, time });
    });

    socket.on('user-info', ({ to, userInfo }) => {
      socket.to(to).emit('user-info', userInfo);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      const rooms = [...socket.rooms].filter(room => room !== socket.id);
      rooms.forEach(roomId => {
        socket.to(roomId).emit('user-disconnected', socket.id);
      });
    });
  });

  httpServer
    .once('error', err => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
