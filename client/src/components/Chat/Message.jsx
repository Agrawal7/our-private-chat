import React, { useState, useRef } from 'react';
import styles from './Message.module.css';

const Message = ({ message, isOwn, onReply }) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(null);

  // Handlers for drag to reply
  const handleStart = (clientX) => {
    startXRef.current = clientX;
    setIsDragging(true);
  };

  const handleMove = (clientX) => {
    if (!isDragging || startXRef.current === null) return;
    
    // Calculate drag distance
    let diff = clientX - startXRef.current;
    
    // Only allow swiping to the right
    if (diff < 0) diff = 0; 
    // Add resistance after 60px
    if (diff > 60) diff = 60 + (diff - 60) * 0.2; 

    setDragOffset(diff);
  };

  const handleEnd = () => {
    if (dragOffset > 50 && onReply) {
      onReply(message);
    }
    setIsDragging(false);
    setDragOffset(0);
    startXRef.current = null;
  };

  // Touch events
  const onTouchStart = (e) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e) => handleMove(e.touches[0].clientX);
  const onTouchEnd = () => handleEnd();

  // Mouse events for desktop
  const onMouseDown = (e) => handleStart(e.clientX);
  const onMouseMove = (e) => {
    if (isDragging) handleMove(e.clientX);
  };
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => {
    if (isDragging) handleEnd();
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

  // Calculate icon opacity and scale based on drag offset
  const iconOpacity = Math.min(dragOffset / 50, 1);
  const iconScale = 0.5 + (Math.min(dragOffset / 50, 1) * 0.5);

  return (
    <div className={`${styles.message} ${isOwn ? styles.own : styles.other}`}>
      <div 
        className={`${styles.messageWrapper} ${isDragging ? styles.isDragging : ''}`}
        style={{ transform: `translateX(${dragOffset}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        <div 
          className={`${styles.dragReplyIcon} ${styles.dragReplyIconRight}`}
          style={{ 
            opacity: iconOpacity,
            transform: `translateY(-50%) scale(${iconScale})`
          }}
        >
          ↩️
        </div>

        <div style={{ width: '100%' }}>
          {!isOwn && (
            <div className={styles.author}>
              <span className={styles.authorIcon}>👤</span>
              {message.author}
            </div>
          )}
          
          <div className={styles.content}>
            {message.replyTo && (
              <div className={styles.replyPreview}>
                <div className={styles.replyPreviewAuthor}>
                  {message.replyTo.senderId === message.senderId ? 'You' : message.replyTo.author}
                </div>
                <div className={styles.replyPreviewText}>{message.replyTo.message}</div>
              </div>
            )}
            {message.message}
          </div>
          
          <div className={styles.timeWrapper}>
            <span className={styles.time}>{message.time}</span>
            {isOwn && (
              <span className={styles.status}>
                {message.status === 'read' ? (
                  <span className={styles.blueTick}>✓✓</span>
                ) : message.status === 'delivered' ? (
                  <span className={styles.greyTick}>✓✓</span>
                ) : (
                  <span className={styles.greyTick}>✓</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;

