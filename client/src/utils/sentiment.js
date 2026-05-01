// Simple dictionary-based sentiment analyzer
const positiveWords = new Set([
  'good', 'great', 'awesome', 'excellent', 'happy', 'love', 'amazing', 'fantastic',
  'wonderful', 'beautiful', 'yay', 'yes', 'perfect', 'cool', 'sweet', 'nice',
  'thanks', 'thank', 'haha', 'lol', 'lmao', 'glad', 'fun', 'funny', 'joy'
]);

const negativeWords = new Set([
  'bad', 'terrible', 'awful', 'hate', 'sad', 'angry', 'mad', 'upset', 'worst',
  'horrible', 'no', 'nope', 'never', 'sorry', 'cry', 'crying', 'depressed',
  'annoying', 'stupid', 'dumb', 'idiot', 'suck', 'sucks', 'fail'
]);

export const analyzeSentiment = (text) => {
  if (!text) return 0;
  
  const words = text.toLowerCase().match(/\b(\w+)\b/g);
  if (!words) return 0;
  
  let score = 0;
  
  words.forEach(word => {
    if (positiveWords.has(word)) {
      score += 1;
    } else if (negativeWords.has(word)) {
      score -= 1;
    }
  });
  
  return score;
};
