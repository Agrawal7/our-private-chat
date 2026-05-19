import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, PhoneOff, PhoneCall, ArrowDown, Users, Copy, LogOut,
  Check, Lock, Zap, Shield, UserCircle2, Sparkles, Menu, X,
  Music, Palette, Gamepad2, Wand2, BellRing
} from 'lucide-react';
import styles from './Chat.module.css';
import Message from './Message';
import MessageInput from './MessageInput';
import VoiceCall from '../VoiceCall/VoiceCall';
import MiniGame from '../MiniGame/MiniGame';
import AmbientEffects from '../AmbientEffects/AmbientEffects';
import ThemeSelector from '../ThemeSelector/ThemeSelector';
import { analyzeSentiment } from '../../utils/sentiment';
import { triggerSparkles } from '../../utils/sparkles';

const AMBIENT_EFFECTS = [
  { id: 'hug',    label: 'Virtual Hug',  emoji: '🤗' },
  { id: 'stars',  label: 'Star Shower',  emoji: '✨' },
  { id: 'hearts', label: 'Heart Burst',  emoji: '💖' },
];

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
  isMusicPlaying,
  toggleMusic,
  globalAudioRef,
}) => {
  const [isCallActive, setIsCallActive]       = useState(false);
  const [incomingCall, setIncomingCall]       = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [moodScore, setMoodScore]             = useState(0);
  const [replyingTo, setReplyingTo]           = useState(null);
  const [copied, setCopied]                   = useState(false);
  const [inviteCopied, setInviteCopied]       = useState(false);
  const [showSidebar, setShowSidebar]         = useState(false);

  // ── Feature states ─────────────────────────────────────────
  const [currentTheme, setCurrentTheme]       = useState('default');
  const [showMiniGame, setShowMiniGame]       = useState(false);
  const [activeEffect, setActiveEffect]       = useState(null);
  const [isNudging, setIsNudging]             = useState(false);
  const [showEffectPanel, setShowEffectPanel] = useState(false);
  const [nudgeCooldown, setNudgeCooldown]     = useState(false);

  const messagesEndRef        = useRef(null);
  const messagesContainerRef  = useRef(null);
  const voiceCallRef          = useRef(null);
  const isUserScrolledUpRef   = useRef(false);

  // ── Apply theme to <html> data-theme attribute ─────────────
  useEffect(() => {
    const root = document.documentElement;
    if (currentTheme === 'default') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', currentTheme);
    }
    return () => root.removeAttribute('data-theme');
  }, [currentTheme]);

  // ── BGM duck during calls ──────────────────────────────────
  useEffect(() => {
    if (globalAudioRef?.current) {
      globalAudioRef.current.volume = isCallActive ? 0.03 : 0.4;
    }
  }, [isCallActive, globalAudioRef]);

  // ── Sentiment analysis ─────────────────────────────────────
  useEffect(() => {
    const recent = chat.slice(-10);
    let score = 0;
    recent.forEach(msg => { score += analyzeSentiment(msg.message); });
    setMoodScore(Math.max(-5, Math.min(5, score)));
  }, [chat]);

  const getDynamicStyle = () => {
    const t = 'background 2s ease-in-out';
    if (moodScore >= 4)  return { background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(245, 158, 11, 0.25) 100%)', transition: t };
    if (moodScore >= 2)  return { background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)', transition: t };
    if (moodScore <= -4) return { background: 'linear-gradient(135deg, rgba(185, 28, 28, 0.25) 0%, rgba(88, 28, 135, 0.25) 100%)', transition: t };
    if (moodScore <= -2) return { background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(76, 29, 149, 0.15) 100%)', transition: t };
    return { transition: t };
  };

  // ── Scroll helpers ─────────────────────────────────────────
  const checkIfAtBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' });
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { scrollToBottom(); }, [chat]);
  useEffect(() => {
    const c = messagesContainerRef.current;
    if (c) { c.addEventListener('scroll', handleScroll); return () => c.removeEventListener('scroll', handleScroll); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { setTimeout(scrollToBottom, 100); }, []);

  // ── Call socket events ─────────────────────────────────────
  useEffect(() => {
    const onIncoming  = ({ from, callerId }) => setIncomingCall({ from, callerId });
    const onAccepted  = () => { setIsCallActive(true); setIncomingCall(null); };
    const onRejected  = () => setIncomingCall(null);
    const onEnded     = () => { setIsCallActive(false); setIncomingCall(null); };

    socket.on('incoming-call',  onIncoming);
    socket.on('call-accepted',  onAccepted);
    socket.on('call-rejected',  onRejected);
    socket.on('call-ended',     onEnded);
    return () => {
      socket.off('incoming-call',  onIncoming);
      socket.off('call-accepted',  onAccepted);
      socket.off('call-rejected',  onRejected);
      socket.off('call-ended',     onEnded);
    };
  }, [socket]);

  // ── Theme socket events ────────────────────────────────────
  useEffect(() => {
    const onThemeChanged = ({ theme }) => setCurrentTheme(theme);
    socket.on('room_theme_changed', onThemeChanged);
    return () => socket.off('room_theme_changed', onThemeChanged);
  }, [socket]);

  // ── Ambient effect socket events ───────────────────────────
  useEffect(() => {
    const onEffect = ({ effectType }) => setActiveEffect(effectType);
    socket.on('receive_ambient_effect', onEffect);
    return () => socket.off('receive_ambient_effect', onEffect);
  }, [socket]);

  // ── Nudge socket events ────────────────────────────────────
  useEffect(() => {
    const onNudge = () => {
      setIsNudging(true);
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
      setTimeout(() => setIsNudging(false), 700);
    };
    socket.on('receive_nudge', onNudge);
    return () => socket.off('receive_nudge', onNudge);
  }, [socket]);

  // ── Tab notification ───────────────────────────────────────
  useEffect(() => {
    const onVisibility = () => { if (!document.hidden) document.title = 'Privio - Private Space'; };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { document.removeEventListener('visibilitychange', onVisibility); document.title = 'Privio - Private Space'; };
  }, []);

  useEffect(() => {
    if (chat.length > 0) {
      const last = chat[chat.length - 1];
      if (last.senderId !== currentUserId) {
        if (document.hidden) document.title = '(1) New Message - Privio';
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => {});
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.length, currentUserId]);

  // ── Call handlers ──────────────────────────────────────────
  const handleStartCall  = () => { setIsCallActive(true); socket.emit('call-user', { room, from: name }); };
  const handleAcceptCall = () => {
    setIsCallActive(true); setIncomingCall(null);
    socket.emit('accept-call', { room });
    setTimeout(() => { if (voiceCallRef.current?.answerCall) voiceCallRef.current.answerCall(); }, 100);
  };
  const handleRejectCall = () => { setIncomingCall(null); socket.emit('reject-call', { room }); };
  const handleEndCall    = () => { setIsCallActive(false); socket.emit('end-call', { room }); };

  // ── Copy helpers ───────────────────────────────────────────
  const copyRoomCode = () => { navigator.clipboard.writeText(room); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const copyInviteLink = () => {
    navigator.clipboard.writeText(`Join my private space with code: ${room}`);
    setInviteCopied(true); setTimeout(() => setInviteCopied(false), 2000);
  };

  // ── Theme change ───────────────────────────────────────────
  const handleThemeChange = (themeId) => {
    setCurrentTheme(themeId);
    socket.emit('change_room_theme', { room, theme: themeId });
  };

  // ── Ambient effect send ────────────────────────────────────
  const handleSendEffect = (effectId) => {
    setShowEffectPanel(false);
    setActiveEffect(effectId);                                   // show on own screen too
    socket.emit('send_ambient_effect', { room, effectType: effectId });
  };

  // ── Nudge send ─────────────────────────────────────────────
  const handleNudge = () => {
    if (nudgeCooldown || isWaiting) return;
    setIsNudging(true);
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
    setTimeout(() => setIsNudging(false), 700);

    socket.emit('send_nudge', { room });
    setNudgeCooldown(true);
    setTimeout(() => setNudgeCooldown(false), 5000);
  };

  // ── Message helpers ────────────────────────────────────────
  const handleSendMessage = (msg) => {
    if (msg) triggerSparkles(msg);
    const messageData = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      room, author: name, message: msg, senderId: currentUserId,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      ...(replyingTo ? { replyTo: replyingTo } : {}),
    };
    socket.emit('send_message', messageData);
    setReplyingTo(null);
  };

  const handleReply = (message) => setReplyingTo(message);

  const scrollToMessage = (messageId) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add(styles.highlightMessage);
      setTimeout(() => el.classList.remove(styles.highlightMessage), 2000);
    }
  };

  const getOtherUserName = () => otherUser ? (otherUser.displayName || otherUser.name) : 'partner';
  const isWaiting = onlineUsers < 2;

  return (
    <div className={`${styles.chatPage} ${isNudging ? styles.screenShaking : ''}`}>
      <motion.div
        className={styles.container}
        style={getDynamicStyle()}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Ambient Effects overlay */}
        <AmbientEffects activeEffect={activeEffect} onEffectDone={() => setActiveEffect(null)} />

        {/* Mobile Sidebar Backdrop */}
        <AnimatePresence>
          {showSidebar && <div className={styles.sidebarBackdrop} onClick={() => setShowSidebar(false)} />}
        </AnimatePresence>

        {/* ── Sidebar ─────────────────────────────────────────── */}
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

          {/* ROOM INFO */}
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

          {/* ROOM THEMES */}
          <div className={styles.sidebarSection}>
            <h4 className={styles.sectionTitle}>
              <Palette size={11} style={{ display: 'inline', marginRight: 6 }} />
              ROOM THEME
            </h4>
            <ThemeSelector currentTheme={currentTheme} onChangeTheme={handleThemeChange} />
          </div>

          {/* BACKGROUND MUSIC */}
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

          {/* STATUS */}
          <div className={styles.sidebarSection}>
            <h4 className={styles.sectionTitle}>STATUS</h4>
            <div className={styles.statusCard}>
              <div className={`${styles.statusRing} ${!isWaiting ? styles.statusRingConnected : ''}`} />
              <div className={styles.statusInfo}>
                <span className={styles.statusText}>{isWaiting ? 'Waiting for partner...' : 'Connected'}</span>
                <span className={styles.statusSubtext}>{isWaiting ? "Your partner hasn't joined yet." : 'Secure connection established.'}</span>
              </div>
            </div>
          </div>

          {/* FEATURES */}
          <div className={styles.sidebarSection}>
            <h4 className={styles.sectionTitle}>ROOM FEATURES</h4>
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <div className={styles.featureIconWrap}><Lock size={16} /></div>
                <div className={styles.featureTexts}><span className={styles.fTitle}>End-to-end</span><span className={styles.fDesc}>Encrypted</span></div>
                <Check size={16} color="var(--success-color)" className={styles.checkIcon} />
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIconWrap}><Zap size={16} /></div>
                <div className={styles.featureTexts}><span className={styles.fTitle}>Real-time</span><span className={styles.fDesc}>Communication</span></div>
                <Check size={16} color="var(--success-color)" className={styles.checkIcon} />
              </div>
            </div>
          </div>

          <div className={styles.sidebarFooter}>
            <Shield size={20} className={styles.footerShield} />
            <p>Your privacy is our priority.<br />We don't store your conversations.</p>
          </div>
        </div>

        {/* ── Main Chat Area ───────────────────────────────────── */}
        <div className={styles.mainArea}>

          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <button className={styles.menuBtn} onClick={() => setShowSidebar(p => !p)} title="Toggle sidebar">
                {showSidebar ? <X size={18} /> : <Menu size={18} />}
              </button>
              <div className={styles.headerStatus}>
                <span className={isWaiting ? styles.waitingDot : styles.onlineDot} />
                {isWaiting ? 'Waiting...' : getOtherUserName()}
              </div>
            </div>

            <div className={styles.headerActions}>
              {/* Nudge button */}
              <motion.button
                className={`${styles.nudgeBtn} ${nudgeCooldown ? styles.nudgeCooldown : ''}`}
                onClick={handleNudge}
                disabled={isWaiting || nudgeCooldown}
                title={nudgeCooldown ? 'Cooldown...' : 'Nudge partner'}
                whileTap={!isWaiting && !nudgeCooldown ? { scale: 0.88 } : {}}
              >
                <BellRing size={15} />
              </motion.button>

              {/* Ambient effects button */}
              <div className={styles.effectBtnWrap}>
                <motion.button
                  className={`${styles.effectBtn} ${showEffectPanel ? styles.effectBtnActive : ''}`}
                  onClick={() => setShowEffectPanel(p => !p)}
                  disabled={isWaiting}
                  title="Send ambient effect"
                  whileTap={!isWaiting ? { scale: 0.88 } : {}}
                >
                  <Wand2 size={15} />
                </motion.button>
                <AnimatePresence>
                  {showEffectPanel && (
                    <motion.div
                      className={styles.effectPanel}
                      initial={{ opacity: 0, scale: 0.85, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.85, y: 8 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                    >
                      {AMBIENT_EFFECTS.map(e => (
                        <button key={e.id} className={styles.effectPill} onClick={() => handleSendEffect(e.id)}>
                          <span>{e.emoji}</span>
                          <span>{e.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mini Games button */}
              <motion.button
                className={`${styles.gameBtn} ${showMiniGame ? styles.gameBtnActive : ''}`}
                onClick={() => setShowMiniGame(p => !p)}
                disabled={isWaiting}
                title="Mini Games"
                whileTap={!isWaiting ? { scale: 0.88 } : {}}
              >
                <Gamepad2 size={15} />
              </motion.button>

              {/* Call button */}
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

          {/* Incoming Call banner */}
          <AnimatePresence>
            {incomingCall && (
              <motion.div className={styles.incomingCall} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className={styles.incomingCallCard}>
                  <div className={styles.incomingAvatar}>
                    <div className={styles.incomingAvatarPulse} />
                    <PhoneCall size={20} color="#fff" />
                  </div>
                  <div className={styles.incomingInfo}>
                    <div className={styles.incomingLabel}>Incoming Call</div>
                    <div className={styles.incomingName}>{incomingCall.from} is calling...</div>
                  </div>
                  <div className={styles.incomingCallActions}>
                    <button onClick={handleAcceptCall} className={styles.acceptCallBtn} title="Accept"><Phone size={18} /></button>
                    <button onClick={handleRejectCall} className={styles.rejectCallBtn} title="Decline"><PhoneOff size={18} /></button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Container */}
          <div className={styles.chatContainer}>
            {isWaiting ? (
              <motion.div className={styles.waitingScreen} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className={styles.waitingVisual}>
                  <div className={styles.avatarNode}><UserCircle2 size={40} color="rgba(255,255,255,0.5)" /><span>You</span></div>
                  <div className={styles.connectionLine} />
                  <div className={styles.shieldNode}><div className={styles.shieldGlow} /><Lock size={32} color="#fff" /></div>
                  <div className={styles.connectionLine} style={{ borderStyle: 'dashed', opacity: 0.3 }} />
                  <div className={`${styles.avatarNode} ${styles.avatarDashed}`}><UserCircle2 size={40} color="rgba(255,255,255,0.2)" /><span>Partner</span></div>
                </div>
                <h2>Waiting for your partner...</h2>
                <p>Share your private code or invite link<br />with your partner to start a secure,<br />real-time conversation.</p>
                <div className={styles.dividerStars}><span /><Sparkles size={16} color="var(--primary-color)" /><span /></div>
                <div className={styles.notificationToast}>
                  <div className={styles.toastIcon}><Sparkles size={16} color="#fff" /></div>
                  <div className={styles.toastText}><strong>Secure room created</strong><span>Waiting for partner to join...</span></div>
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

            {/* Scroll button */}
            <AnimatePresence>
              {showScrollButton && chat.length > 0 && !isWaiting && (
                <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} onClick={scrollToBottom} className={styles.scrollButton}>
                  <ArrowDown size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> New messages
                </motion.button>
              )}
            </AnimatePresence>

            {/* Typing indicator */}
            <AnimatePresence>
              {typingUser && !isWaiting && (
                <motion.div className={styles.typingIndicator} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <div className={styles.typingDots}><span /><span /><span /></div>
                  <span>{typingUser}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mini Game panel */}
            <MiniGame
              socket={socket}
              room={room}
              myName={name}
              currentUserId={currentUserId}
              otherUser={otherUser}
              isWaiting={isWaiting}
              isOpen={showMiniGame}
              onClose={() => setShowMiniGame(false)}
              onOpen={() => setShowMiniGame(true)}
            />

            <div className={styles.inputArea}>
              <MessageInput
                onSendMessage={handleSendMessage}
                onTyping={() => socket.emit('typing', { room, author: name })}
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