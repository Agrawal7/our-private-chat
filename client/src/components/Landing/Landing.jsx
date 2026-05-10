import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Lock, Zap, Plus, LogIn, Clock, Users, ShieldCheck, UserCircle, MessageSquare } from 'lucide-react';
import styles from './Landing.module.css';

const Landing = ({ createRoom, joinRoom }) => {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);

  const handleCreateRoom = () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }
    createRoom(name);
  };

  const handleJoinRoom = () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      alert('Please enter room code');
      return;
    }
    joinRoom(name, roomCode);
  };

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.logoContainer}>
          <img src="/logo.png" alt="Privio" className={styles.topLogoImage} />
        </div>
        <div className={styles.topRightText}>
          <Lock size={14} className={styles.topLockIcon} />
          Your conversations. Your space.
        </div>
      </div>

      <div className={styles.contentWrapper}>
        {/* Left Content Area */}
        <div className={styles.leftContent}>
          <motion.div 
            className={styles.heroText}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1>A private space<br/><span className={styles.gradientText}>for real conversations.</span></h1>
            <p>No audience. No tracking.<br/>Just you and .</p>
          </motion.div>

          <motion.div 
            className={styles.featuresList}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className={styles.featureItem}>
              <ShieldCheck size={20} className={styles.fIcon} />
              <span>End-to-end<br/>Encrypted</span>
            </div>
            <div className={styles.featureItem}>
              <Zap size={20} className={styles.fIcon} />
              <span>Real-time<br/>Communication</span>
            </div>
            <div className={styles.featureItem}>
              <Clock size={20} className={styles.fIcon} />
              <span>Temporary<br/>Private Rooms</span>
            </div>
            <div className={styles.featureItem}>
              <UserCircle size={20} className={styles.fIcon} />
              <span>Anonymous<br/>by Design</span>
            </div>
          </motion.div>

          {/* Decorative Chat Preview */}
          <motion.div 
            className={styles.chatPreview}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className={styles.previewHeader}>
              <span>Room: 7G8X-K2L9 <Lock size={12} style={{marginLeft: 4}}/></span>
              <span className={styles.liveIndicator}><span className={styles.dot}></span> Live</span>
            </div>
            <div className={styles.previewMessages}>
              <div className={styles.pMessage}>
                <div className={styles.pAvatar1}></div>
                <div className={styles.pBubble1}>Hey, you here? <span className={styles.pTime}>17:32 ✓✓</span></div>
              </div>
              <div className={styles.pMessageRight}>
                <div className={styles.pBubble2}>Yes! I'm here 😊 <span className={styles.pTime}>17:33</span></div>
              </div>
              <div className={styles.pMessage}>
                <div className={styles.pAvatar2}></div>
                <div className={styles.pBubble1}>This is our private space ✨ <span className={styles.pTime}>17:34</span></div>
              </div>
            </div>
            <div className={styles.typingIndicator}>
              <span className={styles.tDot}></span><span className={styles.tDot}></span><span className={styles.tDot}></span> Typing...
            </div>
            <div className={styles.floatingLock}><Lock size={48} color="#fff" /></div>
          </motion.div>

          {/* Stats Row */}
          <motion.div 
            className={styles.statsRow}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className={styles.statItem}>
              <Users size={24} className={styles.sIcon} />
              <div>
                <h4>12K+</h4>
                <p>Rooms Created</p>
              </div>
            </div>
            <div className={styles.statItem}>
              <ShieldCheck size={24} className={styles.sIcon} />
              <div>
                <h4>99.99%</h4>
                <p>Uptime</p>
              </div>
            </div>
            <div className={styles.statItem}>
              <Zap size={24} className={styles.sIcon} />
              <div>
                <h4>&lt;50ms</h4>
                <p>Latency</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Form Area */}
        <div className={styles.rightContent}>
          <motion.div 
            className={styles.card}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className={styles.header}>
              <motion.div 
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <img src="/logo.png" alt="Privio" className={styles.mainLogoImage} />
              </motion.div>
              <p className={styles.subtitle}>SECURE • INTIMATE • REAL-TIME</p>
            </div>

            <div className={styles.formSection}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>What should we call you?</label>
                <input
                  type="text"
                  placeholder="Enter your name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.input}
                  autoFocus
                />
              </div>

              <AnimatePresence mode="wait">
                {!showJoin ? (
                  <motion.div 
                    key="create"
                    className={styles.actions}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <button onClick={handleCreateRoom} className={`${styles.button} ${styles.createButton}`}>
                      <span>Create New Room</span>
                      <Plus size={20} className={styles.btnIcon} />
                    </button>
                    
                    <div className={styles.divider}>
                      <span>OR</span>
                    </div>

                    <button 
                      onClick={() => setShowJoin(true)} 
                      className={`${styles.button} ${styles.joinButton}`}
                    >
                      <span>Join Existing Room</span>
                      <LogIn size={20} className={styles.btnIcon} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="join"
                    className={styles.joinForm}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Room Code</label>
                      <input
                        type="text"
                        placeholder="e.g. 7J6NNR"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.joinActions}>
                      <button onClick={() => setShowJoin(false)} className={styles.backButton}>
                        Back
                      </button>
                      <button onClick={handleJoinRoom} className={styles.joinNowButton}>
                        Join Room <ArrowRight size={18} style={{marginLeft: 8, verticalAlign: 'middle'}} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className={styles.features}>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>
                  <Lock size={20} color="var(--primary-color)" />
                </div>
                <div className={styles.featureInfo}>
                  <span className={styles.featureText}>E2E Private</span>
                  <span className={styles.featureDesc}>1-on-1 focus</span>
                </div>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>
                  <Zap size={20} color="var(--secondary-color)" />
                </div>
                <div className={styles.featureInfo}>
                  <span className={styles.featureText}>Real-time</span>
                  <span className={styles.featureDesc}>Zero latency</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <Lock size={14} className={styles.footerIcon} />
        Your privacy is our priority. We don't store your conversations.
      </div>
    </div>
  );
};

export default Landing;