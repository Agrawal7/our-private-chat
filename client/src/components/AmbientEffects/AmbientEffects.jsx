import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './AmbientEffects.module.css';

/* ─── Effect Renderers ───────────────────────────────────── */

const VirtualHug = ({ onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={styles.effectOverlay}>
      <div className={styles.hugCenter}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={styles.hugRing} style={{ '--i': i }} />
        ))}
        <div className={styles.hugEmoji}>🤗</div>
      </div>
      <p className={styles.effectLabel}>Virtual Hug! 🤗</p>
    </div>
  );
};

const StarShower = ({ onDone }) => {
  const stars = Array.from({ length: 24 }, (_, i) => i);
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={styles.effectOverlay}>
      {stars.map(i => (
        <div
          key={i}
          className={styles.star}
          style={{
            '--left': `${Math.random() * 100}%`,
            '--delay': `${Math.random() * 1.5}s`,
            '--dur': `${1.2 + Math.random() * 1}s`,
            '--size': `${14 + Math.random() * 18}px`,
          }}
        >
          {['✨', '⭐', '🌟'][i % 3]}
        </div>
      ))}
      <p className={styles.effectLabel}>Star Shower! ✨</p>
    </div>
  );
};

const HeartBurst = ({ onDone }) => {
  const hearts = Array.from({ length: 20 }, (_, i) => i);
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={styles.effectOverlay}>
      {hearts.map(i => (
        <div
          key={i}
          className={styles.heart}
          style={{
            '--left': `${5 + Math.random() * 90}%`,
            '--delay': `${Math.random() * 1.2}s`,
            '--dur': `${1.5 + Math.random() * 1.2}s`,
            '--size': `${18 + Math.random() * 22}px`,
          }}
        >
          {['❤️', '💕', '💖', '💗'][i % 4]}
        </div>
      ))}
      <p className={styles.effectLabel}>My Love! 💖</p>
    </div>
  );
};

const EFFECTS_MAP = {
  hug:   VirtualHug,
  stars: StarShower,
  hearts: HeartBurst,
};

/* ─── Main Component ─────────────────────────────────────── */
const AmbientEffects = ({ activeEffect, onEffectDone }) => {
  const EffectComponent = activeEffect ? EFFECTS_MAP[activeEffect] : null;

  return (
    <AnimatePresence>
      {EffectComponent && (
        <motion.div
          key={activeEffect}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={styles.wrapper}
        >
          <EffectComponent onDone={onEffectDone} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AmbientEffects;
