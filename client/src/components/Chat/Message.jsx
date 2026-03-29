import React from 'react';
import styles from './Message.module.css';

const Message = ({ message, isOwn, currentUserId }) => {
  // Determine if this is a system message or user message
  const isSystemMessage = message.isSystem || false;
  
  if (isSystemMessage) {
    return (
      <div className={styles.systemMessage}>
        <div className={styles.systemContent}>
          <span className={styles.systemIcon}>ℹ️</span>
          {message.message}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`${styles.message} ${isOwn ? styles.own : styles.other}`}>
      {!isOwn && (
        <div className={styles.author}>
          <span className={styles.authorIcon}>👤</span>
          {message.author || message.displayName || 'User'}
        </div>
      )}
      <div className={styles.content}>
        {message.message}
      </div>
      <div className={styles.time}>{message.time}</div>
    </div>
  );
};

export default Message;