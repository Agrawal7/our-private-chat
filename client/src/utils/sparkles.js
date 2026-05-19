import confetti from 'canvas-confetti';

const TRIGGERS = {
  confetti: {
    words: [
      'congrats', 'congratulations', 'party', 'celebrate', 'yay', 'win', 'winner', 
      'victory', 'happy', 'birthday', 'hbd', 'anniversary', 'cheers', 'gift', 
      'balloon', 'surprise', 'gg', 'congrats!', 'congratulations!', 'wow!', '🎉', '🎊', '🥳'
    ],
    fire: (opts = {}) => {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff0000', '#ffa500', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#ee82ee'],
        ...opts
      });
    }
  },
  hearts: {
    words: [
      'love', 'heart', 'miss you', 'xoxo', 'kiss', 'romantic', 'valentine', 
      'sweet', 'darling', 'honey', 'mwah', 'lovely', 'crush', 'hug', 'hugs', '❤️', '💕', '😍', '🥰', '😘'
    ],
    fire: (opts = {}) => {
      const heart = confetti.shapeFromText({ text: '❤️' });
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        shapes: [heart],
        scalar: 2,
        ...opts
      });
    }
  },
  fire: {
    words: [
      'fire', 'lit', 'hot', 'burn', 'burning', 'spicy', 'flame', 'danger', 
      'epic', 'amazing', 'insane', 'wild', 'boom', '🔥', '🧨', '💥'
    ],
    fire: (opts = {}) => {
      confetti({
        particleCount: 100,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#ff4500', '#ff8c00', '#ff0000'],
        gravity: 0.8,
        drift: 0,
        ...opts
      });
    }
  },
  stars: {
    words: [
      'wow', 'magic', 'sparkle', 'star', 'stars', 'cool', 'awesome', 'brilliant', 
      'bright', 'shine', 'shining', 'gold', 'perfect', 'super', 'hero', '✨', '🌟', '⭐', '🤩'
    ],
    fire: (opts = {}) => {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FFE700', '#FFFFFF', '#FFD700'],
        shapes: ['star'],
        ...opts
      });
    }
  },
  snow: {
    words: [
      'cold', 'winter', 'ice', 'snow', 'freeze', 'freezing', 'chilly', 'frost', 
      'cool down', 'chill', '❄️', '⛄', '🥶'
    ],
    fire: (opts = {}) => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0 },
        colors: ['#FFFFFF', '#E0FFFF', '#B0E0E6'],
        gravity: 0.5,
        drift: 1,
        ticks: 200,
        ...opts
      });
    }
  },
  money: {
    words: [
      'money', 'cash', 'rich', 'dollar', 'dollars', 'paid', 'luxury', 'expensive', 
      'profit', 'diamond', 'gem', '💰', '💸', '🤑', '💎'
    ],
    fire: (opts = {}) => {
      const bill = confetti.shapeFromText({ text: '💵' });
      const coin = confetti.shapeFromText({ text: '💰' });
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
        shapes: [bill, coin],
        scalar: 2,
        ...opts
      });
    }
  },
  sad: {
    words: [
      'sad', 'cry', 'crying', 'tears', 'depressed', 'upset', 'broken', 'heartbreak',
      'hurt', 'pain', 'sorry', '😢', '😭', '💔', '😞', '😥'
    ],
    fire: (opts = {}) => {
      const tear = confetti.shapeFromText({ text: '😭' });
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.2 },
        shapes: [tear],
        scalar: 2,
        gravity: 1.2,
        ticks: 300,
        ...opts
      });
    }
  },
  angry: {
    words: [
      'angry', 'mad', 'furious', 'rage', 'hate', 'annoyed', 'pissed', 'stupid',
      '😡', '🤬', '😤', '💢'
    ],
    fire: (opts = {}) => {
      const anger = confetti.shapeFromText({ text: '😤' });
      const curse = confetti.shapeFromText({ text: '😡' });
      confetti({
        particleCount: 50,
        spread: 100,
        origin: { y: 0.5 },
        shapes: [anger, curse],
        colors: ['#FF0000', '#8B0000'],
        scalar: 3,
        gravity: 0.2,
        ticks: 100,
        ...opts
      });
    }
  },
  laugh: {
    words: [
      'haha', 'lol', 'lmao', 'rofl', 'lmfao', 'funny', 'hilarious', 'joke', 'hehe',
      '😂', '🤣', '😆', '😹'
    ],
    fire: (opts = {}) => {
      const laugh1 = confetti.shapeFromText({ text: '😂' });
      const laugh2 = confetti.shapeFromText({ text: '🤣' });
      confetti({
        particleCount: 60,
        spread: 120,
        origin: { y: 0.6 },
        shapes: [laugh1, laugh2],
        scalar: 2.5,
        gravity: 0.6,
        drift: 0.5,
        ticks: 250,
        ...opts
      });
    }
  },
  shock: {
    words: [
      'wow', 'omg', 'wtf', 'shocked', 'crazy', 'insane', 'no way', 'unbelievable',
      'gasps', '😱', '😲', '🤯', '😳'
    ],
    fire: (opts = {}) => {
      const mindBlown = confetti.shapeFromText({ text: '🤯' });
      const scream = confetti.shapeFromText({ text: '😱' });
      confetti({
        particleCount: 80,
        spread: 180,
        origin: { y: 0.5 },
        shapes: [mindBlown, scream, 'circle', 'square'],
        colors: ['#ff00ff', '#00ffff', '#ffff00'],
        scalar: 2,
        gravity: 1.5,
        startVelocity: 60,
        ...opts
      });
    }
  },
  sleep: {
    words: [
      'sleep', 'tired', 'exhausted', 'bed', 'night', 'goodnight', 'zzz', 'sleepy',
      'yawn', '😴', '😪', '🛌', '🌙'
    ],
    fire: (opts = {}) => {
      const zzz = confetti.shapeFromText({ text: '💤' });
      const moon = confetti.shapeFromText({ text: '🌙' });
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.7 },
        shapes: [zzz, moon],
        scalar: 2,
        gravity: -0.2, // Float upwards
        ticks: 300,
        ...opts
      });
    }
  },
  sick: {
    words: [
      'sick', 'ill', 'fever', 'flu', 'cough', 'cold', 'nauseous', 'vomit', 'gross',
      '🤮', '🤢', '🤧', '🤒'
    ],
    fire: (opts = {}) => {
      const sickFace = confetti.shapeFromText({ text: '🤢' });
      const vomitFace = confetti.shapeFromText({ text: '🤧' });
      confetti({
        particleCount: 40,
        spread: 80,
        origin: { y: 0.6 },
        shapes: [sickFace, vomitFace, 'circle'],
        colors: ['#32CD32', '#008000', '#ADFF2F'],
        scalar: 2,
        gravity: 1.0,
        ticks: 200,
        ...opts
      });
    }
  }
};

export const triggerSparkles = (text) => {
  if (!text) return;
  
  const lowerText = text.toLowerCase();
  
  for (const category in TRIGGERS) {
    if (TRIGGERS[category].words.some(word => lowerText.includes(word))) {
      TRIGGERS[category].fire();
      
      // Sometimes double fire for bigger impact or random bursts for more awesome feeling
      const randomImpact = Math.random();
      if (randomImpact > 0.7) {
        setTimeout(() => {
          TRIGGERS[category].fire({ 
            particleCount: 50, 
            angle: 60, 
            spread: 50,
            origin: { x: 0, y: 0.8 } 
          });
          TRIGGERS[category].fire({ 
            particleCount: 50, 
            angle: 120, 
            spread: 50,
            origin: { x: 1, y: 0.8 } 
          });
        }, 300);
      } else if (randomImpact > 0.4) {
        setTimeout(() => {
           TRIGGERS[category].fire({
             particleCount: 80,
             spread: 100,
             origin: { y: 0.3 }
           });
        }, 150);
      }
      
      break; // Only fire one type of sparkle per message
    }
  }
};
