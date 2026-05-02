import React, { useState, useEffect, useRef } from 'react';
import styles from './Chat.module.css';
import Message from './Message';
import MessageInput from './MessageInput';
import VoiceCall from '../VoiceCall/VoiceCall';
import { analyzeSentiment } from '../../utils/sentiment';

const Chat = ({ 
  chat, 
  name, 
  room, 
  onlineUsers, 
  typingUser, 
  socket,
  onLeave,
  currentUserId,
  otherUser
}) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [moodScore, setMoodScore] = useState(0);
  const [replyingTo, setReplyingTo] = useState(null);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const voiceCallRef = useRef(null);
  const isUserScrolledUpRef = useRef(false);

  // Analyze sentiment on new messages
  useEffect(() => {
    const recentMessages = chat.slice(-10);
    let score = 0;
    recentMessages.forEach(msg => {
      score += analyzeSentiment(msg.message);
    });
    setMoodScore(Math.max(-5, Math.min(5, score)));
  }, [chat]);

  // Calculate dynamic style based on moodScore
  const getDynamicStyle = () => {
    if (moodScore >= 2) {
      return {
        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)',
        boxShadow: '0 25px 50px -12px rgba(236, 72, 153, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      };
    } else if (moodScore <= -2) {
      return {
        background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(76, 29, 149, 0.15) 100%)',
        boxShadow: '0 25px 50px -12px rgba(220, 38, 38, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      };
    }
    return {};
  };

  // Check if user is at bottom
  const checkIfAtBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    return atBottom;
  };

  // Scroll to bottom instantly
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setShowScrollButton(false);
      isUserScrolledUpRef.current = false;
    }
  };

  // Handle scroll event
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const atBottom = checkIfAtBottom();
    isUserScrolledUpRef.current = !atBottom;
    setShowScrollButton(!atBottom && chat.length > 0);
  };

  // Auto-scroll when new messages arrive (sent or received)
  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  // Add scroll event listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Initial scroll to bottom when chat loads
  useEffect(() => {
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }, []);

  // Listen for incoming calls
  useEffect(() => {
    const handleIncomingCall = ({ from, callerId }) => {
      console.log('📞 Incoming call from:', from, callerId);
      setIncomingCall({ from, callerId });
    };

    const handleCallAccepted = ({ calleeId }) => {
      console.log('✅ Call accepted by:', calleeId);
      setIsCallActive(true);
      setIncomingCall(null);
    };

    const handleCallRejected = () => {
      console.log('❌ Call rejected');
      setIncomingCall(null);
    };

    const handleCallEnded = () => {
      console.log('🔴 Call ended');
      setIsCallActive(false);
      setIncomingCall(null);
    };

    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);

    return () => {
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-ended', handleCallEnded);
    };
  }, [socket]);

  const handleStartCall = () => {
    console.log('📞 Starting call from:', name);
    setIsCallActive(true);
    socket.emit('call-user', { room, from: name });
  };

  const handleAcceptCall = () => {
    console.log('✅ Accepting call');
    setIsCallActive(true);
    setIncomingCall(null);
    socket.emit('accept-call', { room });
    setTimeout(() => {
      if (voiceCallRef.current && voiceCallRef.current.answerCall) {
        voiceCallRef.current.answerCall();
      }
    }, 100);
  };

  const handleRejectCall = () => {
    console.log('❌ Rejecting call');
    setIncomingCall(null);
    socket.emit('reject-call', { room });
  };

  const handleEndCall = () => {
    console.log('🔴 Ending call');
    setIsCallActive(false);
    socket.emit('end-call', { room });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room);
    alert('Room code copied!');
  };

  // Get the other user's display name
  const getOtherUserName = () => {
    if (otherUser) {
      return otherUser.displayName || otherUser.name;
    }
    return 'partner';
  };

  // Handle sending message
  const handleSendMessage = (msg) => {
    const messageData = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      room,
      author: name,
      message: msg,
      senderId: currentUserId,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      ...(replyingTo ? { replyTo: replyingTo } : {})
    };
    
    socket.emit('send_message', messageData);
    setReplyingTo(null);
  };

  // Handle reply to a message
  const handleReply = (message) => {
    setReplyingTo(message);
  };

  return (
    <div className={styles.container} style={getDynamicStyle()}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.roomInfo}>
            <div className={styles.roomCodeLabel}>Room Code</div>
            <div className={styles.roomCodeValue}>
              {room}
              <button onClick={copyRoomCode} className={styles.copyButton}>
                Copy
              </button>
            </div>
          </div>
          <button onClick={onLeave} className={styles.leaveButton}>
            Leave Room
          </button>
        </div>
        
        <div className={styles.status}>
          <span className={onlineUsers === 2 ? styles.online : styles.waiting}></span>
          {onlineUsers === 2 ? `Connected with ${getOtherUserName()}` : 'Waiting for partner...'}
          <span className={styles.userCount}>({onlineUsers}/2 users in room)</span>
        </div>
      </div>

      {incomingCall && (
        <div className={styles.incomingCall}>
          <div className={styles.incomingCallContent}>
            <span className={styles.incomingCallIcon}>📞</span>
            <span>{incomingCall.from} is calling...</span>
            <div className={styles.incomingCallActions}>
              <button onClick={handleAcceptCall} className={styles.acceptCallBtn}>Accept</button>
              <button onClick={handleRejectCall} className={styles.rejectCallBtn}>Reject</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.chatArea}>
        <div className={styles.messagesContainer} ref={messagesContainerRef}>
          {chat.length === 0 ? (
            <div className={styles.welcomeMessage}>
              <div className={styles.welcomeIcon}>🐦</div>
              <p>Connected! Start chatting with {getOtherUserName()}.</p>
            </div>
          ) : (
            <>
              {chat.map((msg, idx) => (
                <Message 
                  key={idx} 
                  message={msg} 
                  isOwn={msg.senderId === currentUserId}
                  onReply={handleReply}
                />
              ))}
              <div ref={messagesEndRef} style={{ clear: 'both' }} />
            </>
          )}
        </div>

        {showScrollButton && chat.length > 0 && (
          <button onClick={scrollToBottom} className={styles.scrollButton}>
            ↓ New messages
          </button>
        )}

        {typingUser && (
          <div className={styles.typingIndicator}>
            <span className={styles.typingDot}></span>
            {typingUser}
          </div>
        )}

        <div className={styles.inputArea}>
          <div className={styles.inputWrapper}>
            <MessageInput 
              onSendMessage={handleSendMessage}
              onTyping={() => {
                socket.emit('typing', { room, author: name });
              }}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
            />
            <button 
              onClick={isCallActive ? handleEndCall : handleStartCall}
              className={`${styles.callButton} ${isCallActive ? styles.inCall : ''}`}
              disabled={onlineUsers !== 2}
            >
              {isCallActive ? 'In Call' : 'Call'}
            </button>
          </div>
        </div>
      </div>

      {isCallActive && (
        <VoiceCall 
          ref={voiceCallRef}
          room={room} 
          socket={socket} 
          onEndCall={handleEndCall}
          myName={name}
        />
      )}
    </div>
  );
};

export default Chat;