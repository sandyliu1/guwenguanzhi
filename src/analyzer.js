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
// annotations: [{word, phonetic, desc}] — mark with ruby phonetic and tooltip
// keySentences: [string] — wrap sentence with dashed underline
export function highlightText(text, shiciMatches, xuciMatches, keyPhrases = [], annotations = [], keySentences = []) {
  const allWords = [
    ...Object.keys(shiciMatches).map(w => ({ word: w, type: 'shici' })),
    ...Object.keys(xuciMatches).map(w => ({ word: w, type: 'xuci' })),
  ];

  allWords.sort((a, b) => b.word.length - a.word.length);

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

  // Mark annotation positions
  const annotationMap = {}; // startIndex -> annotation
  for (const ann of annotations) {
    const wChars = Array.from(ann.word);
    for (let i = 0; i <= chars.length - wChars.length; i++) {
      if (wChars.every((c, j) => chars[i + j].ch === c) &&
          wChars.every((c, j) => chars[i + j].type === null)) {
        for (let j = 0; j < wChars.length; j++) {
          chars[i + j].type = 'annotation';
          chars[i + j].word = ann.word;
        }
        annotationMap[i] = ann;
      }
    }
  }

  const keyPositions = new Set();
  for (const { word, sentence } of keyPhrases) {
    const sentIdx = text.indexOf(sentence);
    if (sentIdx === -1) continue;
    const wordIdx = text.indexOf(word, sentIdx);
    if (wordIdx === -1 || wordIdx > sentIdx + sentence.length) continue;
    for (let k = 0; k < Array.from(word).length; k++) {
      keyPositions.add(wordIdx + k);
    }
  }

  // Build set of char positions covered by keySentences
  const keySentenceRanges = []; // [{start, end}]
  const textChars = Array.from(text);
  for (const sentence of keySentences) {
    const sChars = Array.from(sentence);
    outer: for (let i = 0; i <= textChars.length - sChars.length; i++) {
      for (let j = 0; j < sChars.length; j++) {
        if (textChars[i + j] !== sChars[j]) continue outer;
      }
      keySentenceRanges.push({ start: i, end: i + sChars.length });
    }
  }

  function isKeySentencePos(pos) {
    return keySentenceRanges.some(r => pos >= r.start && pos < r.end);
  }

  let html = '<p class="text-para">';
  let i = 0;
  let inKeySentence = false;
  while (i < chars.length) {
    const inKS = isKeySentencePos(i);
    if (inKS && !inKeySentence) { html += '<span class="key-sentence">'; inKeySentence = true; }
    if (!inKS && inKeySentence) { html += '</span>'; inKeySentence = false; }

    const { ch, type, word } = chars[i];
    if (type) {
      let span = '';
      const currentWord = word;
      const isKey = keyPositions.has(i);
      const ann = annotationMap[i];
      while (i < chars.length && chars[i].word === currentWord) {
        // check if we cross a keySentence boundary mid-word (unlikely but safe)
        span += chars[i].ch;
        i++;
      }
      if (type === 'annotation' && ann) {
        const safeDesc = ann.desc.replace(/"/g, '&quot;');
        if (ann.desc) {
          html += `<mark class="mark-annotation" data-annotation="${safeDesc}" title="${safeDesc}"><ruby>${span}<rt>${ann.phonetic}</rt></ruby></mark>`;
        } else {
          html += `<ruby class="phonetic-only">${span}<rt>${ann.phonetic}</rt></ruby>`;
        }
      } else {
        const cls = isKey ? `mark-key` : `mark-${type}`;
        html += `<mark class="${cls}" data-word="${currentWord}">${span}</mark>`;
      }
    } else {
      html += ch === '\n' ? '</p><p class="text-para">' : ch;
      i++;
    }
  }
  if (inKeySentence) html += '</span>';
  html += '</p>';

  return html;
}
