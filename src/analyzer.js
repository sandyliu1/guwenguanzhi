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

  allWords.sort((a, b) => b.word.length - a.word.length);

  // Store both type and the matched word for each char position
  const chars = Array.from(text).map(ch => ({ ch, type: null, word: null }));

  for (const { word, type } of allWords) {
    const wChars = Array.from(word);
    for (let i = 0; i <= chars.length - wChars.length; i++) {
      if (wChars.every((c, j) => chars[i + j].ch === c)) {
        if (wChars.every((c, j) => chars[i + j].type === null)) {
          for (let j = 0; j < wChars.length; j++) {
            chars[i + j].type = type;
            chars[i + j].word = word;
          }
        }
      }
    }
  }

  let html = '';
  let i = 0;
  while (i < chars.length) {
    const { ch, type, word } = chars[i];
    if (type) {
      // Collect only chars belonging to the same word instance
      let span = '';
      const currentWord = word;
      while (i < chars.length && chars[i].word === currentWord) {
        span += chars[i].ch;
        i++;
      }
      html += `<mark class="mark-${type}" data-word="${currentWord}">${span}</mark>`;
    } else {
      html += ch === '\n' ? '<br>' : ch;
      i++;
    }
  }
  return html;
}
