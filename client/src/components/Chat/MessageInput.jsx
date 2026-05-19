import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, CornerDownRight, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import styles from './MessageInput.module.css';

const MessageInput = ({ onSendMessage, onTyping, replyingTo, onCancelReply, disabled }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const pickerRef = useRef(null);

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
      setShowEmojiPicker(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is inside the picker or the button
      const isInsidePicker = pickerRef.current && pickerRef.current.contains(event.target);
      const isPickerComponent = event.target.closest('.EmojiPickerReact');
      const isEmojiBtn = event.target.closest(`.${styles.emojiBtn}`);
      
      if (!isInsidePicker && !isPickerComponent && !isEmojiBtn) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onEmojiClick = (emojiObject) => {
    setMessage(prev => prev + emojiObject.emoji);
    if (inputRef.current) {
      inputRef.current.focus();
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
        
        <div className={styles.emojiContainer} ref={pickerRef}>
          {showEmojiPicker && (
            <div className={styles.emojiPickerWrapper}>
              <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
            </div>
          )}
          <button 
            type="button"
            className={styles.emojiBtn} 
            disabled={disabled}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowEmojiPicker(prev => !prev);
            }}
            title="Add emoji"
          >
             <Smile size={20} />
          </button>
        </div>

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