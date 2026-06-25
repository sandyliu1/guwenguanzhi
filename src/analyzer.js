// Split text into sentences on classical Chinese punctuation
function splitSentences(text) {
  const parts = [];
  let current = '';
  for (const ch of text) {
    current += ch;
    if ('。？！；：'.includes(ch)) {
      if (current.trim()) parts.push(current.trim());
      current = '';
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

// Find all matches for a given word list in the article text
// Returns { word: { occurrences: [sentence, ...] } }
export function analyze(text, wordMap) {
  const sentences = splitSentences(text);
  const results = {};

  for (const word of Object.keys(wordMap)) {
    const occurrences = sentences.filter(s => s.includes(word));
    if (occurrences.length > 0) {
      results[word] = { occurrences };
    }
  }

  return results;
}

// Highlight all matched words in the text with <mark> tags
export function highlightText(text, shiciMatches, xuciMatches) {
  const allWords = [
    ...Object.keys(shiciMatches).map(w => ({ word: w, type: 'shici' })),
    ...Object.keys(xuciMatches).map(w => ({ word: w, type: 'xuci' })),
  ];

  // Sort by length descending to avoid partial overlaps
  allWords.sort((a, b) => b.word.length - a.word.length);

  // Use a character array approach to avoid double-marking
  const chars = Array.from(text).map(ch => ({ ch, type: null }));

  for (const { word, type } of allWords) {
    const wChars = Array.from(word);
    for (let i = 0; i <= chars.length - wChars.length; i++) {
      if (wChars.every((c, j) => chars[i + j].ch === c)) {
        // Only mark if not already marked
        if (wChars.every((c, j) => chars[i + j].type === null)) {
          for (let j = 0; j < wChars.length; j++) {
            chars[i + j].type = type;
          }
        }
      }
    }
  }

  // Build HTML string
  let html = '';
  let i = 0;
  while (i < chars.length) {
    const { ch, type } = chars[i];
    if (type) {
      // Collect consecutive chars of same type
      let span = '';
      while (i < chars.length && chars[i].type === type) {
        span += chars[i].ch;
        i++;
      }
      html += `<mark class="mark-${type}" data-word="${span}">${span}</mark>`;
    } else {
      html += ch === '\n' ? '<br>' : ch;
      i++;
    }
  }
  return html;
}
