import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Grid3x3, Hand, RotateCcw, Trophy, Gamepad2 } from 'lucide-react';
import styles from './MiniGame.module.css';

/* ─── Tic-Tac-Toe ─────────────────────────────────────────── */
const WINNING_COMBOS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

const checkWinner = (board) => {
  for (const [a,b,c] of WINNING_COMBOS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return board.every(Boolean) ? 'draw' : null;
};

const TicTacToe = ({ socket, room, myName, currentUserId, otherUser, isWaiting }) => {
  const [board, setBoard]       = useState(Array(9).fill(null));
  const [myMark, setMyMark]     = useState('X');   // 'X' or 'O'
  const [turn, setTurn]         = useState('X');     // whose mark's turn
  const [winner, setWinner]     = useState(null);
  const [scores, setScores]     = useState({ me: 0, them: 0, draw: 0 });
  const [winLine, setWinLine]   = useState(null);

  // Assign mark deterministically based on sorted socket IDs
  useEffect(() => {
    if (currentUserId && otherUser?.id) {
      const sorted = [currentUserId, otherUser.id].sort();
      const mark = currentUserId === sorted[0] ? 'X' : 'O';
      setMyMark(mark);
    }
  }, [currentUserId, otherUser]);

  const resolveGame = useCallback((newBoard, currentTurn) => {
    const w = checkWinner(newBoard);
    if (w) {
      setWinner(w);
      if (w !== 'draw') {
        const line = WINNING_COMBOS.find(([a,b,c]) =>
          newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]);
        setWinLine(line);
      }
      setScores(prev => ({
        ...prev,
        me:   w === myMark   ? prev.me + 1   : prev.me,
        them: w !== myMark && w !== 'draw' ? prev.them + 1 : prev.them,
        draw: w === 'draw'   ? prev.draw + 1 : prev.draw,
      }));
    }
  }, [myMark]);

  // Listen for opponent moves
  useEffect(() => {
    const handler = ({ action, data }) => {
      if (action !== 'ttt_move') return;
      setBoard(prev => {
        const next = [...prev];
        next[data.index] = data.mark;
        resolveGame(next, data.mark === 'X' ? 'O' : 'X');
        return next;
      });
      setTurn(data.mark === 'X' ? 'O' : 'X');
    };
    socket.on('game_move', handler);
    return () => socket.off('game_move', handler);
  }, [socket, resolveGame]);

  // Listen for reset
  useEffect(() => {
    const handler = ({ action }) => {
      if (action !== 'ttt_reset') return;
      setBoard(Array(9).fill(null));
      setWinner(null);
      setWinLine(null);
      setTurn('X');
    };
    socket.on('game_move', handler);
    return () => socket.off('game_move', handler);
  }, [socket]);

  const handleClick = (i) => {
    if (isWaiting || board[i] || winner || turn !== myMark) return;
    const next = [...board];
    next[i] = myMark;
    setBoard(next);
    setTurn(myMark === 'X' ? 'O' : 'X');
    resolveGame(next, myMark);
    socket.emit('game_move', { room, gameType: 'ttt', action: 'ttt_move', data: { index: i, mark: myMark } });
  };

  const handleReset = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setWinLine(null);
    setTurn('X');
    socket.emit('game_move', { room, gameType: 'ttt', action: 'ttt_reset', data: {} });
  };

  const isMyTurn = turn === myMark;
  const statusText = winner
    ? winner === 'draw' ? "It's a Draw! 🤝" : winner === myMark ? 'You Win! 🎉' : 'They Win!'
    : isWaiting ? 'Waiting for partner...'
    : isMyTurn ? 'Your turn' : "Partner's turn";

  return (
    <div className={styles.tttWrapper}>
      <div className={styles.scoreRow}>
        <div className={styles.scoreBox}>
          <span className={styles.scoreName}>You ({myMark})</span>
          <span className={styles.scoreNum}>{scores.me}</span>
        </div>
        <div className={styles.scoreBoxMid}>
          <span className={styles.scoreName}>Draw</span>
          <span className={styles.scoreNum}>{scores.draw}</span>
        </div>
        <div className={styles.scoreBox}>
          <span className={styles.scoreName}>Them</span>
          <span className={styles.scoreNum}>{scores.them}</span>
        </div>
      </div>

      <p className={`${styles.statusText} ${isMyTurn && !winner ? styles.myTurnText : ''}`}>
        {statusText}
      </p>

      <div className={styles.tttGrid}>
        {board.map((cell, i) => {
          const isWinCell = winLine && winLine.includes(i);
          return (
            <motion.button
              key={i}
              className={`${styles.tttCell} ${isWinCell ? styles.tttWinCell : ''}`}
              onClick={() => handleClick(i)}
              whileHover={!cell && !winner ? { scale: 1.05 } : {}}
              whileTap={!cell && !winner ? { scale: 0.95 } : {}}
              disabled={!!cell || !!winner || !isMyTurn || isWaiting}
            >
              <AnimatePresence>
                {cell && (
                  <motion.span
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className={cell === 'X' ? styles.markX : styles.markO}
                  >
                    {cell}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <button className={styles.resetBtn} onClick={handleReset}>
        <RotateCcw size={14} /> New Game
      </button>
    </div>
  );
};

/* ─── Rock Paper Scissors ─────────────────────────────────── */
const RPS_CHOICES = [
  { id: 'rock',     emoji: '✊', label: 'Rock' },
  { id: 'paper',    emoji: '✋', label: 'Paper' },
  { id: 'scissors', emoji: '✌️',  label: 'Scissors' },
];

const getRPSResult = (me, them) => {
  if (me === them) return 'draw';
  if ((me === 'rock' && them === 'scissors') ||
      (me === 'scissors' && them === 'paper') ||
      (me === 'paper' && them === 'rock')) return 'win';
  return 'lose';
};

const RPS = ({ socket, room, isWaiting }) => {
  const [myChoice, setMyChoice]     = useState(null);
  const [theirChoice, setTheirChoice] = useState(null);
  const [result, setResult]         = useState(null);
  const [scores, setScores]         = useState({ win: 0, lose: 0, draw: 0 });
  const [countdown, setCountdown]   = useState(null);

  // Listen for opponent choice reveal
  useEffect(() => {
    const handler = ({ action, data }) => {
      if (action !== 'rps_choice') return;
      setTheirChoice(data.choice);
    };
    socket.on('game_move', handler);
    return () => socket.off('game_move', handler);
  }, [socket]);

  // Resolve once both choices are in
  useEffect(() => {
    if (myChoice && theirChoice) {
      const r = getRPSResult(myChoice, theirChoice);
      setResult(r);
      setScores(prev => ({ ...prev, [r]: prev[r] + 1 }));
    }
  }, [myChoice, theirChoice]);

  const handlePick = (choice) => {
    if (myChoice || isWaiting) return;
    setMyChoice(choice);
    socket.emit('game_move', { room, gameType: 'rps', action: 'rps_choice', data: { choice } });
    // start countdown for result reveal simulation
    let c = 3;
    setCountdown(c);
    const t = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) clearInterval(t);
    }, 1000);
  };

  const handleReset = () => {
    setMyChoice(null);
    setTheirChoice(null);
    setResult(null);
    setCountdown(null);
    socket.emit('game_move', { room, gameType: 'rps', action: 'rps_reset', data: {} });
  };

  useEffect(() => {
    const handler = ({ action }) => {
      if (action !== 'rps_reset') return;
      setMyChoice(null);
      setTheirChoice(null);
      setResult(null);
      setCountdown(null);
    };
    socket.on('game_move', handler);
    return () => socket.off('game_move', handler);
  }, [socket]);

  const resultLabel = result === 'win' ? '🎉 You Win!' : result === 'lose' ? '😬 They Win!' : result === 'draw' ? '🤝 Draw!' : null;
  const resultClass = result === 'win' ? styles.rpsWin : result === 'lose' ? styles.rpsLose : result === 'draw' ? styles.rpsDraw : '';

  return (
    <div className={styles.rpsWrapper}>
      <div className={styles.scoreRow}>
        <div className={styles.scoreBox}><span className={styles.scoreName}>Wins</span><span className={styles.scoreNum}>{scores.win}</span></div>
        <div className={styles.scoreBoxMid}><span className={styles.scoreName}>Draws</span><span className={styles.scoreNum}>{scores.draw}</span></div>
        <div className={styles.scoreBox}><span className={styles.scoreName}>Losses</span><span className={styles.scoreNum}>{scores.lose}</span></div>
      </div>

      {result ? (
        <motion.div className={`${styles.rpsReveal} ${resultClass}`} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className={styles.rpsRevealRow}>
            <div className={styles.rpsRevealItem}>
              <span className={styles.rpsEmojiBig}>{RPS_CHOICES.find(c=>c.id===myChoice)?.emoji}</span>
              <span>You</span>
            </div>
            <span className={styles.rpsVs}>vs</span>
            <div className={styles.rpsRevealItem}>
              <span className={styles.rpsEmojiBig}>{theirChoice ? RPS_CHOICES.find(c=>c.id===theirChoice)?.emoji : '❓'}</span>
              <span>Them</span>
            </div>
          </div>
          <p className={styles.rpsResultText}>{resultLabel}</p>
          <button className={styles.resetBtn} onClick={handleReset}><RotateCcw size={14} /> Play Again</button>
        </motion.div>
      ) : myChoice ? (
        <motion.div className={styles.rpsWaiting} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className={styles.rpsChosen}>{RPS_CHOICES.find(c=>c.id===myChoice)?.emoji}</span>
          <p>Waiting for partner{countdown > 0 ? `… (${countdown})` : '…'}</p>
        </motion.div>
      ) : (
        <div className={styles.rpsChoices}>
          <p className={styles.statusText}>
            {isWaiting ? 'Waiting for partner...' : theirChoice ? 'Partner is ready! Pick your move!' : 'Pick your move!'}
          </p>
          <div className={styles.rpsOptions}>
            {RPS_CHOICES.map(c => (
              <motion.button
                key={c.id}
                className={styles.rpsOption}
                onClick={() => handlePick(c.id)}
                whileHover={{ scale: 1.1, y: -4 }}
                whileTap={{ scale: 0.9 }}
                disabled={isWaiting}
              >
                <span className={styles.rpsEmoji}>{c.emoji}</span>
                <span className={styles.rpsLabel}>{c.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Main MiniGame Panel ─────────────────────────────────── */
const MiniGame = ({ socket, room, myName, currentUserId, otherUser, isWaiting, isOpen, onClose, onOpen }) => {
  const [activeGame, setActiveGame] = useState('ttt');
  const [partnerStatusMsg, setPartnerStatusMsg] = useState('');

  // Auto-open and auto-switch game tab when receiving opponent moves/actions
  useEffect(() => {
    const handleRemoteActivity = (payload) => {
      if (payload.action === 'open_panel') {
        if (onOpen && !isOpen) onOpen();
        setPartnerStatusMsg('Partner opened Mini Games! Choose a game to play.');
        setTimeout(() => setPartnerStatusMsg(''), 4000);
      } else if (payload.action === 'sync_tab') {
        if (payload.gameType && payload.gameType !== activeGame) {
          setActiveGame(payload.gameType);
        }
        if (onOpen && !isOpen) onOpen();
        const gameName = payload.gameType === 'ttt' ? 'Tic-Tac-Toe' : 'Rock Paper Scissors';
        setPartnerStatusMsg(`Partner selected ${gameName}! Let's play.`);
        setTimeout(() => setPartnerStatusMsg(''), 4000);
      } else if (payload.gameType) {
        if (payload.gameType !== activeGame) {
          setActiveGame(payload.gameType);
        }
        if (onOpen && !isOpen) onOpen();
      }
    };
    socket.on('game_move', handleRemoteActivity);
    return () => socket.off('game_move', handleRemoteActivity);
  }, [socket, activeGame, onOpen, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
          <div className={styles.panel}>
            {/* Header */}
            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>
                <Trophy size={16} className={styles.panelTitleIcon} />
                <span>Mini Games</span>
              </div>
              <div className={styles.tabRow}>
                <button 
                  className={`${styles.tab} ${activeGame === 'ttt' ? styles.tabActive : ''}`} 
                  onClick={() => { setActiveGame('ttt'); socket.emit('game_move', { room, action: 'sync_tab', gameType: 'ttt' }); }}
                >
                  <Grid3x3 size={14} /> Tic-Tac-Toe
                </button>
                <button 
                  className={`${styles.tab} ${activeGame === 'rps' ? styles.tabActive : ''}`} 
                  onClick={() => { setActiveGame('rps'); socket.emit('game_move', { room, action: 'sync_tab', gameType: 'rps' }); }}
                >
                  <Hand size={14} /> Rock Paper Scissors
                </button>
              </div>
              <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
            </div>

            {/* Partner Status Message Toast */}
            <AnimatePresence>
              {partnerStatusMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className={styles.partnerToastWrap}
                >
                  <div className={styles.partnerToast}>
                    <Gamepad2 size={14} /> <span>{partnerStatusMsg}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Game Body */}
            <div className={styles.panelBody}>
              <div style={{ display: activeGame === 'ttt' ? 'block' : 'none' }}>
                <TicTacToe socket={socket} room={room} myName={myName} currentUserId={currentUserId} otherUser={otherUser} isWaiting={isWaiting} />
              </div>
              <div style={{ display: activeGame === 'rps' ? 'block' : 'none' }}>
                <RPS socket={socket} room={room} isWaiting={isWaiting} />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MiniGame;

