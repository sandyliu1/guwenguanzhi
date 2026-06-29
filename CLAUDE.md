# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GuwenLearner is a static front-end web app for middle school classical Chinese (古文) vocabulary study. Given a classical Chinese text, it highlights and lists all matched 实词 (content words) and 虚词 (function words). Clicking a highlighted word shows detailed usage and definitions in the right panel.

## Architecture

Pure front-end, no backend. Must be served over HTTP (not `file://`) due to `fetch()` calls.

```
GuwenLearner/
├── index.html              # Main page
├── style.css               # Styles
├── src/
│   ├── main.js             # Entry: page init, article selection, click handlers
│   └── analyzer.js         # Core: scan text, match 实词/虚词, highlight HTML
├── data/
│   ├── shici.json          # 47 常考实词，结构：{word: {usages: [{desc, examples:[{sentence,source}]}]}}
│   ├── xuci.json           # 18 常考虚词，结构：{word: {usages: [{desc, subs:[{desc,examples}], examples}], compounds:[{term,desc,examples}]}}
│   ├── articles.json       # 文章索引（仅含导航字段，不含正文），结构见下
│   └── articles/           # 每篇文章的完整数据，文件名 = title + .json
│       ├── 郑伯克段于鄢.json
│       └── ...
├── scripts/
│   └── split-articles.js   # 将 articles.json 全量文件拆分为索引+独立文件（一次性工具）
├── basicWords/             # 原始 Word 文档（实词/虚词词库来源）
│   ├── 120个文言实词用法及其举例.docx
│   └── 18个文言虚词用法及举例.docx
└── articals/               # 原始文章 Word 文档
    └── 郑伯克段于鄢.docx
```

## Dev Server

```bash
npx serve . -p 3456
# then open http://localhost:3456
```

## Deployed

GitHub Pages: https://liuzuosong-tech.github.io/GuwenLearner/
GitHub repo: https://github.com/liuzuosong-tech/GuwenLearner.git

Push to deploy (only push to sandy remote, origin token expired):
```bash
git add ... && git commit -m "..." && git push sandy main
```

## Adding a New Article

文章数据分两层：
- `data/articles.json`：索引文件，只含导航字段（title/author/period/group/category/id）
- `data/articles/<title>.json`：完整文章数据，页面按需加载

### 步骤

1. 把 `.docx` 放入 `articals/`

2. 运行以下 Python 脚本，同时更新索引和创建详情文件：

```python
import docx, json, os

doc = docx.Document(r'articals/新文章.docx')
paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]

title = paragraphs[0]
author = paragraphs[1]
content = ''.join(paragraphs[2:])

# 完整文章数据（详情文件）
detail = {
    'title': title,
    'author': author,
    'period': '春秋',
    'group': '分组名',
    'category': '周文',
    'content': content,
    'background': '',
    'keySentences': [],
    'annotations': [],
}
os.makedirs('data/articles', exist_ok=True)
with open(f'data/articles/{title}.json', 'w', encoding='utf-8') as f:
    json.dump(detail, f, ensure_ascii=False, indent=2)

# 索引文件（只加导航字段）
with open('data/articles.json', encoding='utf-8') as f:
    index = json.load(f)
index.append({
    'id': title,
    'title': title,
    'author': author,
    'period': '春秋',
    'group': '分组名',
    'category': '周文',
})
with open('data/articles.json', 'w', encoding='utf-8') as f:
    json.dump(index, f, ensure_ascii=False, indent=2)

print(f'Done: {title}')
```

3. 在浏览器 `http://localhost:3456` 验证

4. Push：
```bash
git add data/articles.json data/articles/<title>.json articals/<title>.docx
git commit -m "Add article: <title>"
git push sandy main
```

## Data JSON Structures

**articles.json（索引，导航用）**
```json
[
  {
    "id": "郑伯克段于鄢",
    "title": "郑伯克段于鄢",
    "author": "左丘明·先秦",
    "period": "春秋",
    "group": "小霸王郑庄公",
    "category": "周文"
  }
]
```

**data/articles/<title>.json（完整文章数据，按需加载）**
```json
{
  "title": "郑伯克段于鄢",
  "author": "左丘明·先秦",
  "period": "春秋",
  "group": "小霸王郑庄公",
  "category": "周文",
  "content": "初，郑武公...",
  "background": "背景说明文字，段落间用 \\n\\n 分隔。注意：不能含未转义的英文双引号。",
  "keySentences": ["需要画线的句子原文"],
  "keyPhrases": [{"word": "于", "sentence": "郑伯克段于鄢"}],
  "annotations": [
    {"word": "亟", "phonetic": "qì", "desc": "屡次。"},
    {"word": "虢", "phonetic": "guó", "desc": ""}
  ],
  "map": "images/zhengguo.jpg"
}
```

**shici.json**
```json
{
  "爱": {
    "usages": [
      { "desc": "爱护", "examples": [{"sentence": "爱其子，择师而教之。", "source": "师说"}] }
    ]
  }
}
```

**xuci.json**
```json
{
  "而": {
    "usages": [
      {
        "desc": "用作连词。",
        "subs": [{"desc": "表示并列关系。", "examples": ["蟹六跪而二螯…"]}],
        "examples": []
      }
    ],
    "compounds": [{"term": "而已", "desc": "罢了", "examples": ["..."]}]
  }
}
```

## Key Behavior

- Sentence boundary: split on `。？！；`
- Matching is character-level
- Clicking a highlighted word in the text → right panel shows detail view (用法释义 + 本文出现)
- articles.json is loaded once at startup (index only); full article data is fetched on demand from `data/articles/<id>.json` and cached in memory
- JSON strings must not contain unescaped English double quotes `"` — use single quotes `'` or Chinese quotes `「」` inside string values
