import React, { useState, useRef } from 'react';
import styles from './Message.module.css';

const Message = ({ message, isOwn, currentUserId, onReply }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showDragHint, setShowDragHint] = useState(false);
  const dragStartRef = useRef(null);
  const dragTimeoutRef = useRef(null);

  // Handle drag start
  const handleDragStart = (e) => {
    if (!isOwn) {
      // Store message data for drag
      const dragData = {
        id: message.id || Date.now(),
        author: message.author || message.displayName,
        message: message.message,
        time: message.time,
        displayName: message.displayName
      };
      
      // Set drag data
      e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
      e.dataTransfer.effectAllowed = 'copy';
      
      // Store start position
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        message: dragData
      };
      
      setIsDragging(true);
      
      // Clear any existing timeout
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    }
  };

  // Handle drag end - this is where the reply is triggered
  const handleDragEnd = (e) => {
    if (!isOwn && dragStartRef.current) {
      const dragEndX = e.clientX;
      const dragEndY = e.clientY;
      
      // Calculate drag distance
      const dragDistance = Math.sqrt(
        Math.pow(dragEndX - dragStartRef.current.x, 2) + 
        Math.pow(dragEndY - dragStartRef.current.y, 2)
      );
      
      // If dragged more than 30px, trigger reply
      if (dragDistance > 30 && dragStartRef.current.message) {
        console.log('✓ Message dragged, triggering reply:', dragStartRef.current.message);
        
        // Call the reply function
        if (onReply) {
          onReply(dragStartRef.current.message);
        }
      }
      
      setIsDragging(false);
      
      // Reset after timeout
      dragTimeoutRef.current = setTimeout(() => {
        dragStartRef.current = null;
      }, 500);
    }
  };

  // Handle drag over
  const handleDragOver = (e) => {
    if (!isOwn) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  // Show hint on hover
  const handleMouseEnter = () => {
    if (!isOwn && !isDragging) {
      setShowDragHint(true);
    }
  };

  const handleMouseLeave = () => {
    setShowDragHint(false);
  };

  // System message
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
      className={`${styles.message} ${isOwn ? styles.own : styles.other} ${isDragging ? styles.dragging : ''}`}
      draggable={!isOwn}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Drag hint - appears on hover */}
      {!isOwn && showDragHint && !isDragging && (
        <div className={styles.dragHintIcon}>
          <span className={styles.dragArrow}>↩️</span>
          <span className={styles.dragText}>Drag to reply</span>
        </div>
      )}
      
      {/* Dragging indicator */}
      {!isOwn && isDragging && (
        <div className={styles.draggingIndicator}>
          <span className={styles.draggingIcon}>📋</span>
          <span className={styles.draggingText}>Release to reply to "{message.message.substring(0, 30)}..."</span>
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