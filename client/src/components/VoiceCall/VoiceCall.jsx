import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import styles from './VoiceCall.module.css';

const VoiceCall = forwardRef(({ room, socket, onEndCall, myName }, ref) => {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const durationRef = useRef(null);
  const isCallerRef = useRef(false);

  const config = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Clean up function
  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (durationRef.current) {
      clearInterval(durationRef.current);
      durationRef.current = null;
    }
  };

  const endCall = () => {
    cleanup();
    onEndCall();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMuted(!isMuted);
      }
    }
  };

  // Start call as caller
  const startCall = async () => {
    try {
      setConnectionStatus('requesting_mic');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setConnectionStatus('microphone_ready');
      
      peerConnectionRef.current = new RTCPeerConnection(config);
      
      // Add local tracks
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });
      
      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        console.log('🎵 Got remote audio');
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          setConnectionStatus('connected');
        }
      };
      
      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { candidate: event.candidate, room });
        }
      };
      
      // Create and send offer
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      socket.emit('offer', { offer, room });
      setConnectionStatus('calling');
      
    } catch (err) {
      console.error('Start call error:', err);
      setConnectionStatus('error');
      setTimeout(endCall, 2000);
    }
  };

  // Answer call as callee
  const answerCall = async () => {
    try {
      setConnectionStatus('requesting_mic');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setConnectionStatus('microphone_ready');
      
      peerConnectionRef.current = new RTCPeerConnection(config);
      
      // Add local tracks
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });
      
      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        console.log('🎵 Got remote audio');
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          setConnectionStatus('connected');
        }
      };
      
      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { candidate: event.candidate, room });
        }
      };
      
      socket.emit('accept-call', { room });
      setConnectionStatus('answering');
      
    } catch (err) {
      console.error('Answer call error:', err);
      setConnectionStatus('error');
      setTimeout(endCall, 2000);
    }
  };

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    answerCall
  }));

  // Socket event handlers
  useEffect(() => {
    const handleOffer = async ({ offer }) => {
      console.log('📥 Received offer');
      if (peerConnectionRef.current && !isCallerRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          socket.emit('answer', { answer, room });
          setConnectionStatus('connected');
        } catch (err) {
          console.error('Offer error:', err);
        }
      }
    };
    
    const handleAnswer = async ({ answer }) => {
      console.log('📥 Received answer');
      if (peerConnectionRef.current && isCallerRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          setConnectionStatus('connected');
        } catch (err) {
          console.error('Answer error:', err);
        }
      }
    };
    
    const handleIceCandidate = async ({ candidate }) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('ICE candidate error:', err);
        }
      }
    };
    
    const handleCallAccepted = () => {
      console.log('📞 Call accepted, starting...');
      isCallerRef.current = true;
      startCall();
    };
    
    const handleCallRejected = () => {
      console.log('❌ Call rejected');
      setConnectionStatus('rejected');
      setTimeout(endCall, 2000);
    };
    
    const handleCallEnded = () => {
      console.log('🔴 Call ended by remote');
      endCall();
    };
    
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);
    
    return () => {
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-ended', handleCallEnded);
      cleanup();
    };
  }, [socket, room]);

  // Start duration timer when connected
  useEffect(() => {
    if (connectionStatus === 'connected') {
      durationRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationRef.current) {
        clearInterval(durationRef.current);
        durationRef.current = null;
      }
    }
    
    return () => {
      if (durationRef.current) {
        clearInterval(durationRef.current);
      }
    };
  }, [connectionStatus]);

  const getStatusText = () => {
    switch(connectionStatus) {
      case 'connected': return `In Call ${formatDuration(duration)}`;
      case 'calling': return 'Calling...';
      case 'answering': return 'Answering...';
      case 'requesting_mic': return 'Requesting microphone...';
      case 'microphone_ready': return 'Microphone ready...';
      case 'rejected': return 'Call rejected';
      case 'error': return 'Connection error';
      default: return 'Connecting...';
    }
  };

  const getIcon = () => {
    if (connectionStatus === 'connected') return '🎤';
    if (connectionStatus === 'calling') return '📞';
    if (connectionStatus === 'answering') return '📞';
    return '📞';
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.icon}>
          {getIcon()}
        </div>
        <div className={styles.duration}>
          {getStatusText()}
        </div>
        <div className={styles.controls}>
          <button 
            onClick={toggleMute} 
            className={styles.controlButton}
            disabled={connectionStatus !== 'connected'}
          >
            {isMuted ? '🔇' : '🎤'}
          </button>
          <button onClick={endCall} className={styles.endButton}>
            🔴
          </button>
        </div>
      </div>
      <audio ref={remoteAudioRef} autoPlay playsInline />
    </div>
  );
});

VoiceCall.displayName = 'VoiceCall';

export default VoiceCall;