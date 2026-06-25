import { analyze, highlightText } from './analyzer.js';

let shiciData = {};
let xuciData = {};
let articles = [];
let currentShiciMatches = {};
let currentXuciMatches = {};

async function loadData() {
  const [s, x, a] = await Promise.all([
    fetch('./data/shici.json').then(r => r.json()),
    fetch('./data/xuci.json').then(r => r.json()),
    fetch('./data/articles.json').then(r => r.json()),
  ]);
  shiciData = s;
  xuciData = x;
  articles = a;
}

function showDetail(word) {
  const shiciMatch = currentShiciMatches[word];
  const xuciMatch = currentXuciMatches[word];
  const match = shiciMatch || xuciMatch;
  if (!match) return;

  const type = shiciMatch ? 'shici' : 'xuci';
  const typeLabel = type === 'shici' ? '实词' : '虚词';
  const wordData = type === 'shici' ? shiciData[word] : xuciData[word];

  // Build usages HTML
  let usagesHtml = '';
  if (wordData && wordData.usages && wordData.usages.length > 0) {
    if (type === 'xuci') {
      // 虚词：大类 → 细分 → 例句
      wordData.usages.forEach((u, idx) => {
        usagesHtml += `<div class="usage-block">
          <div class="usage-main"><span class="usage-num">${idx + 1}</span>${u.desc}</div>`;
        if (u.subs && u.subs.length > 0) {
          u.subs.forEach(sub => {
            usagesHtml += `<div class="usage-sub">
              <div class="sub-desc">◆ ${sub.desc}</div>`;
            if (sub.examples && sub.examples.length > 0) {
              usagesHtml += `<ul class="ex-list">` +
                sub.examples.map(e => `<li>${e}</li>`).join('') +
                `</ul>`;
            }
            usagesHtml += `</div>`;
          });
        }
        if (u.examples && u.examples.length > 0) {
          usagesHtml += `<ul class="ex-list">` +
            u.examples.map(e => `<li>${e}</li>`).join('') +
            `</ul>`;
        }
        usagesHtml += `</div>`;
      });
      // 复合词
      if (wordData.compounds && wordData.compounds.length > 0) {
        usagesHtml += `<div class="compounds-section"><div class="detail-section-title">复合词</div>`;
        wordData.compounds.forEach(c => {
          usagesHtml += `<div class="compound-block">
            <span class="compound-term">【${c.term}】</span>
            <span class="compound-desc">${c.desc}</span>`;
          if (c.examples && c.examples.length > 0) {
            usagesHtml += `<ul class="ex-list">` +
              c.examples.map(e => `<li>${e}</li>`).join('') +
              `</ul>`;
          }
          usagesHtml += `</div>`;
        });
        usagesHtml += `</div>`;
      }
    } else {
      // 实词：义项列表
      wordData.usages.forEach((u, idx) => {
        usagesHtml += `<div class="usage-block">
          <div class="usage-main"><span class="usage-num">${idx + 1}</span>${u.desc}</div>`;
        if (u.examples && u.examples.length > 0) {
          usagesHtml += `<ul class="ex-list">` +
            u.examples.map(e => `<li>${e.sentence}${e.source ? `<span class="ex-source">《${e.source}》</span>` : ''}</li>`).join('') +
            `</ul>`;
        }
        usagesHtml += `</div>`;
      });
    }
  }

  // Build occurrences in this article
  const sentences = match.occurrences
    .map(s => {
      const hl = s.replace(new RegExp(word, 'g'), `<em>${word}</em>`);
      return `<li class="sentence">${hl}</li>`;
    }).join('');

  document.getElementById('detail-content').innerHTML = `
    <div class="detail-header">
      <span class="word-tag ${type}-tag detail-word">${word}</span>
      <span class="detail-type-badge ${type}-title">${typeLabel}</span>
    </div>
    <div class="detail-section">
      <div class="detail-section-title">用法释义</div>
      ${usagesHtml}
    </div>
    <div class="detail-section">
      <div class="detail-section-title">本文出现（${match.occurrences.length}处）</div>
      <ul class="occurrences">${sentences}</ul>
    </div>
  `;

  document.getElementById('word-detail').classList.remove('hidden');
  document.getElementById('results').classList.add('hidden');
}

