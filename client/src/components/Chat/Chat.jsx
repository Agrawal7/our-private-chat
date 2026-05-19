import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, PhoneCall, ArrowDown, Users, Copy, LogOut, Check, Lock, Zap, Shield, UserCircle2, Sparkles, Menu, X, Music, VolumeX } from 'lucide-react';
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
  const [inviteCopied, setInviteCopied] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const voiceCallRef = useRef(null);
  const audioRef = useRef(null);
  const isUserScrolledUpRef = useRef(false);

  useEffect(() => {
    // Custom BGM file from public folder
    audioRef.current = new Audio('/bgm/bgm.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.15;
    
    // Attempt autoplay because they interacted with the previous screen
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        setIsMusicPlaying(true);
      }).catch(error => {
        console.log("Autoplay prevented by browser. User needs to interact first.", error);
        setIsMusicPlaying(false);
      });
    }
    
    return () => {
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
      audioRef.current.play().then(() => {
        setIsMusicPlaying(true);
      }).catch(e => console.log('Audio play blocked:', e));
    }
  };

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
    const baseTransition = 'background 2s ease-in-out';
    if (moodScore >= 4) {
      return {
        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(245, 158, 11, 0.25) 100%)',
        transition: baseTransition
      };
    } else if (moodScore >= 2) {
      return {
        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)',
        transition: baseTransition
      };
    } else if (moodScore <= -4) {
      return {
        background: 'linear-gradient(135deg, rgba(185, 28, 28, 0.25) 0%, rgba(88, 28, 135, 0.25) 100%)',
        transition: baseTransition
      };
    } else if (moodScore <= -2) {
      return {
        background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(76, 29, 149, 0.15) 100%)',
        transition: baseTransition
      };
    }
    return { transition: baseTransition };
  };

  const checkIfAtBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    return atBottom;
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
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

  const copyInviteLink = () => {
    const link = `Join my private space with code: ${room}`;
    navigator.clipboard.writeText(link);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const getOtherUserName = () => {
    if (otherUser) {
      return otherUser.displayName || otherUser.name;
    }
    return 'partner';
  };

  const scrollToMessage = (messageId) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add(styles.highlightMessage);
      setTimeout(() => {
        element.classList.remove(styles.highlightMessage);
      }, 2000);
    }
  };

  const playPopSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
    audio.volume = 0.4;
    audio.play().catch(e => console.log('Sound blocked by browser'));
  };

  // --- Tab Notification Logic ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        document.title = 'Privio - Private Space';
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Cleanup and reset on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.title = 'Privio - Private Space';
    };
  }, []);

  useEffect(() => {
    if (chat.length > 0) {
      const lastMsg = chat[chat.length - 1];
      if (lastMsg.senderId !== currentUserId) {
        if (document.hidden) {
          document.title = '(1) New Message - Privio';
        }
        playPopSound();
      }
    }
  }, [chat.length, currentUserId]);

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

  const isWaiting = onlineUsers < 2;

  return (
    <div className={styles.chatPage}>
    <motion.div 
      className={styles.container} 
      style={getDynamicStyle()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {showSidebar && (
          <div 
            className={styles.sidebarBackdrop} 
            onClick={() => setShowSidebar(false)} 
          />
        )}
      </AnimatePresence>

      {/* Sidebar Component */}
      <div className={`${styles.sidebar} ${showSidebar ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarBadge}>
          <div className={styles.sidebarBadgeInfo}>
            <span className={styles.badgeLabel}>PRIVATE SPACE</span>
            <span className={styles.badgeRoom}>{room}</span>
          </div>
          <button onClick={copyRoomCode} className={styles.copyBtn} title="Copy code">
            {copied ? <Check size={18} color="var(--success-color)" /> : <Copy size={18} />}
          </button>
        </div>

        <div className={styles.sidebarSection}>
          <h4 className={styles.sectionTitle}>ROOM INFO</h4>
          <div className={styles.roomDetails}>
            <span className={styles.roomDetailsLabel}>Private Space</span>
            <span className={styles.roomDetailsValue}>{room}</span>
            <p className={styles.roomDetailsDesc}>Share this code with your partner</p>
            <button onClick={copyInviteLink} className={styles.inviteBtn}>
              {inviteCopied ? <Check size={16} /> : <Copy size={16} />}
              {inviteCopied ? 'Copied!' : 'Copy Invite Link'}
            </button>
          </div>
        </div>

        <div className={styles.sidebarSection}>
          <h4 className={styles.sectionTitle}>BACKGROUND MUSIC</h4>
          <div className={styles.sidebarBgm}>
            <div className={`${styles.bgmDisk} ${isMusicPlaying ? styles.bgmSpinning : ''}`}>
              <Music size={14} color="white" />
            </div>
            <div className={styles.bgmInfo}>
              <span className={styles.bgmTitle}>Custom Track</span>
              <button onClick={toggleMusic} className={styles.bgmToggleBtn}>
                {isMusicPlaying ? 'Stop Music' : 'Play Music'}
              </button>
            </div>
          </div>
        </div>

        <div className={styles.sidebarSection}>
          <h4 className={styles.sectionTitle}>STATUS</h4>
          <div className={styles.statusCard}>
            <div className={`${styles.statusRing} ${!isWaiting ? styles.statusRingConnected : ''}`}></div>
            <div className={styles.statusInfo}>
              <span className={styles.statusText}>{isWaiting ? 'Waiting for partner...' : 'Connected'}</span>
              <span className={styles.statusSubtext}>{isWaiting ? "Your partner hasn't joined yet." : `Secure connection established.`}</span>
            </div>
          </div>
        </div>

        <div className={styles.sidebarSection}>
          <h4 className={styles.sectionTitle}>ROOM FEATURES</h4>
          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <div className={styles.featureIconWrap}><Lock size={16} /></div>
              <div className={styles.featureTexts}>
                <span className={styles.fTitle}>End-to-end</span>
                <span className={styles.fDesc}>Encrypted</span>
              </div>
              <Check size={16} color="var(--success-color)" className={styles.checkIcon} />
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIconWrap}><Zap size={16} /></div>
              <div className={styles.featureTexts}>
                <span className={styles.fTitle}>Real-time</span>
                <span className={styles.fDesc}>Communication</span>
              </div>
              <Check size={16} color="var(--success-color)" className={styles.checkIcon} />
            </div>
          </div>
        </div>

        <div className={styles.sidebarFooter}>
          <Shield size={20} className={styles.footerShield} />
          <p>Your privacy is our priority.<br/>We don't store your conversations.</p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={styles.mainArea}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button 
              className={styles.menuBtn} 
              onClick={() => setShowSidebar(prev => !prev)}
              title="Toggle sidebar"
            >
              {showSidebar ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className={styles.headerStatus}>
              <span className={isWaiting ? styles.waitingDot : styles.onlineDot}></span>
              {isWaiting ? 'Waiting...' : `${getOtherUserName()}`}
            </div>
          </div>
          <div className={styles.headerActions}>
            <button 
              onClick={isCallActive ? handleEndCall : handleStartCall}
              className={`${styles.callBtn} ${isCallActive ? styles.inCall : ''}`}
              disabled={isWaiting}
            >
              {isCallActive ? <PhoneOff size={16} /> : <Phone size={16} />}
              <span>{isCallActive ? 'End' : 'Call'}</span>
            </button>
            <button onClick={onLeave} className={styles.leaveBtn}>
              <LogOut size={16} />
              <span>Leave</span>
            </button>
            <span className={styles.userCount}>
              <Users size={14} /> {onlineUsers}/2
            </span>
          </div>
        </div>

        {/* Redesigned Incoming Call */}
        <AnimatePresence>
          {incomingCall && (
            <motion.div 
              className={styles.incomingCall}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className={styles.incomingCallCard}>
                <div className={styles.incomingAvatar}>
                  <div className={styles.incomingAvatarPulse}></div>
                  <PhoneCall size={20} color="#fff" />
                </div>
                <div className={styles.incomingInfo}>
                  <div className={styles.incomingLabel}>Incoming Call</div>
                  <div className={styles.incomingName}>{incomingCall.from} is calling...</div>
                </div>
                <div className={styles.incomingCallActions}>
                  <button onClick={handleAcceptCall} className={styles.acceptCallBtn} title="Accept">
                    <Phone size={18} />
                  </button>
                  <button onClick={handleRejectCall} className={styles.rejectCallBtn} title="Decline">
                    <PhoneOff size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={styles.chatContainer}>
          {isWaiting ? (
            <motion.div 
              className={styles.waitingScreen}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className={styles.waitingVisual}>
                <div className={styles.avatarNode}>
                  <UserCircle2 size={40} color="rgba(255,255,255,0.5)" />
                  <span>You</span>
                </div>
                <div className={styles.connectionLine}></div>
                <div className={styles.shieldNode}>
                  <div className={styles.shieldGlow}></div>
                  <Lock size={32} color="#fff" />
                </div>
                <div className={styles.connectionLine} style={{ borderStyle: 'dashed', opacity: 0.3 }}></div>
                <div className={`${styles.avatarNode} ${styles.avatarDashed}`}>
                  <UserCircle2 size={40} color="rgba(255,255,255,0.2)" />
                  <span>Partner</span>
                </div>
              </div>
              
              <h2>Waiting for your partner...</h2>
              <p>Share your private code or invite link<br/>with your partner to start a secure,<br/>real-time conversation.</p>
              
              <div className={styles.dividerStars}>
                <span></span><Sparkles size={16} color="var(--primary-color)" /><span></span>
              </div>
              
              <div className={styles.notificationToast}>
                <div className={styles.toastIcon}><Sparkles size={16} color="#fff" /></div>
                <div className={styles.toastText}>
                  <strong>Secure room created</strong>
                  <span>Waiting for partner to join...</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className={styles.messagesContainer} ref={messagesContainerRef}>
              <AnimatePresence initial={false}>
                {chat.map((msg, idx) => (
                  <Message 
                    key={msg.id || idx} 
                    message={msg} 
                    isOwn={msg.senderId === currentUserId}
                    onReply={handleReply}
                    currentUserId={currentUserId}
                    onScrollToMessage={scrollToMessage}
                  />
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} style={{ clear: 'both' }} />
            </div>
          )}

          <AnimatePresence>
            {showScrollButton && chat.length > 0 && !isWaiting && (
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
            {typingUser && !isWaiting && (
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
            <MessageInput 
              onSendMessage={handleSendMessage}
              onTyping={() => {
                socket.emit('typing', { room, author: name });
              }}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
              disabled={isWaiting}
            />
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
          otherUserName={getOtherUserName()}
        />
      )}
    </motion.div>
    </div>
  );
};

export default Chat;