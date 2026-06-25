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
// keyPhrases: [{word, sentence}] — mark specific word in specific sentence as 'key'
export function highlightText(text, shiciMatches, xuciMatches, keyPhrases = []) {
  const allWords = [
    ...Object.keys(shiciMatches).map(w => ({ word: w, type: 'shici' })),
    ...Object.keys(xuciMatches).map(w => ({ word: w, type: 'xuci' })),
  ];

  allWords.sort((a, b) => b.word.length - a.word.length);

  // Store type and word for each char position
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

  // Build a Set of char positions that are "key" highlighted
  // For each keyPhrase, find the sentence in text, then mark the word inside it
  const keyPositions = new Set();
  for (const { word, sentence } of keyPhrases) {
    const sentIdx = text.indexOf(sentence);
    if (sentIdx === -1) continue;
    // Find word within that sentence occurrence
    const wordIdx = text.indexOf(word, sentIdx);
    if (wordIdx === -1 || wordIdx > sentIdx + sentence.length) continue;
    for (let k = 0; k < Array.from(word).length; k++) {
      keyPositions.add(wordIdx + k);
    }
  }

  let html = '';
  let i = 0;
  while (i < chars.length) {
    const { ch, type, word } = chars[i];
    if (type) {
      let span = '';
      const currentWord = word;
      const isKey = keyPositions.has(i);
      while (i < chars.length && chars[i].word === currentWord) {
        span += chars[i].ch;
        i++;
      }
      const cls = isKey ? `mark-key` : `mark-${type}`;
      html += `<mark class="${cls}" data-word="${currentWord}">${span}</mark>`;
    } else {
      html += ch === '\n' ? '<br>' : ch;
      i++;
    }
  }
  return html;
}
