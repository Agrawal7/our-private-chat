import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, CornerDownRight } from 'lucide-react';
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
      <AnimatePresence>
        {replyingTo && (
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
          onKeyPress={handleKeyPress}
          onKeyDown={handleKeyPress}
          placeholder={replyingTo ? `Reply to ${replyingTo.author}...` : 'Write message...'}
          className={`${styles.input} ${replyingTo ? styles.inputReplyActive : ''}`}
        />
        
        <button 
          onClick={handleSend} 
          disabled={!message.trim()}
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