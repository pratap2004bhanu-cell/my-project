import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { notify } from '../utils/notify.js';

const configureSocket = (io) => {
  // Auth middleware for Socket.io
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name}`);

    // Synchronous setup: register all handlers BEFORE any async work
    socket.join(socket.user._id.toString());

    // Join activity room
    socket.on('activity:join', (activityId) => {
      socket.join(`activity:${activityId}`);
    });

    // Leave activity room
    socket.on('activity:leave', (activityId) => {
      socket.leave(`activity:${activityId}`);
    });

    // Join community room
    socket.on('community:join', (communityId) => {
      socket.join(`community:${communityId}`);
    });

    // Leave community room
    socket.on('community:leave', (communityId) => {
      socket.leave(`community:${communityId}`);
    });

    // Community group message
    socket.on('community:message', async (data) => {
      try {
        const message = await Message.create({
          sender: socket.user._id,
          community: data.communityId,
          content: data.content || '',
          attachment: data.attachment,
        });

        const populated = await message.populate('sender', 'name avatar');
        io.to(`community:${data.communityId}`).emit('community:message', populated);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Direct message
    socket.on('message:send', async (data) => {
      try {
        const message = await Message.create({
          sender: socket.user._id,
          receiver: data.receiver,
          content: data.content || '',
          attachment: data.attachment,
        });

        const populated = await message.populate('sender', 'name avatar');

        // Send to receiver
        io.to(data.receiver).emit('message:receive', populated);
        // Send back to sender (for confirmation)
        socket.emit('message:sent', populated);

        // Notification for the receiver
        if (data.receiver !== socket.user._id.toString()) {
          await notify(io, {
            recipient: data.receiver,
            actor: socket.user._id,
            type: 'message',
            text: `sent you a message`,
            link: `/chat/${socket.user._id}`,
          });
        }
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Activity group message
    socket.on('activity:message', async (data) => {
      try {
        const message = await Message.create({
          sender: socket.user._id,
          activity: data.activityId,
          content: data.content || '',
          attachment: data.attachment,
        });

        const populated = await message.populate('sender', 'name avatar');
        io.to(`activity:${data.activityId}`).emit('activity:message', populated);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Activity update (participant joined/left)
    socket.on('activity:update', (data) => {
      io.to(`activity:${data.activityId}`).emit('activity:update', data);
    });

    // Location sharing
    socket.on('location:share', (data) => {
      io.to(`activity:${data.activityId}`).emit('location:update', {
        userId: socket.user._id,
        lat: data.lat,
        lng: data.lng,
      });
    });

    // Read receipts: mark the conversation as read + notify the sender
    socket.on('message:read', async (data) => {
      try {
        await Message.updateMany(
          { sender: data.receiver, receiver: socket.user._id, read: false },
          { read: true }
        );
        io.to(data.receiver).emit('message:read', {
          sender: socket.user._id,
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Typing indicator
    socket.on('typing:start', (data) => {
      io.to(data.receiver).emit('typing:start', { userId: socket.user._id });
    });

    socket.on('typing:stop', (data) => {
      io.to(data.receiver).emit('typing:stop', { userId: socket.user._id });
    });

    // Async setup after handlers are registered
    fibSetup(io, socket);

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.name}`);
      await User.findByIdAndUpdate(socket.user._id, { 'status.current': 'offline' });
      io.emit('user:status', { userId: socket.user._id, status: 'offline' });
    });
  });

  return io;
};

// fire-and-forget async setup so it never blocks handler registration
const fibSetup = async (io, socket) => {
  try {
    await User.findByIdAndUpdate(socket.user._id, { 'status.current': 'online' });
    io.emit('user:status', { userId: socket.user._id, status: 'online' });
  } catch (error) {
    console.error('Socket setup error:', error.message);
  }
};

export default configureSocket;