function showList() {
  document.getElementById('word-detail').classList.add('hidden');
  document.getElementById('results').classList.remove('hidden');
}

function buildResultSection(title, matches, cssClass, wordData) {
  const entries = Object.entries(matches);
  if (entries.length === 0) return '';

  let html = `<div class="result-group">
    <h3 class="group-title ${cssClass}-title">${title} <span class="count">${entries.length}个</span></h3>
    <ul class="word-list">`;

  for (const [word, { occurrences }] of entries) {
    const data = wordData[word];
    const summary = data && data.usages
      ? data.usages.slice(0, 3).map(u => u.desc).join('；') + (data.usages.length > 3 ? '…' : '')
      : '';
    html += `<li class="word-item" id="word-${word}" data-word="${word}">
      <div class="word-header">
        <span class="word-tag ${cssClass}-tag">${word}</span>
        <span class="meanings">${summary}</span>
      </div>
      <div class="occurrence-count">${occurrences.length}处</div>
    </li>`;
  }

  html += `</ul></div>`;
  return html;
}

function runAnalysis(article) {
  const text = article.content;
  currentShiciMatches = analyze(text, shiciData);
  currentXuciMatches = analyze(text, xuciData);

  document.getElementById('text-display').innerHTML =
    highlightText(text, currentShiciMatches, currentXuciMatches);

  document.getElementById('results').innerHTML =
    buildResultSection('实词', currentShiciMatches, 'shici', shiciData) +
    buildResultSection('虚词', currentXuciMatches, 'xuci', xuciData);

  document.getElementById('article-title').textContent =
    `${article.title}（${article.author}）`;

  showList();

  // 点击左侧高亮词 → 显示详情
  document.getElementById('text-display').querySelectorAll('mark[data-word]').forEach(mark => {
    mark.addEventListener('click', () => showDetail(mark.dataset.word));
  });

  // 点击右侧词条 → 显示详情
  document.getElementById('results').querySelectorAll('.word-item').forEach(item => {
    item.addEventListener('click', () => showDetail(item.dataset.word));
  });
}

async function init() {
  await loadData();

  document.getElementById('detail-back').addEventListener('click', showList);

  // Nav toggle
  const layout = document.querySelector('.layout');
  document.getElementById('nav-toggle').addEventListener('click', () => {
    layout.classList.toggle('nav-hidden');
  });

  const nav = document.getElementById('article-nav');
  let currentIdx = 0;

  function selectArticle(i) {
    currentIdx = i;
    // Update active state
    nav.querySelectorAll('.nav-article-item').forEach(el => {
      el.classList.toggle('active', +el.dataset.idx === i);
    });
    runAnalysis(articles[i]);
  }

  // Group articles by period → group
  const periodMap = {};
  articles.forEach((a, i) => {
    const period = a.period || '其他';
    const group = a.group || '其他';
    if (!periodMap[period]) periodMap[period] = {};
    if (!periodMap[period][group]) periodMap[period][group] = [];
    periodMap[period][group].push({ a, i });
  });

  let globalNum = 1;
  Object.entries(periodMap).forEach(([period, groups]) => {
    const periodEl = document.createElement('div');
    periodEl.className = 'nav-period';

    const periodHeader = document.createElement('div');
    periodHeader.className = 'nav-period-header';
    periodHeader.textContent = period;
    periodEl.appendChild(periodHeader);

    Object.entries(groups).forEach(([group, items]) => {
      const groupEl = document.createElement('div');
      groupEl.className = 'nav-group';

      const groupHeader = document.createElement('div');
      groupHeader.className = 'nav-group-header';
      groupHeader.textContent = group;
      groupEl.appendChild(groupHeader);

      items.forEach(({ a, i }) => {
        const item = document.createElement('div');
        item.className = 'nav-article-item';
        item.dataset.idx = i;
        item.innerHTML = `<span class="nav-num">${globalNum++}</span>${a.title}`;
        item.addEventListener('click', () => selectArticle(i));
        groupEl.appendChild(item);
      });

      periodEl.appendChild(groupEl);
    });

    nav.appendChild(periodEl);
  });

  selectArticle(0);
}

init();
