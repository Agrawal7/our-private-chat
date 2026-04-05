import React, { useState, useRef, useEffect } from 'react';
import styles from './Message.module.css';

const Message = ({ message, isOwn, currentUserId, onReply }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const messageRef = useRef(null);

  // Handle mouse down (start drag)
  const handleMouseDown = (e) => {
    if (!isOwn && e.button === 0) { // Left click only
      setStartPos({ x: e.clientX, y: e.clientY });
      setIsDragging(true);
      document.body.style.userSelect = 'none';
      e.preventDefault();
    }
  };

  // Handle mouse move (while dragging)
  const handleMouseMove = (e) => {
    if (isDragging && !isOwn) {
      const deltaX = Math.abs(e.clientX - startPos.x);
      const deltaY = Math.abs(e.clientY - startPos.y);
      
      // Visual feedback when dragged enough
      if (deltaX > 30 || deltaY > 10) {
        if (messageRef.current) {
          messageRef.current.style.opacity = '0.6';
          messageRef.current.style.transform = `translateX(${e.clientX - startPos.x}px)`;
        }
      }
    }
  };

  // Handle mouse up (end drag - trigger reply)
  const handleMouseUp = (e) => {
    if (isDragging && !isOwn) {
      const deltaX = Math.abs(e.clientX - startPos.x);
      const deltaY = Math.abs(e.clientY - startPos.y);
      
      console.log('Mouse up - Delta X:', deltaX, 'Delta Y:', deltaY);
      
      // If dragged more than 50px horizontally, trigger reply
      if (deltaX > 50) {
        console.log('✅ REPLY TRIGGERED!');
        const messageData = {
          id: message.id || Date.now(),
          author: message.author || message.displayName,
          message: message.message,
          time: message.time
        };
        if (onReply) {
          onReply(messageData);
        }
      } else {
        console.log('❌ Not enough drag distance:', deltaX);
      }
      
      // Reset styles
      if (messageRef.current) {
        messageRef.current.style.opacity = '';
        messageRef.current.style.transform = '';
      }
      setIsDragging(false);
      document.body.style.userSelect = '';
    }
  };

  // Clean up event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, startPos]);

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
      ref={messageRef}
      className={`${styles.message} ${isOwn ? styles.own : styles.other}`}
      onMouseDown={handleMouseDown}
      style={{ 
        cursor: !isOwn ? 'grab' : 'default',
        transition: 'transform 0.05s linear',
        userSelect: isDragging ? 'none' : 'auto'
      }}
    >
      {/* Drag hint - shows on hover */}
      {!isOwn && !isDragging && (
        <div className={styles.dragHintIcon}>
          <span className={styles.dragArrow}>↩️</span>
          <span className={styles.dragText}>Drag to reply</span>
        </div>
      )}
      
      {/* Dragging indicator */}
      {!isOwn && isDragging && (
        <div className={styles.draggingIndicator}>
          <span className={styles.draggingIcon}>↩️</span>
          <span className={styles.draggingText}>
            Release to reply
          </span>
        </div>
      )}
      
      {/* Author name for other messages */}
      {!isOwn && (
        <div className={styles.author}>
          <span className={styles.authorIcon}>👤</span>
          {message.displayName || message.author}
        </div>
      )}
      
      {/* Reply preview - shows original message being replied to */}
      {message.replyTo && (
        <div className={styles.replyPreview}>
          <div className={styles.replyHeader}>
            <span className={styles.replyIcon}>↩️</span>
            Replying to <strong>{message.replyTo.author}</strong>
          </div>
          <div className={styles.replyContent}>
            "{message.replyTo.message.substring(0, 80)}"
            {message.replyTo.message.length > 80 && '...'}
          </div>
        </div>
      )}
      
      {/* Main message content */}
      <div className={styles.content}>
        {message.message}
      </div>
      
      {/* Timestamp */}
      <div className={styles.time}>{message.time}</div>
    </div>
  );
};

export default Message;