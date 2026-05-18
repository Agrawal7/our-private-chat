import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Reply, Check, CheckCheck } from 'lucide-react';
import styles from './Message.module.css';

const Message = ({ message, isOwn, onReply, currentUserId, onScrollToMessage }) => {
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
      <motion.div 
        className={styles.systemMessage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.systemContent}>
          {message.message}
        </div>
      </motion.div>
    );
  }

  const iconOpacity = Math.min(Math.abs(dragOffset) / 50, 1);
  const iconScale = 0.5 + (iconOpacity * 0.5);

  return (
    <motion.div 
      layout
      id={`msg-${message.id}`}
      className={`${styles.messageContainer} ${isOwn ? styles.own : styles.other}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 250, damping: 20 }}
    >
      <div className={styles.messageContentWrapper}>
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
            <Reply size={16} color="white" />
          </div>

          <div className={styles.bubble}>
            {message.replyTo && (
              <div 
                className={styles.replyPreview}
                onClick={() => onScrollToMessage && onScrollToMessage(message.replyTo.id)}
              >
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
                  {message.status === 'read' || message.status === 'delivered' ? 
                    <CheckCheck size={14} color={message.status === 'read' ? "#38bdf8" : "inherit"} /> : 
                    <Check size={14} />}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Message;
