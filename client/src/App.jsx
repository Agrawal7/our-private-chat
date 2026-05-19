import React, { useState, useEffect, useRef } from 'react';
import { socket } from './utils/socket';
import Landing from './components/Landing/Landing';
import Chat from './components/Chat/Chat';
import { triggerSparkles } from './utils/sparkles';
import styles from './App.module.css';

function App() {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [joined, setJoined] = useState(false);
  const [chat, setChat] = useState([]);
  const [typingUser, setTypingUser] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(1);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const currentUserIdRef = useRef(null);

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

  // Global BGM Logic: Play on first interaction anywhere in the app
  useEffect(() => {
    audioRef.current = new Audio('/bgm/bgm.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.15;

    const handleFirstInteraction = () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().then(() => {
          setIsMusicPlaying(true);
        }).catch(e => console.log('Autoplay blocked:', e));
      }
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsMusicPlaying(true)).catch(e => console.log(e));
    }
  };

  useEffect(() => {
    const onConnect = () => {
      console.log('Connected to server');
      setIsConnected(true);
    };

    const onUserInfo = (data) => {
      console.log('User info received:', data);
      setCurrentUserId(data.userId);
      currentUserIdRef.current = data.userId;
    };

    const onReceiveMessage = (data) => {
      setChat((prev) => [...prev, data]);
      triggerSparkles(data.message);
      // If we are receiving someone else's message, mark it as read
      if (data.senderId !== currentUserIdRef.current) {
        socket.emit('update_message_status', { room: data.room, messageId: data.id, status: 'read' });
      }
    };

    const onMessageStatusUpdated = ({ messageId, status }) => {
      setChat((prev) => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, status } : msg
        )
      );
    };


    const onRoomUsers = ({ count, users }) => {
      setOnlineUsers(count);
      setUsersList(users);
      // Find the other user (not the current one) - use ref to avoid stale closure
      const other = users.find(u => u.id !== currentUserIdRef.current);
      setOtherUser(other || null);
    };

    const onUserTyping = ({ author, userId }) => {
      // Only show typing indicator if it's not from the current user
      if (userId !== currentUserIdRef.current) {
        setTypingUser(`${author} is typing...`);
        setTimeout(() => setTypingUser(''), 2000);
      }
    };

    socket.on('connect', onConnect);
    socket.on('user_info', onUserInfo);
    socket.on('receive_message', onReceiveMessage);
    socket.on('message_status_updated', onMessageStatusUpdated);
    socket.on('room_users', onRoomUsers);
    socket.on('user_typing', onUserTyping);

    return () => {
      socket.off('connect', onConnect);
      socket.off('user_info', onUserInfo);
      socket.off('receive_message', onReceiveMessage);
      socket.off('message_status_updated', onMessageStatusUpdated);
      socket.off('room_users', onRoomUsers);
      socket.off('user_typing', onUserTyping);
    };
  }, []);

  const createRoom = (userName) => {
    if (!userName.trim()) {
      alert('Please enter your name');
      return;
    }

    // Play BGM on explicit button click to bypass browser autoplay restrictions
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().then(() => {
        setIsMusicPlaying(true);
      }).catch(e => console.log('BGM playback failed:', e));
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

    // Play BGM on explicit button click to bypass browser autoplay restrictions
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().then(() => {
        setIsMusicPlaying(true);
      }).catch(e => console.log('BGM playback failed:', e));
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
    currentUserIdRef.current = null;
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
          isMusicPlaying={isMusicPlaying}
          toggleMusic={toggleMusic}
          globalAudioRef={audioRef}
        />
      )}
    </div>
  );
}

export default App;