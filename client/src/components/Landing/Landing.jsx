import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Lock, Zap, Plus, LogIn } from 'lucide-react';
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
      {/* Dynamic Background */}
      <div className="mesh-gradient">
        <div className="mesh-ball ball-1"></div>
        <div className="mesh-ball ball-2"></div>
        <div className="mesh-ball ball-3"></div>
      </div>

      <motion.div 
        className={styles.card}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      >
        <div className={styles.header}>
          <motion.div 
            className={styles.logoBadge}
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles size={32} color="#fff" />
          </motion.div>
          <motion.h1 
            className={styles.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Our Private Space
          </motion.h1>
          <motion.p 
            className={styles.subtitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Secure • Intimate • Real-time
          </motion.p>
        </div>

        <div className={styles.formSection}>
          <motion.div 
            className={styles.inputGroup}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className={styles.label}>What should we call you?</label>
            <input
              type="text"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              autoFocus
            />
          </motion.div>

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
                  <span>or</span>
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
                  <label className={styles.label}>6-Digit Room Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 7J6NNR"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className={styles.input}
                    maxLength={6}
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

        <motion.div 
          className={styles.features}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
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
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Landing;