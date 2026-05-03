import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './Message.module.css';

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '👍', '🔥'];

const Message = ({ message, isOwn, onReply, onReact, currentUserId }) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const startXRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const pickerRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close picker when clicking outside
  useEffect(() => {
    if (!showPicker) return;
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target) &&
          wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showPicker]);

  // --- Drag to reply ---
  const handleStart = (clientX) => {
    startXRef.current = clientX;
    setIsDragging(true);
    // Long press to show reaction picker
    longPressTimerRef.current = setTimeout(() => {
      setShowPicker(true);
      startXRef.current = null; // cancel drag
    }, 450);
  };

  const handleMove = (clientX) => {
    if (!isDragging || startXRef.current === null) return;
    let diff = clientX - startXRef.current;
    if (diff < 0) diff = 0;
    if (diff > 8 && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (diff > 60) diff = 60 + (diff - 60) * 0.2;
    setDragOffset(diff);
  };

  const handleEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (dragOffset > 50 && onReply && startXRef.current !== null) {
      onReply(message);
    }
    setIsDragging(false);
    setDragOffset(0);
    startXRef.current = null;
  };

  // Touch
  const onTouchStart = (e) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e) => handleMove(e.touches[0].clientX);
  const onTouchEnd = () => handleEnd();

  // Mouse
  const onMouseDown = (e) => handleStart(e.clientX);
  const onMouseMove = (e) => { if (isDragging) handleMove(e.clientX); };
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => { if (isDragging) handleEnd(); };

  const handleReactionClick = (emoji) => {
    if (onReact && message.id) {
      onReact(message.id, emoji);
    }
    setShowPicker(false);
  };

  // Build reactions display: { emoji: [senderIds] }
  const reactions = message.reactions || {};
  const reactionEntries = Object.entries(reactions).filter(([, ids]) => ids.length > 0);

  const myReactions = new Set(
    reactionEntries
      .filter(([, ids]) => ids.includes(currentUserId))
      .map(([emoji]) => emoji)
  );

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

  const iconOpacity = Math.min(dragOffset / 50, 1);
  const iconScale = 0.5 + (Math.min(dragOffset / 50, 1) * 0.5);

  return (
    <div
      className={`${styles.message} ${isOwn ? styles.own : styles.other}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); if (isDragging) handleEnd(); }}
    >
      {/* Floating Reaction Picker */}
      {showPicker && (
        <div
          ref={pickerRef}
          className={`${styles.reactionPicker} ${isOwn ? styles.reactionPickerOwn : styles.reactionPickerOther}`}
        >
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              className={`${styles.reactionPickerBtn} ${myReactions.has(emoji) ? styles.reactionPickerBtnActive : ''}`}
              onClick={() => handleReactionClick(emoji)}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div
        ref={wrapperRef}
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

          <div className={styles.bubbleRow}>
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

            {/* Hover react button (desktop) */}
            {isHovered && !showPicker && (
              <button
                className={`${styles.reactTrigger} ${isOwn ? styles.reactTriggerOwn : styles.reactTriggerOther}`}
                onClick={() => setShowPicker(true)}
                title="React"
              >
                😊
              </button>
            )}
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

          {/* Reaction Pill Bar */}
          {reactionEntries.length > 0 && (
            <div className={`${styles.reactionBar} ${isOwn ? styles.reactionBarOwn : ''}`}>
              {reactionEntries.map(([emoji, ids]) => (
                <button
                  key={emoji}
                  className={`${styles.reactionPill} ${myReactions.has(emoji) ? styles.reactionPillOwn : ''}`}
                  onClick={() => handleReactionClick(emoji)}
                  title={`${ids.length} reaction${ids.length > 1 ? 's' : ''}`}
                >
                  <span className={styles.reactionEmoji}>{emoji}</span>
                  {ids.length > 1 && <span className={styles.reactionCount}>{ids.length}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
