import React, { useState } from 'react';
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

      <div className={`${styles.card} animate-pop-in`}>
        <div className={styles.header}>
          <div className={styles.logoBadge}>✨</div>
          <h1 className={styles.title}>Our Private Chat</h1>
          <p className={styles.subtitle}>Secure • Instant • Private</p>
        </div>

        <div className={styles.formSection}>
          <div className={`${styles.inputGroup} animate-fade-in`} style={{ animationDelay: '0.1s' }}>
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

          {!showJoin ? (
            <div className={`${styles.actions} animate-fade-in`} style={{ animationDelay: '0.2s' }}>
              <button onClick={handleCreateRoom} className={`${styles.button} ${styles.createButton}`}>
                <span>Create New Room</span>
                <span className={styles.btnIcon}>＋</span>
              </button>
              
              <div className={styles.divider}>
                <span>or</span>
              </div>

              <button 
                onClick={() => setShowJoin(true)} 
                className={`${styles.button} ${styles.joinButton}`}
              >
                <span>Join Existing Room</span>
                <span className={styles.btnIcon}>→</span>
              </button>
            </div>
          ) : (
            <div className={`${styles.joinForm} animate-fade-in`} style={{ animationDelay: '0.2s' }}>
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
                  Join Room →
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={`${styles.features} animate-fade-in`} style={{ animationDelay: '0.3s' }}>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🔒</span>
            <div className={styles.featureInfo}>
              <span className={styles.featureText}>E2E Private</span>
              <span className={styles.featureDesc}>1-on-1 focus</span>
            </div>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>⚡</span>
            <div className={styles.featureInfo}>
              <span className={styles.featureText}>Real-time</span>
              <span className={styles.featureDesc}>Zero latency</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;