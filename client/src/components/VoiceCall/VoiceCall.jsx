import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import styles from './VoiceCall.module.css';

const VoiceCall = forwardRef(({ room, socket, onEndCall, myName }, ref) => {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [audioLevel, setAudioLevel] = useState(0);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const durationRef = useRef(null);
  const isCallerRef = useRef(false);
  const pendingCandidatesRef = useRef([]); // Queue ICE candidates until remote desc is set
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // ✅ High-quality audio constraints — this is the main fix for creepy audio
  const audioConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
      channelCount: 1,
      latency: 0,
    }
  };

  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
    sdpSemantics: 'unified-plan',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
  };

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  };

  // ✅ SDP tweak: enable in-band FEC, set min packet time for Opus
  const improveSDP = (sdp) =>
    sdp.replace(
      /a=fmtp:111 /g,
      'a=fmtp:111 maxplaybackrate=48000;stereo=0;sprop-stereo=0;useinbandfec=1;minptime=10;maxptime=60;'
    );

  // Audio level visualizer (shows speaking ring)
  const startAudioMonitoring = (stream) => {
    try {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      const src = audioContextRef.current.createMediaStreamSource(stream);
      src.connect(analyserRef.current);
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioLevel(Math.min(100, avg * 2.5));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) { console.warn('Audio monitor unavailable', e); }
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (durationRef.current) { clearInterval(durationRef.current); durationRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); }
    pendingCandidatesRef.current = [];
  };

  const endCall = () => { cleanup(); onEndCall(); };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) { track.enabled = !track.enabled; setIsMuted(p => !p); }
    }
  };

  // ✅ Shared peer connection factory
  const createPC = (stream) => {
    const pc = new RTCPeerConnection(rtcConfig);
    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    pc.ontrack = (e) => {
      console.log('🎵 Remote audio received');
      if (remoteAudioRef.current && e.streams[0]) {
        remoteAudioRef.current.srcObject = e.streams[0];
        remoteAudioRef.current.volume = 1.0;
        remoteAudioRef.current.play().catch(() => {});
        setConnectionStatus('connected');
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit('ice-candidate', { candidate: e.candidate, room });
    };

    pc.onconnectionstatechange = () => {
      console.log('🔗', pc.connectionState);
      if (pc.connectionState === 'connected') setConnectionStatus('connected');
      if (pc.connectionState === 'failed') { setConnectionStatus('error'); setTimeout(endCall, 2000); }
      if (pc.connectionState === 'disconnected') setConnectionStatus('reconnecting...');
    };

    return pc;
  };

  // ✅ Drain queued ICE candidates after remote description is applied
  const drainCandidates = async (pc) => {
    for (const c of pendingCandidatesRef.current) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) { /* ignore */ }
    }
    pendingCandidatesRef.current = [];
  };

  // Caller side
  const startCall = async () => {
    try {
      setConnectionStatus('requesting_mic');
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
      localStreamRef.current = stream;
      startAudioMonitoring(stream);
      setConnectionStatus('calling');

      const pc = createPC(stream);
      peerConnectionRef.current = pc;

      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false, voiceActivityDetection: true });
      offer.sdp = improveSDP(offer.sdp);
      await pc.setLocalDescription(offer);
      socket.emit('offer', { offer, room });
    } catch (err) {
      console.error('startCall error:', err);
      setConnectionStatus('error');
      setTimeout(endCall, 2000);
    }
  };

  // Callee side
  const answerCall = async () => {
    try {
      setConnectionStatus('requesting_mic');
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
      localStreamRef.current = stream;
      startAudioMonitoring(stream);
      setConnectionStatus('answering');

      const pc = createPC(stream);
      peerConnectionRef.current = pc;
      socket.emit('accept-call', { room });
    } catch (err) {
      console.error('answerCall error:', err);
      setConnectionStatus('error');
      setTimeout(endCall, 2000);
    }
  };

  useImperativeHandle(ref, () => ({ answerCall }));

  useEffect(() => {
    const handleOffer = async ({ offer }) => {
      if (!peerConnectionRef.current || isCallerRef.current) return;
      try {
        offer.sdp = improveSDP(offer.sdp);
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        await drainCandidates(peerConnectionRef.current);
        const answer = await peerConnectionRef.current.createAnswer();
        answer.sdp = improveSDP(answer.sdp);
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit('answer', { answer, room });
        setConnectionStatus('connected');
      } catch (err) { console.error('offer handling error:', err); }
    };

    const handleAnswer = async ({ answer }) => {
      if (!peerConnectionRef.current || !isCallerRef.current) return;
      try {
        answer.sdp = improveSDP(answer.sdp);
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        await drainCandidates(peerConnectionRef.current);
      } catch (err) { console.error('answer handling error:', err); }
    };

    // ✅ Queue candidates if remote description not yet set
    const handleIceCandidate = async ({ candidate }) => {
      if (!candidate) return;
      if (peerConnectionRef.current?.remoteDescription) {
        try { await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate)); }
        catch (e) { /* ignore stale candidates */ }
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    };

    const handleCallAccepted = () => {
      isCallerRef.current = true;
      startCall();
    };

    const handleCallRejected = () => { setConnectionStatus('rejected'); setTimeout(endCall, 2000); };
    const handleCallEnded = () => endCall();

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

  useEffect(() => {
    if (connectionStatus === 'connected') {
      durationRef.current = setInterval(() => setDuration(p => p + 1), 1000);
    } else {
      if (durationRef.current) { clearInterval(durationRef.current); durationRef.current = null; }
    }
    return () => { if (durationRef.current) clearInterval(durationRef.current); };
  }, [connectionStatus]);

  const statusText = () => {
    switch(connectionStatus) {
      case 'connected': return formatDuration(duration);
      case 'calling': return 'Calling...';
      case 'answering': return 'Connecting...';
      case 'requesting_mic': return 'Requesting microphone...';
      case 'rejected': return 'Call rejected';
      case 'error': return 'Connection failed';
      default: return connectionStatus;
    }
  };

  const isSpeaking = connectionStatus === 'connected' && audioLevel > 8;

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={`${styles.avatarRing} ${isSpeaking ? styles.speaking : ''}`}>
          <div className={styles.avatar}>🎤</div>
        </div>

        <div className={styles.name}>{myName}</div>

        <div className={styles.statusRow}>
          <span className={`${styles.dot} ${connectionStatus === 'connected' ? styles.dotGreen : styles.dotYellow}`} />
          <span className={styles.statusText}>{statusText()}</span>
        </div>

        {connectionStatus === 'connected' && (
          <div className={styles.levelBar}>
            <div className={styles.levelFill} style={{ width: `${audioLevel}%` }} />
          </div>
        )}

        <div className={styles.controls}>
          <button
            onClick={toggleMute}
            className={`${styles.controlButton} ${isMuted ? styles.mutedButton : ''}`}
            disabled={connectionStatus !== 'connected'}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🎤'}
          </button>
          <button onClick={endCall} className={styles.endButton} title="End call">
            📵
          </button>
        </div>
      </div>
      <audio ref={remoteAudioRef} autoPlay playsInline />
    </div>
  );
});

VoiceCall.displayName = 'VoiceCall';
export default VoiceCall;