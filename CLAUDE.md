# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GuwenLearner is a static front-end web app for middle school classical Chinese (古文) vocabulary study. Given a classical Chinese text, it highlights and lists all matched 实词 (content words) and 虚词 (function words) with the sentences they appear in.

## Architecture

Pure front-end, no backend. Open `index.html` directly in a browser.

```
GuwenLearner/
├── index.html              # Main page
├── style.css               # Styles
├── src/
│   ├── main.js             # Entry: page init, event binding
│   ├── analyzer.js         # Core: scan text, match 实词/虚词
│   └── formatter.js        # Generate highlighted HTML and result list
└── data/
    ├── shici.json          # 常考实词 with definitions (to be provided)
    └── xuci.json           # 常考虚词 with definitions (to be provided)
```

## Workflow

1. User selects or pastes a classical Chinese text
2. App scans the text against `shici.json` (实词) and `xuci.json` (虚词)
3. Output:
   - Left panel: original text with matched words highlighted (`<mark>`)
   - Right panel: two sections (实词 / 虚词), each word listed with every sentence it appears in

## Data Format (pending — user will provide)

`shici.json` and `xuci.json` will be provided by the user. Once received, parse them and load into the analyzer.

## Key Behavior

- Same word appearing in multiple sentences → list **all** occurrences
- Sentence boundary: split on `。？！；` 
- Matching is character-level (no tokenizer needed for classical Chinese)
- No build step, no npm — plain HTML/CSS/JS
