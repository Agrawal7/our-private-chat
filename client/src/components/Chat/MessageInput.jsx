import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, CornerDownRight } from 'lucide-react';
import styles from './MessageInput.module.css';

const MessageInput = ({ onSendMessage, onTyping, replyingTo, onCancelReply, disabled }) => {
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Focus input when a reply is set
  useEffect(() => {
    if (replyingTo && inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [replyingTo, disabled]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (disabled) return;
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
    if (disabled) return;
    onTyping();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {}, 2000);
  };

  return (
    <div className={styles.outerWrapper}>
      <AnimatePresence>
        {replyingTo && !disabled && (
          <motion.div 
            className={styles.replyBanner}
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.replyBannerBar} />
            <div className={styles.replyBannerContent}>
              <span className={styles.replyBannerLabel}>
                <CornerDownRight size={10} style={{ display: 'inline', marginRight: 4 }} />
                Replying to
              </span>
              <span className={styles.replyBannerAuthor}>{replyingTo.author}</span>
              <span className={styles.replyBannerText}>{replyingTo.message}</span>
            </div>
            <button className={styles.replyBannerClose} onClick={onCancelReply} title="Cancel reply">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyPress}
          placeholder={disabled ? "Waiting for partner..." : (replyingTo ? `Reply to ${replyingTo.author}...` : 'Write a message...')}
          className={`${styles.input} ${replyingTo ? styles.inputReplyActive : ''}`}
          disabled={disabled}
        />
        
        {/* Placeholder for smile icon from the image */}
        <button className={styles.emojiBtn} disabled={disabled}>
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
        </button>

        <button 
          onClick={handleSend} 
          disabled={!message.trim() || disabled}
          className={styles.sendButton}
          title="Send message"
        >
          <Send size={18} style={{ marginLeft: 2 }} />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;