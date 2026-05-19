import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import styles from './ThemeSelector.module.css';

export const THEMES = [
  {
    id: 'default',
    name: 'Midnight Deep',
    emoji: '🌌',
    colors: ['#a855f7', '#f97316'],
    desc: 'Dark purple & orange',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    emoji: '⚡',
    colors: ['#ff00c8', '#00ffff'],
    desc: 'Hot pink & neon cyan',
  },
  {
    id: 'emerald',
    name: 'Emerald Zen',
    emoji: '🌿',
    colors: ['#10b981', '#34d399'],
    desc: 'Forest green & sage',
  },
  {
    id: 'sunset',
    name: 'Sunset Gold',
    emoji: '🌅',
    colors: ['#f59e0b', '#ef4444'],
    desc: 'Amber & warm red',
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    emoji: '🌊',
    colors: ['#06b6d4', '#6366f1'],
    desc: 'Teal & indigo',
  },
];

const ThemeSelector = ({ currentTheme, onChangeTheme }) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.themeGrid}>
        {THEMES.map((theme) => {
          const isActive = currentTheme === theme.id;
          return (
            <motion.button
              key={theme.id}
              className={`${styles.themeCard} ${isActive ? styles.themeCardActive : ''}`}
              onClick={() => onChangeTheme(theme.id)}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              title={theme.name}
            >
              {/* Swatch strip */}
              <div className={styles.swatch}>
                <div className={styles.swatchHalf} style={{ background: theme.colors[0] }} />
                <div className={styles.swatchHalf} style={{ background: theme.colors[1] }} />
              </div>

              <div className={styles.themeInfo}>
                <span className={styles.themeEmoji}>{theme.emoji}</span>
                <div className={styles.themeTexts}>
                  <span className={styles.themeName}>{theme.name}</span>
                  <span className={styles.themeDesc}>{theme.desc}</span>
                </div>
              </div>

              {isActive && (
                <div className={styles.activeCheck}>
                  <Check size={10} color="white" strokeWidth={3} />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeSelector;
