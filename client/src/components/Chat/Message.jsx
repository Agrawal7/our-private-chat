import React, { useState, useRef } from 'react';
import styles from './Message.module.css';

const Message = ({ message, isOwn, currentUserId, onReply }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleDragStart = (e) => {
    if (!isOwn) {
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        message: message
      };
      setIsDragging(true);
      e.dataTransfer.setData('text/plain', JSON.stringify(message));
      e.dataTransfer.effectAllowed = 'copy';
    }
  };

  const handleDragEnd = (e) => {
    setIsDragging(false);
    const dragEndX = e.clientX;
    const dragEndY = e.clientY;
    
    const dragDistance = Math.sqrt(
      Math.pow(dragEndX - dragStartRef.current.x, 2) + 
      Math.pow(dragEndY - dragStartRef.current.y, 2)
    );
    
    if (dragDistance > 50 && dragStartRef.current.message) {
      onReply(dragStartRef.current.message);
    }
    
    dragStartRef.current = { x: 0, y: 0, message: null };
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isOwn) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDragPosition({ x, y });
    }
  };

  const handleDragLeave = () => {
    setDragPosition({ x: 0, y: 0 });
  };

  if (message.isSystem) {
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
    <div 
      className={`${styles.message} ${isOwn ? styles.own : styles.other}`}
      draggable={!isOwn}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {!isOwn && isDragging && dragPosition.x > 0 && (
        <div 
          className={styles.replyIndicator}
          style={{ left: dragPosition.x, top: dragPosition.y }}
        >
          ↩️ Reply to "{message.message.substring(0, 30)}..."
        </div>
      )}
      
      {!isOwn && (
        <div className={styles.author}>
          <span className={styles.authorIcon}>👤</span>
          {message.displayName || message.author}
        </div>
      )}
      
      {message.replyTo && (
        <div className={styles.replyPreview}>
          <div className={styles.replyHeader}>
            <span className={styles.replyIcon}>↩️</span>
            Replying to {message.replyTo.author}
          </div>
          <div className={styles.replyContent}>
            {message.replyTo.message.substring(0, 80)}
            {message.replyTo.message.length > 80 && '...'}
          </div>
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