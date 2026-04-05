import React, { useState, useEffect, useRef } from 'react';
import styles from './Chat.module.css';
import Message from './Message';
import MessageInput from './MessageInput';
import VoiceCall from '../VoiceCall/VoiceCall';

const Chat = ({ 
  chat, 
  name, 
  room, 
  onlineUsers, 
  typingUser, 
  socket,
  onLeave,
  currentUserId,
  otherUser
}) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const voiceCallRef = useRef(null);

  // Check if user is at bottom
  const checkIfAtBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShowScrollButton(!atBottom);
    return atBottom;
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setShowScrollButton(false);
    }
  };

  // Handle scroll event
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShowScrollButton(!atBottom);
  };

  // Auto scroll only when new message arrives and user is at bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      const atBottom = checkIfAtBottom();
      if (atBottom) {
        scrollToBottom();
      }
    }
  }, [chat]);

  // Add scroll event listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Initial scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }, []);

  // Handle reply from message drag - ONLY ONE VERSION
  const handleReply = (message) => {
    console.log('📝 handleReply called with:', message);
    setReplyToMessage(message);
    
    // Focus on message input
    const messageInput = document.querySelector('input[type="text"]');
    if (messageInput) {
      messageInput.focus();
    }
    
    // Show a temporary notification
    const notification = document.createElement('div');
    notification.className = styles.replyNotification;
    notification.innerHTML = `
      <div class="${styles.replyNotificationContent}">
        <span>↩️ Replying to ${message.author || message.displayName}</span>
        <span style="font-size: 11px; opacity: 0.8;">"${message.message.substring(0, 40)}${message.message.length > 40 ? '...' : ''}"</span>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 2000);
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyToMessage(null);
  };

  // Listen for incoming calls
  useEffect(() => {
    const handleIncomingCall = ({ from, callerId }) => {
      console.log('📞 Incoming call from:', from, callerId);
      setIncomingCall({ from, callerId });
    };

    const handleCallAccepted = ({ calleeId }) => {
      console.log('✅ Call accepted by:', calleeId);
      setIsCallActive(true);
      setIncomingCall(null);
    };

    const handleCallRejected = () => {
      console.log('❌ Call rejected');
      setIncomingCall(null);
    };

    const handleCallEnded = () => {
      console.log('🔴 Call ended');
      setIsCallActive(false);
      setIncomingCall(null);
    };

    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);

    return () => {
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-ended', handleCallEnded);
    };
  }, [socket]);

  const handleStartCall = () => {
    console.log('📞 Starting call from:', name);
    setIsCallActive(true);
    socket.emit('call-user', { room, from: name });
  };

  const handleAcceptCall = () => {
    console.log('✅ Accepting call');
    setIsCallActive(true);
    setIncomingCall(null);
    socket.emit('accept-call', { room });
    setTimeout(() => {
      if (voiceCallRef.current && voiceCallRef.current.answerCall) {
        voiceCallRef.current.answerCall();
      }
    }, 100);
  };

  const handleRejectCall = () => {
    console.log('❌ Rejecting call');
    setIncomingCall(null);
    socket.emit('reject-call', { room });
  };

  const handleEndCall = () => {
    console.log('🔴 Ending call');
    setIsCallActive(false);
    socket.emit('end-call', { room });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room);
    alert('Room code copied!');
  };

  // Get the other user's display name
  const getOtherUserName = () => {
    if (otherUser) {
      return otherUser.displayName || otherUser.name;
    }
    return 'partner';
  };

  // Handle sending message with reply
  const handleSendMessage = (msg) => {
    const messageData = {
      room,
      author: name,
      message: msg,
      senderId: currentUserId,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      id: Date.now()
    };
    
    // Add reply data if replying to a message
    if (replyToMessage) {
      messageData.replyTo = {
        id: replyToMessage.id || Date.now(),
        author: replyToMessage.author || replyToMessage.displayName,
        message: replyToMessage.message,
        timestamp: replyToMessage.timestamp
      };
      console.log('Sending reply to:', replyToMessage.author);
      setReplyToMessage(null);
    }
    
    socket.emit('send_message', messageData);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.roomInfo}>
            <div className={styles.roomCodeLabel}>Room Code</div>
            <div className={styles.roomCodeValue}>
              {room}
              <button onClick={copyRoomCode} className={styles.copyButton}>
                Copy
              </button>
            </div>
          </div>
          <button onClick={onLeave} className={styles.leaveButton}>
            Leave Room
          </button>
        </div>
        
        <div className={styles.status}>
          <span className={onlineUsers === 2 ? styles.online : styles.waiting}></span>
          {onlineUsers === 2 ? `Connected with ${getOtherUserName()}` : 'Waiting for partner...'}
          <span className={styles.userCount}>({onlineUsers}/2 users in room)</span>
        </div>
      </div>

      {/* Reply Preview Bar - Shows when replying to a message */}
      {replyToMessage && (
        <div className={styles.replyPreviewBar}>
          <div className={styles.replyPreviewContent}>
            <span className={styles.replyPreviewText}>
              ↩️ Replying to <strong>{replyToMessage.author || replyToMessage.displayName}</strong>: 
              "{replyToMessage.message.substring(0, 50)}{replyToMessage.message.length > 50 ? '...' : ''}"
            </span>
            <button onClick={cancelReply} className={styles.cancelReplyBtn}>
              ✖️ Cancel
            </button>
          </div>
        </div>
      )}

      {incomingCall && (
        <div className={styles.incomingCall}>
          <div className={styles.incomingCallContent}>
            <span className={styles.incomingCallIcon}>📞</span>
            <span>{incomingCall.from} is calling...</span>
            <div className={styles.incomingCallActions}>
              <button onClick={handleAcceptCall} className={styles.acceptCallBtn}>Accept</button>
              <button onClick={handleRejectCall} className={styles.rejectCallBtn}>Reject</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.chatArea}>
        <div className={styles.messagesContainer} ref={messagesContainerRef}>
          {chat.length === 0 ? (
            <div className={styles.welcomeMessage}>
              <div className={styles.welcomeIcon}>🐦</div>
              <p>Connected! Start chatting with {getOtherUserName()}.</p>
              <small className={styles.dragHint}>💡 Tip: Drag any message to the right to reply!</small>
            </div>
          ) : (
            <>
              {chat.map((msg, idx) => (
                <Message 
                  key={idx} 
                  message={msg} 
                  isOwn={msg.senderId === currentUserId}
                  currentUserId={currentUserId}
                  onReply={handleReply}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {showScrollButton && chat.length > 0 && (
          <button onClick={scrollToBottom} className={styles.scrollButton}>
            ↓ New messages
          </button>
        )}

        {typingUser && (
          <div className={styles.typingIndicator}>
            <span className={styles.typingDot}></span>
            {typingUser}
          </div>
        )}

        <div className={styles.inputArea}>
          <div className={styles.inputWrapper}>
            <MessageInput 
              onSendMessage={handleSendMessage}
              onTyping={() => {
                socket.emit('typing', { room, author: name });
              }}
            />
            <button 
              onClick={isCallActive ? handleEndCall : handleStartCall}
              className={`${styles.callButton} ${isCallActive ? styles.inCall : ''}`}
              disabled={onlineUsers !== 2}
            >
              {isCallActive ? 'In Call' : 'Call'}
            </button>
          </div>
        </div>
      </div>

      {isCallActive && (
        <VoiceCall 
          ref={voiceCallRef}
          room={room} 
          socket={socket} 
          onEndCall={handleEndCall}
          myName={name}
        />
      )}
    </div>
  );
};

export default Chat;