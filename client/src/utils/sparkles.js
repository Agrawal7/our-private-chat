import confetti from 'canvas-confetti';

const TRIGGERS = {
  confetti: {
    words: [
      'congrats', 'congratulations', 'party', 'celebrate', 'yay', 'win', 'winner', 
      'victory', 'happy', 'birthday', 'hbd', 'anniversary', 'cheers', 'gift', 
      'balloon', 'surprise', 'gg', 'congrats!', 'congratulations!', 'wow!'
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
      'sweet', 'darling', 'honey', 'mwah', 'lovely', 'crush', 'hug', 'hugs'
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
      'epic', 'amazing', 'insane', 'wild', 'boom'
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
      'bright', 'shine', 'shining', 'gold', 'perfect', 'super', 'hero'
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
      'cool down', 'chill'
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
      'profit', 'diamond', 'gem'
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
  }
};

export const triggerSparkles = (text) => {
  if (!text) return;
  
  const lowerText = text.toLowerCase();
  
  for (const category in TRIGGERS) {
    if (TRIGGERS[category].words.some(word => lowerText.includes(word))) {
      TRIGGERS[category].fire();
      
      // Sometimes double fire for bigger impact
      if (Math.random() > 0.7) {
        setTimeout(() => {
          TRIGGERS[category].fire({ 
            particleCount: 40, 
            angle: 60, 
            origin: { x: 0 } 
          });
          TRIGGERS[category].fire({ 
            particleCount: 40, 
            angle: 120, 
            origin: { x: 1 } 
          });
        }, 300);
      }
      
      break; // Only fire one type of sparkle per message
    }
  }
};
