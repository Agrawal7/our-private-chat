import React, { useState, useRef } from 'react';
import styles from './MessageInput.module.css';

const MessageInput = ({ onSendMessage, onTyping }) => {
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef(null);

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
  };

  const handleTyping = () => {
    onTyping();
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      // Stop typing indicator
    }, 2000);
  };

  return (
    <div className={styles.inputWrapper}>
      <input
        type="text"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          handleTyping();
        }}
        onKeyPress={handleKeyPress}
        placeholder="Write message..."
        className={styles.input}
      />
      <button 
        onClick={handleSend} 
        disabled={!message.trim()}
        className={styles.sendButton}
      >
        Send →
      </button>
    </div>
  );
};

export default MessageInput;