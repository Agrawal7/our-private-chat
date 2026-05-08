import React, { useState, useRef, useEffect } from 'react';
import styles from './Message.module.css';
import { getAvatarColor, getInitials } from '../../utils/avatar';

const Message = ({ message, isOwn, onReply, currentUserId }) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const startXRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const wrapperRef = useRef(null);

  // --- Drag & Long Press ---
  const handleStart = (clientX) => {
    startXRef.current = clientX;
    setIsDragging(true);
    
    // Long press
    longPressTimerRef.current = setTimeout(() => {
      startXRef.current = null; // cancel drag
    }, 500);
  };

  const handleMove = (clientX) => {
    if (!isDragging || startXRef.current === null) return;
    let diff = clientX - startXRef.current;
    if (isOwn) {
       if (diff > 0) diff = 0;
       if (diff < -8 && longPressTimerRef.current) {
         clearTimeout(longPressTimerRef.current);
         longPressTimerRef.current = null;
       }
       if (diff < -60) diff = -60 + (diff + 60) * 0.2;
    } else {
       if (diff < 0) diff = 0;
       if (diff > 8 && longPressTimerRef.current) {
         clearTimeout(longPressTimerRef.current);
         longPressTimerRef.current = null;
       }
       if (diff > 60) diff = 60 + (diff - 60) * 0.2;
    }
    setDragOffset(diff);
  };

  const handleEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    const triggerThreshold = isOwn ? -50 : 50;
    const isTriggered = isOwn ? (dragOffset < triggerThreshold) : (dragOffset > triggerThreshold);
    
    if (isTriggered && onReply && startXRef.current !== null) {
      onReply(message);
    }
    setIsDragging(false);
    setDragOffset(0);
    startXRef.current = null;
  };


  if (message.isSystem) {
    return (
      <div className={styles.systemMessage}>
        <div className={styles.systemContent}>
          {message.message}
        </div>
      </div>
    );
  }

  const iconOpacity = Math.min(Math.abs(dragOffset) / 50, 1);
  const iconScale = 0.5 + (iconOpacity * 0.5);

  return (
    <div className={`${styles.messageContainer} ${isOwn ? styles.own : styles.other}`}>
      {!isOwn && (
        <div 
          className={styles.avatar} 
          style={{ backgroundColor: getAvatarColor(message.author) }}
          title={message.author}
        >
          {getInitials(message.author)}
        </div>
      )}

      <div className={styles.messageContentWrapper}>
        {!isOwn && <div className={styles.authorName}>{message.author}</div>}
        
        <div
          ref={wrapperRef}
          className={`${styles.bubbleWrapper} ${isDragging ? styles.isDragging : ''}`}
          style={{ transform: `translateX(${dragOffset}px)` }}
          onTouchStart={(e) => handleStart(e.touches[0].clientX)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX)}
          onTouchEnd={handleEnd}
          onMouseDown={(e) => handleStart(e.clientX)}
          onMouseMove={(e) => { if (isDragging) handleMove(e.clientX); }}
          onMouseUp={handleEnd}
          onMouseLeave={() => { if (isDragging) handleEnd(); }}
        >
          {/* Reply Icon Indicator */}
          <div
            className={`${styles.dragReplyIcon} ${isOwn ? styles.dragReplyIconLeft : styles.dragReplyIconRight}`}
            style={{
              opacity: iconOpacity,
              transform: `translateY(-50%) scale(${iconScale})`
            }}
          >
            ↩️
          </div>

          <div className={styles.bubble}>
            {message.replyTo && (
              <div className={styles.replyPreview}>
                <div className={styles.replyPreviewAuthor}>
                  {message.replyTo.senderId === currentUserId ? 'You' : message.replyTo.author}
                </div>
                <div className={styles.replyPreviewText}>{message.replyTo.message}</div>
              </div>
            )}

            {message.message && <div className={styles.text}>{message.message}</div>}
            
            <div className={styles.meta}>
              <span className={styles.time}>{message.time}</span>
              {isOwn && (
                <span className={styles.status}>
                  {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {isOwn && (
        <div 
          className={styles.avatar} 
          style={{ backgroundColor: getAvatarColor(message.author) }}
          title="You"
        >
          {getInitials(message.author)}
        </div>
      )}
    </div>
  );
};

export default Message;
