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
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}># Our Private Chat!</h1>
          <p className={styles.subtitle}>Private two-user chat room</p>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Your name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.divider}>
          <span>OR</span>
        </div>

        {!showJoin ? (
          <button onClick={handleCreateRoom} className={`${styles.button} ${styles.createButton}`}>
            Create New Room
          </button>
        ) : null}

        {!showJoin ? (
          <button 
            onClick={() => setShowJoin(true)} 
            className={`${styles.button} ${styles.joinButton}`}
          >
            Join existing room
          </button>
        ) : (
          <div className={styles.joinForm}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>ENTER 6-DIGIT CODE</label>
              <input
                type="text"
                placeholder="e.g., 7J6NNR"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className={styles.input}
                maxLength={6}
              />
            </div>
            <div className={styles.joinActions}>
              <button onClick={() => setShowJoin(false)} className={styles.backButton}>
                ← Back
              </button>
              <button onClick={handleJoinRoom} className={styles.joinNowButton}>
                Join →
              </button>
            </div>
          </div>
        )}

        <div className={styles.features}>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🔒</span>
            <span className={styles.featureText}>Private</span>
            <span className={styles.featureDesc}>1-on-1 conversations</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>⚡</span>
            <span className={styles.featureText}>Real-time</span>
            <span className={styles.featureDesc}>Instant messaging</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🎭</span>
            <span className={styles.featureText}>No signup</span>
            <span className={styles.featureDesc}>Just a name & room</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;