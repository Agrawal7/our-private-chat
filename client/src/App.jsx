import React, { useState, useEffect } from 'react';
import { socket } from './utils/socket';
import Landing from './components/Landing/Landing';
import Chat from './components/Chat/Chat';
import styles from './App.module.css';

function App() {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [joined, setJoined] = useState(false);
  const [chat, setChat] = useState([]);
  const [typingUser, setTypingUser] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [usersList, setUsersList] = useState([]);

  // Additional security measures
  useEffect(() => {
    // Disable keyboard shortcuts
    const handleKeyDown = (e) => {
      // Disable all modifier shortcuts
      if (e.ctrlKey || e.metaKey) {
        const blockedKeys = ['c', 'v', 'x', 'a', 's', 'u', 'p', 'r'];
        if (blockedKeys.includes(e.key.toLowerCase())) {
          // Only allow in input fields
          if (!e.target.matches('input, textarea')) {
            e.preventDefault();
            return false;
          }
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    // Receive user info after joining/creating room
    socket.on('user_info', (data) => {
      console.log('User info received:', data);
      setCurrentUserId(data.userId);
    });

    // Receive message with sender ID
    socket.on('receive_message', (data) => {
      setChat((prev) => [...prev, data]);
    });

    // Update room users list
    socket.on('room_users', ({ count, users }) => {
      setOnlineUsers(count);
      setUsersList(users);
      // Find the other user (not the current one)
      const other = users.find(u => u.id !== currentUserId);
      setOtherUser(other);
    });

    socket.on('user_typing', ({ author, userId }) => {
      // Only show typing indicator if it's not from the current user
      if (userId !== currentUserId) {
        setTypingUser(`${author} is typing...`);
        setTimeout(() => setTypingUser(''), 2000);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('user_info');
      socket.off('receive_message');
      socket.off('room_users');
      socket.off('user_typing');
    };
  }, [currentUserId]);

  const createRoom = (userName) => {
    if (!userName.trim()) {
      alert('Please enter your name');
      return;
    }

    const randomRoom = Math.random().toString(36).substring(2, 7).toUpperCase();
    
    socket.emit('create_room', { room: randomRoom, name: userName }, (res) => {
      if (!res?.ok) {
        alert(res?.message || 'Failed to create room');
        return;
      }
      setName(userName);
      setRoom(randomRoom);
      setJoined(true);
    });
  };

  const joinRoom = (userName, roomCode) => {
    if (!userName.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      alert('Please enter room code');
      return;
    }

    socket.emit('join_room', { room: roomCode.toUpperCase(), name: userName }, (res) => {
      if (!res?.ok) {
        alert(res?.message || 'Failed to join room');
        return;
      }
      setName(userName);
      setRoom(roomCode.toUpperCase());
      setJoined(true);
      
      // Show warning if name was modified due to duplicate
      if (res.displayName && res.displayName !== userName) {
        alert(`Note: "${userName}" is already taken. You're joining as "${res.displayName}"`);
      }
    });
  };

  const leaveRoom = () => {
    setJoined(false);
    setChat([]);
    setName('');
    setRoom('');
    setCurrentUserId(null);
    setOtherUser(null);
    setUsersList([]);
    socket.disconnect();
    setTimeout(() => socket.connect(), 100);
  };

  return (
    <div className={styles.app}>
      {!joined ? (
        <Landing createRoom={createRoom} joinRoom={joinRoom} />
      ) : (
        <Chat
          chat={chat}
          name={name}
          room={room}
          onlineUsers={onlineUsers}
          typingUser={typingUser}
          socket={socket}
          onLeave={leaveRoom}
          currentUserId={currentUserId}
          otherUser={otherUser}
          usersList={usersList}
        />
      )}
    </div>
  );
}

export default App;