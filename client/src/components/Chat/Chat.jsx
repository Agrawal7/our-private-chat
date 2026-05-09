import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, PhoneIncoming, MessageCircle, ArrowDown, Users, Copy, LogOut, Check } from 'lucide-react';
import styles from './Chat.module.css';
import Message from './Message';
import MessageInput from './MessageInput';
import VoiceCall from '../VoiceCall/VoiceCall';
import { analyzeSentiment } from '../../utils/sentiment';
import { triggerSparkles } from '../../utils/sparkles';

const Chat = ({ 
  chat, 
  name, 
  room, 
  onlineUsers, 
  typingUser, 
  socket,
  onLeave,
  currentUserId,
  otherUser,
}) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [moodScore, setMoodScore] = useState(0);
  const [replyingTo, setReplyingTo] = useState(null);
  const [copied, setCopied] = useState(false);
  
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
        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(245, 158, 11, 0.05) 100%)',
        boxShadow: '0 25px 50px -12px rgba(236, 72, 153, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      };
    } else if (moodScore <= -2) {
      return {
        background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.05) 0%, rgba(76, 29, 149, 0.05) 100%)',
        boxShadow: '0 25px 50px -12px rgba(220, 38, 38, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
      };
    }
    return {};
  };

  const checkIfAtBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    return atBottom;
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setShowScrollButton(false);
      isUserScrolledUpRef.current = false;
    }
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const atBottom = checkIfAtBottom();
    isUserScrolledUpRef.current = !atBottom;
    setShowScrollButton(!atBottom && chat.length > 0);
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }, []);

  useEffect(() => {
    const handleIncomingCall = ({ from, callerId }) => {
      setIncomingCall({ from, callerId });
    };

    const handleCallAccepted = ({ calleeId }) => {
      setIsCallActive(true);
      setIncomingCall(null);
    };

    const handleCallRejected = () => {
      setIncomingCall(null);
    };

    const handleCallEnded = () => {
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
    setIsCallActive(true);
    socket.emit('call-user', { room, from: name });
  };

  const handleAcceptCall = () => {
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
    setIncomingCall(null);
    socket.emit('reject-call', { room });
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    socket.emit('end-call', { room });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getOtherUserName = () => {
    if (otherUser) {
      return otherUser.displayName || otherUser.name;
    }
    return 'partner';
  };

  const playPopSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
    audio.volume = 0.4;
    audio.play().catch(e => console.log('Sound blocked by browser'));
  };

  useEffect(() => {
    if (chat.length > 0) {
      const lastMsg = chat[chat.length - 1];
      if (lastMsg.senderId !== currentUserId) {
        playPopSound();
      }
    }
  }, [chat.length]);

  const handleSendMessage = (msg) => {
    if (msg) triggerSparkles(msg);
    
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

  const handleReply = (message) => {
    setReplyingTo(message);
  };

  return (
    <motion.div 
      className={styles.container} 
      style={getDynamicStyle()}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.roomInfo}>
            <div className={styles.roomCodeLabel}>Private Space</div>
            <div className={styles.roomCodeValue}>
              {room}
              <button onClick={copyRoomCode} className={styles.copyButton} title="Copy code">
                {copied ? <Check size={14} color="var(--success-color)" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
          <button onClick={onLeave} className={styles.leaveButton}>
            <LogOut size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Leave
          </button>
        </div>
        
        <div className={styles.status}>
          <span className={onlineUsers === 2 ? styles.online : styles.waiting}></span>
          {onlineUsers === 2 ? `Connected with ${getOtherUserName()}` : 'Waiting for partner...'}
          <span className={styles.userCount}>
            <Users size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            {onlineUsers}/2
          </span>
        </div>
      </div>

      <AnimatePresence>
        {incomingCall && (
          <motion.div 
            className={styles.incomingCall}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className={styles.incomingCallContent}>
              <PhoneIncoming size={20} className={styles.incomingCallIcon} />
              <span>{incomingCall.from} is calling...</span>
              <div className={styles.incomingCallActions}>
                <button onClick={handleAcceptCall} className={styles.acceptCallBtn}>Accept</button>
                <button onClick={handleRejectCall} className={styles.rejectCallBtn}>Reject</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.chatArea}>
        <div className={styles.messagesContainer} ref={messagesContainerRef}>
          {chat.length === 0 ? (
            <motion.div 
              className={styles.welcomeMessage}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <MessageCircle size={48} color="rgba(255,255,255,0.2)" className={styles.welcomeIcon} />
              <p>The space is yours. Start sharing with {getOtherUserName()}.</p>
            </motion.div>
          ) : (
            <AnimatePresence initial={false}>
              {chat.map((msg, idx) => (
                <Message 
                  key={msg.id || idx} 
                  message={msg} 
                  isOwn={msg.senderId === currentUserId}
                  onReply={handleReply}
                  currentUserId={currentUserId}
                />
              ))}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} style={{ clear: 'both' }} />
        </div>

        <AnimatePresence>
          {showScrollButton && chat.length > 0 && (
            <motion.button 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={scrollToBottom} 
              className={styles.scrollButton}
            >
              <ArrowDown size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> 
              New messages
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {typingUser && (
            <motion.div 
              className={styles.typingIndicator}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className={styles.typingDots}>
                <span /><span /><span />
              </div>
              <span>{typingUser}</span>
            </motion.div>
          )}
        </AnimatePresence>

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
              title={isCallActive ? 'End call' : 'Voice call'}
            >
              {isCallActive ? <PhoneOff size={20} /> : <Phone size={20} />}
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
    </motion.div>
  );
};

export default Chat;