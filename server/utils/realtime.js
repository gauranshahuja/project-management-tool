const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;

// In-memory presence: organizationId -> Map(userId -> { name, sockets:Set })
const presence = new Map();

const orgRoom = (orgId) => `org:${orgId}`;
const userRoom = (userId) => `user:${userId}`;

const onlineUserIds = (orgId) => {
  const orgMap = presence.get(String(orgId));
  return orgMap ? [...orgMap.keys()] : [];
};

const broadcastPresence = (orgId) => {
  if (!io) return;
  io.to(orgRoom(orgId)).emit('presence:update', { online: onlineUserIds(orgId) });
};

const addPresence = (orgId, userId, name, socketId) => {
  const key = String(orgId);
  if (!presence.has(key)) presence.set(key, new Map());
  const orgMap = presence.get(key);
  const entry = orgMap.get(String(userId)) || { name, sockets: new Set() };
  entry.sockets.add(socketId);
  orgMap.set(String(userId), entry);
};

const removePresence = (orgId, userId, socketId) => {
  const orgMap = presence.get(String(orgId));
  if (!orgMap) return;
  const entry = orgMap.get(String(userId));
  if (!entry) return;
  entry.sockets.delete(socketId);
  if (entry.sockets.size === 0) orgMap.delete(String(userId));
};

// Call once with the http.Server
const initRealtime = (httpServer, allowedOrigins) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => {
        const isLocalhost = origin && /^http:\/\/localhost:\d+$/.test(origin);
        if (!origin || isLocalhost || allowedOrigins.includes(origin)) {
          cb(null, true);
        } else {
          cb(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    },
  });

  // JWT auth handshake — client passes token in auth payload
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name organization');
      if (!user || !user.organization) return next(new Error('Invalid user'));
      socket.data.userId = String(user._id);
      socket.data.name = user.name;
      socket.data.orgId = String(user.organization);
      next();
    } catch {
      next(new Error('Auth failed'));
    }
  });

  io.on('connection', (socket) => {
    const { orgId, userId, name } = socket.data;
    socket.join(orgRoom(orgId));
    socket.join(userRoom(userId)); // personal room for notifications
    addPresence(orgId, userId, name, socket.id);
    broadcastPresence(orgId);

    socket.on('disconnect', () => {
      removePresence(orgId, userId, socket.id);
      broadcastPresence(orgId);
    });
  });

  return io;
};

// Backend ke kahin se bhi org ke sab clients ko event bhejo.
// Usage: emitToOrg(req.user.organization, 'task:created', { ... })
const emitToOrg = (orgId, event, payload) => {
  if (!io || !orgId) return;
  io.to(orgRoom(orgId)).emit(event, payload);
};

// Sirf ek specific user ke clients ko event bhejo (notifications ke liye).
const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return;
  io.to(userRoom(userId)).emit(event, payload);
};

module.exports = { initRealtime, emitToOrg, emitToUser, onlineUserIds };
