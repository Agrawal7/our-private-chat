// Enhanced dictionary-based sentiment analyzer
const positiveWords = new Set([
  'good', 'great', 'awesome', 'excellent', 'happy', 'love', 'amazing', 'fantastic',
  'wonderful', 'beautiful', 'yay', 'yes', 'perfect', 'cool', 'sweet', 'nice',
  'thanks', 'thank', 'haha', 'lol', 'lmao', 'glad', 'fun', 'funny', 'joy',
  'brilliant', 'super', 'stellar', 'epic', 'blessed', 'proud', 'excited',
  '❤️', '😊', '😂', '🥰', '😍', '🔥', '✨', '👍', '🙌', '🎉', '🌟', '💯', 'grin', 'smile',
  'win', 'winner', 'victory', 'magic', 'gorgeous', 'stunning', 'fabulous', 'genius',
  'hooray', 'cheers', 'woo', 'woohoo', 'wahoo', 'rofl', 'lmfao', 'hehe', 'hihi'
]);

const negativeWords = new Set([
  'bad', 'terrible', 'awful', 'hate', 'sad', 'angry', 'mad', 'upset', 'worst',
  'horrible', 'no', 'nope', 'never', 'sorry', 'cry', 'crying', 'depressed',
  'annoying', 'stupid', 'dumb', 'idiot', 'suck', 'sucks', 'fail',
  'terrible', 'miserable', 'pain', 'tired', 'exhausted', 'sick', 'gross',
  '💔', '😢', '😭', '😡', '🤬', '👎', '😒', '😞', '😩', '😤', 'trash',
  'angry', 'furious', 'rage', 'annoyed', 'pissed', 'heartbreak', 'broken', 'hurt',
  'stress', 'stressed', 'anxious', 'scared', 'fear', 'creepy', 'weird', 'yuck'
]);

export const analyzeSentiment = (text) => {
  if (!text) return 0;
  
  // Convert to lowercase and split by word boundaries, but preserve emojis
  const tokens = Array.from(new Intl.Segmenter('en', { granularity: 'word' }).segment(text))
    .map(seg => seg.segment.toLowerCase().trim())
    .filter(seg => seg.length > 0);
  
  if (!tokens || tokens.length === 0) return 0;
  
  let score = 0;
  
  tokens.forEach(token => {
    if (positiveWords.has(token)) {
      score += 1;
    } else if (negativeWords.has(token)) {
      score -= 1;
    }
  });
  
  return score;
};
