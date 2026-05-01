const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Allow multiple origins (development and production)
const allowedOrigins = [
  "http://localhost:3000", 
  "http://localhost:3001",
  "https://*.vercel.app",
  "https://*.onrender.com"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.includes(allowed.replace('*', '')))) {
      return callback(null, true);
    }
    // Allow localhost for development
    if (origin.includes('localhost')) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all for now
  },
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

let rooms = {};

app.get('/', (req, res) => {
  res.json({ message: 'OurRoom Server is running!' });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    activeRooms: Object.keys(rooms).length,
    connections: io.engine.clientsCount
  });
});

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // Create room
  socket.on('create_room', ({ room, name }, callback) => {
    try {
      if (rooms[room]) {
        return callback({ ok: false, message: 'Room already exists' });
      }
      
      rooms[room] = {
        users: [{
          id: socket.id,
          name: name,
          displayName: name
        }],
        count: 1
      };
      
      socket.join(room);
      socket.data = { room, name, socketId: socket.id, displayName: name };
      
      // Send user info to the creator
      socket.emit('user_info', { 
        userId: socket.id, 
        name: name,
        displayName: name,
        isCreator: true 
      });
      
      io.to(room).emit('room_users', {
        count: 1,
        users: rooms[room].users
      });
      callback({ ok: true });
      console.log(`✅ Room created: ${room} by ${name} (${socket.id})`);
    } catch (error) {
      console.error('Create room error:', error);
      callback({ ok: false, message: 'Server error' });
    }
  });

  // Join room
  socket.on('join_room', ({ room, name }, callback) => {
    try {
      if (!rooms[room]) {
        return callback({ ok: false, message: 'Room does not exist' });
      }
      
      if (rooms[room].count >= 2) {
        return callback({ ok: false, message: 'Room is full (max 2 users)' });
      }
      
      // Check if name already exists in the room
      const nameExists = rooms[room].users.some(u => u.name === name);
      let displayName = name;
      
      if (nameExists) {
        // Append random number to make it unique
        const randomNum = Math.floor(Math.random() * 1000);
        displayName = `${name}_${randomNum}`;
        console.log(`⚠️ Name "${name}" already exists. Using "${displayName}" instead`);
      }
      
      rooms[room].users.push({
        id: socket.id,
        name: name,
        displayName: displayName
      });
      rooms[room].count++;
      
      socket.join(room);
      socket.data = { room, name, socketId: socket.id, displayName: displayName };
      
      // Send user info to the joiner
      socket.emit('user_info', { 
        userId: socket.id, 
        name: name,
        displayName: displayName,
        isCreator: false 
      });
      
      // Notify all users in room about the updated user list
      io.to(room).emit('room_users', {
        count: rooms[room].count,
        users: rooms[room].users
      });
      
      callback({ ok: true, displayName: displayName });
      console.log(`✅ User joined room: ${room} as ${displayName} (${socket.id})`);
    } catch (error) {
      console.error('Join room error:', error);
      callback({ ok: false, message: 'Server error' });
    }
  });

  // Send message with sender ID
  socket.on('send_message', (data) => {
    if (data.room && data.message) {
      const messageData = {
        ...data,
        senderId: socket.id,
        timestamp: Date.now(),
        status: 'sent' // Initialize status
      };
      io.to(data.room).emit('receive_message', messageData);
      console.log(`💬 Message in ${data.room} from ${data.author} (${socket.id})`);
    }
  });

  // Message status (read receipts)
  socket.on('update_message_status', ({ room, messageId, status }) => {
    socket.to(room).emit('message_status_updated', { messageId, status });
  });

  // Typing indicator with user ID
  socket.on('typing', ({ room, author }) => {
    socket.to(room).emit('user_typing', { author, userId: socket.id });
  });

  // Voice call signaling with IDs
  socket.on('call-user', ({ room, from }) => {
    console.log(`📞 Call from ${from} (${socket.id}) in room ${room}`);
    socket.to(room).emit('incoming-call', { from, callerId: socket.id });
  });

  socket.on('accept-call', ({ room }) => {
    console.log(`✅ Call accepted by ${socket.id} in room ${room}`);
    socket.to(room).emit('call-accepted', { calleeId: socket.id });
  });

  socket.on('reject-call', ({ room }) => {
    console.log(`❌ Call rejected by ${socket.id} in room ${room}`);
    socket.to(room).emit('call-rejected');
  });

  socket.on('offer', ({ offer, room }) => {
    console.log(`📡 Offer sent by ${socket.id} in room ${room}`);
    socket.to(room).emit('offer', { offer, callerId: socket.id });
  });

  socket.on('answer', ({ answer, room }) => {
    console.log(`📡 Answer sent by ${socket.id} in room ${room}`);
    socket.to(room).emit('answer', { answer, calleeId: socket.id });
  });

  socket.on('ice-candidate', ({ candidate, room }) => {
    console.log(`🧊 ICE candidate from ${socket.id} in room ${room}`);
    socket.to(room).emit('ice-candidate', { candidate, senderId: socket.id });
  });

  socket.on('end-call', ({ room }) => {
    console.log(`🔚 Call ended by ${socket.id} in room ${room}`);
    socket.to(room).emit('call-ended');
  });

  // Disconnect
  socket.on('disconnect', () => {
    const room = socket.data?.room;
    const name = socket.data?.name;
    const displayName = socket.data?.displayName;
    
    console.log(`❌ User disconnected: ${socket.id} (${displayName || name})`);
    
    if (room && rooms[room]) {
      // Remove user from room
      rooms[room].users = rooms[room].users.filter(u => u.id !== socket.id);
      rooms[room].count--;
      
      if (rooms[room].count <= 0) {
        delete rooms[room];
        console.log(`🗑️ Room deleted: ${room}`);
      } else {
        // Notify remaining users about updated user list
        io.to(room).emit('room_users', {
          count: rooms[room].count,
          users: rooms[room].users
        });
        console.log(`👋 User left room: ${room}, users left: ${rooms[room].count}`);
      }
    }
  });
});

// Error handling
server.on('error', (error) => {
  console.error('Server error:', error);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 OurRoom Server running on http://localhost:${PORT}`);
  console.log(`✅ WebSocket ready for connections`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`\n✅ Ready to accept connections\n`);
});