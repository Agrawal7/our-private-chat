import React, { useState, useRef, useEffect } from 'react';
import styles from './MessageInput.module.css';

const MessageInput = ({ onSendMessage, onTyping, replyingTo, onCancelReply }) => {
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Focus input when a reply is set
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Escape cancels the reply
    if (e.key === 'Escape' && replyingTo) {
      onCancelReply();
    }
  };

  const handleTyping = () => {
    onTyping();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {}, 2000);
  };

  return (
    <div className={styles.outerWrapper}>
      {replyingTo && (
        <div className={styles.replyBanner}>
          <div className={styles.replyBannerBar} />
          <div className={styles.replyBannerContent}>
            <span className={styles.replyBannerLabel}>↩ Replying to</span>
            <span className={styles.replyBannerAuthor}>{replyingTo.author}</span>
            <span className={styles.replyBannerText}>{replyingTo.message}</span>
          </div>
          <button className={styles.replyBannerClose} onClick={onCancelReply} title="Cancel reply">✕</button>
        </div>
      )}
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onKeyPress={handleKeyPress}
          onKeyDown={handleKeyPress}
          placeholder={replyingTo ? `Reply to ${replyingTo.author}...` : 'Write message...'}
          className={`${styles.input} ${replyingTo ? styles.inputReplyActive : ''}`}
        />
        <button 
          onClick={handleSend} 
          disabled={!message.trim()}
          className={styles.sendButton}
        >
          Send →
        </button>
      </div>
    </div>
  );
};

export default MessageInput;