# Japansk verbquiz — implementeringsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** En multiple choice-quiz (Artifact-nettside) som quizer japansk → norsk på ~77 verb fra tidlig Duolingo, med Leitner-basert repetisjon lagret i localStorage.

**Architecture:** Ren-JS-logikk (verbdata, Leitner, spørsmålsbygging) ligger i `src/*.js` med CommonJS-export-guard slik at Node kan teste dem; `src/app.js` binder logikken til DOM. `index.html` refererer filene for lokal utvikling; `build.js` inliner alt til `dist/artifact.html` som publiseres som Artifact.

**Tech Stack:** Vanilla HTML/CSS/JS. Node ≥18 (`node --test`) for tester. Ingen avhengigheter.

**Spec:** `docs/superpowers/specs/2026-08-28-japansk-verbquiz-design.md`

## Global Constraints

- Én selvstendig HTML-fil som sluttprodukt (all CSS/JS inline, ingen eksterne ressurser).
- Artifact-krav: ingen `<!DOCTYPE>`/`<html>`/`<head>`/`<body>`-tagger i filen; `<title>` øverst; tema-tokens på `:root`, mørk modus via `@media (prefers-color-scheme: dark)` med `:root:not([data-theme="light"])`-guard OG `:root[data-theme="dark"]`; eksplisitt `background` på `body`.
- Verb i ます-form. Lagringsnøkkel per verb: `kanji + "|" + kana` (kana alene er tvetydig).
- Leitner: bokser 0–4, vekter [16, 8, 4, 2, 1], «mestret» = boks ≥ 3. Feil → boks 0, riktig → +1 (maks 4).
- All `localStorage`-tilgang i try/catch; appen skal fungere uten lagring.
- Responsiv (mobil 375px uten horisontal scroll), norsk UI-tekst.

---

### Task 1: Verbdata

**Files:**
- Create: `src/verbs.js`
- Test: `test/verbs.test.js`

**Interfaces:**
- Produces: global `const VERBS` (array av `{ kanji: string|null, kana: string, no: string }`), også `module.exports = VERBS` i Node.

- [ ] **Step 1: Skriv datavalideringstest**

`test/verbs.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert");
const VERBS = require("../src/verbs.js");

test("60-80 verb", () => {
  assert.ok(VERBS.length >= 60 && VERBS.length <= 80, "fikk " + VERBS.length);
});

test("alle verb har kana og norsk betydning", () => {
  for (const v of VERBS) {
    assert.match(v.kana, /^[ぁ-んァ-ヶー]+$/, JSON.stringify(v));
    assert.ok(v.no.startsWith("å "), JSON.stringify(v));
    assert.ok(v.kanji === null || typeof v.kanji === "string");
  }
});

test("unike nøkler (kanji|kana)", () => {
  const keys = VERBS.map(v => (v.kanji || "") + "|" + v.kana);
  assert.strictEqual(new Set(keys).size, VERBS.length);
});

test("unike norske betydninger", () => {
  const meanings = VERBS.map(v => v.no);
  assert.strictEqual(new Set(meanings).size, VERBS.length);
});
```

- [ ] **Step 2: Kjør testen — skal feile** — `node --test test/` → FAIL (finner ikke `../src/verbs.js`)

- [ ] **Step 3: Skriv `src/verbs.js`**

```js
const VERBS = [
  { kanji: "食べます", kana: "たべます", no: "å spise" },
  { kanji: "飲みます", kana: "のみます", no: "å drikke" },
  { kanji: "行きます", kana: "いきます", no: "å dra (til et sted)" },
  { kanji: "来ます", kana: "きます", no: "å komme" },
  { kanji: "帰ります", kana: "かえります", no: "å dra hjem" },
  { kanji: "見ます", kana: "みます", no: "å se" },
  { kanji: "聞きます", kana: "ききます", no: "å høre / lytte" },
  { kanji: "読みます", kana: "よみます", no: "å lese" },
  { kanji: "書きます", kana: "かきます", no: "å skrive" },
  { kanji: "話します", kana: "はなします", no: "å snakke" },
  { kanji: "言います", kana: "いいます", no: "å si" },
  { kanji: "買います", kana: "かいます", no: "å kjøpe" },
  { kanji: "会います", kana: "あいます", no: "å møte" },
  { kanji: "待ちます", kana: "まちます", no: "å vente" },
  { kanji: "立ちます", kana: "たちます", no: "å reise seg / stå" },
  { kanji: "座ります", kana: "すわります", no: "å sette seg" },
  { kanji: "起きます", kana: "おきます", no: "å våkne / stå opp" },
  { kanji: "寝ます", kana: "ねます", no: "å sove / legge seg" },
  { kanji: "働きます", kana: "はたらきます", no: "å jobbe" },
  { kanji: "休みます", kana: "やすみます", no: "å hvile / ta fri" },
  { kanji: "作ります", kana: "つくります", no: "å lage" },
  { kanji: "使います", kana: "つかいます", no: "å bruke" },
  { kanji: "開けます", kana: "あけます", no: "å åpne" },
  { kanji: "閉めます", kana: "しめます", no: "å lukke" },
  { kanji: "入ります", kana: "はいります", no: "å gå inn" },
  { kanji: "出ます", kana: "でます", no: "å gå ut" },
  { kanji: "泳ぎます", kana: "およぎます", no: "å svømme" },
  { kanji: "走ります", kana: "はしります", no: "å løpe" },
  { kanji: "歩きます", kana: "あるきます", no: "å gå (til fots)" },
  { kanji: "教えます", kana: "おしえます", no: "å undervise / lære bort" },
  { kanji: "習います", kana: "ならいます", no: "å lære (av noen)" },
  { kanji: "勉強します", kana: "べんきょうします", no: "å studere" },
  { kanji: "料理します", kana: "りょうりします", no: "å lage mat" },
  { kanji: "掃除します", kana: "そうじします", no: "å gjøre rent" },
  { kanji: "洗濯します", kana: "せんたくします", no: "å vaske klær" },
  { kanji: "買い物します", kana: "かいものします", no: "å handle" },
  { kanji: "電話します", kana: "でんわします", no: "å ringe" },
  { kanji: "運転します", kana: "うんてんします", no: "å kjøre (bil)" },
  { kanji: "旅行します", kana: "りょこうします", no: "å reise (på tur)" },
  { kanji: "散歩します", kana: "さんぽします", no: "å gå tur" },
  { kanji: null, kana: "します", no: "å gjøre" },
  { kanji: null, kana: "あります", no: "å finnes (ting)" },
  { kanji: null, kana: "います", no: "å være (levende vesener)" },
  { kanji: "着ます", kana: "きます", no: "å ha på seg (overdel)" },
  { kanji: null, kana: "はきます", no: "å ha på seg (bukse/sko)" },
  { kanji: null, kana: "かぶります", no: "å ha på seg (hodeplagg)" },
  { kanji: "脱ぎます", kana: "ぬぎます", no: "å ta av seg (klær)" },
  { kanji: "住みます", kana: "すみます", no: "å bo" },
  { kanji: "思います", kana: "おもいます", no: "å synes / tro" },
  { kanji: "泣きます", kana: "なきます", no: "å gråte" },
  { kanji: "笑います", kana: "わらいます", no: "å le" },
  { kanji: "歌います", kana: "うたいます", no: "å synge" },
  { kanji: "踊ります", kana: "おどります", no: "å danse" },
  { kanji: "遊びます", kana: "あそびます", no: "å leke / ha det gøy" },
  { kanji: "泊まります", kana: "とまります", no: "å overnatte" },
  { kanji: "乗ります", kana: "のります", no: "å gå på (transport)" },
  { kanji: "降ります", kana: "おります", no: "å gå av (transport)" },
  { kanji: "渡ります", kana: "わたります", no: "å krysse (gate/bro)" },
  { kanji: "曲がります", kana: "まがります", no: "å svinge" },
  { kanji: "止まります", kana: "とまります", no: "å stoppe" },
  { kanji: "送ります", kana: "おくります", no: "å sende" },
  { kanji: null, kana: "もらいます", no: "å få / motta" },
  { kanji: null, kana: "あげます", no: "å gi (bort)" },
  { kanji: null, kana: "くれます", no: "å gi (til meg)" },
  { kanji: "借ります", kana: "かります", no: "å låne (av noen)" },
  { kanji: "貸します", kana: "かします", no: "å låne bort" },
  { kanji: "返します", kana: "かえします", no: "å levere tilbake" },
  { kanji: "忘れます", kana: "わすれます", no: "å glemme" },
  { kanji: "覚えます", kana: "おぼえます", no: "å huske / lære utenat" },
  { kanji: "始まります", kana: "はじまります", no: "å begynne" },
  { kanji: "終わります", kana: "おわります", no: "å slutte / bli ferdig" },
  { kanji: "分かります", kana: "わかります", no: "å forstå" },
  { kanji: "撮ります", kana: "とります", no: "å ta (bilde)" },
  { kanji: "消します", kana: "けします", no: "å slå av / slette" },
  { kanji: null, kana: "つけます", no: "å slå på" },
  { kanji: "急ぎます", kana: "いそぎます", no: "å skynde seg" },
  { kanji: "手伝います", kana: "てつだいます", no: "å hjelpe" },
];
if (typeof module !== "undefined") module.exports = VERBS;
```

- [ ] **Step 4: Kjør testen — skal passere** — `node --test test/` → PASS (4 tester)

- [ ] **Step 5: Commit** — `git add src/verbs.js test/verbs.test.js && git commit -m "feat: verbdata med validering"`

---

### Task 2: Quiz-logikk (Leitner + spørsmålsbygging)

**Files:**
- Create: `src/logic.js`
- Test: `test/logic.test.js`

**Interfaces:**
- Consumes: verb-objekter `{ kanji, kana, no }` fra Task 1.
- Produces: global `QuizLogic` med `verbKey(verb) -> string`, `updateBox(box, correct) -> number`, `pickNextVerb(verbs, boxes, lastKey, rng) -> verb`, `buildOptions(verbs, target, rng) -> verb[4]`, `shuffle(arr, rng) -> arr`, `masteredCount(verbs, boxes) -> number`, konstantene `BOX_WEIGHTS`, `MAX_BOX`, `MASTERED_BOX`. `boxes` er et objekt `{ [verbKey]: number }`; `rng` er en funksjon som `Math.random`.

- [ ] **Step 1: Skriv feilende tester**

`test/logic.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert");
const L = require("../src/logic.js");

const verbs = [
  { kanji: "来ます", kana: "きます", no: "å komme" },
  { kanji: "着ます", kana: "きます", no: "å ha på seg (overdel)" },
  { kanji: null, kana: "します", no: "å gjøre" },
  { kanji: "食べます", kana: "たべます", no: "å spise" },
  { kanji: "飲みます", kana: "のみます", no: "å drikke" },
];

test("verbKey skiller kanji-homofoner", () => {
  assert.notStrictEqual(L.verbKey(verbs[0]), L.verbKey(verbs[1]));
  assert.strictEqual(L.verbKey(verbs[2]), "|します");
});

test("updateBox: riktig gir +1 opp til maks, feil resetter til 0", () => {
  assert.strictEqual(L.updateBox(0, true), 1);
  assert.strictEqual(L.updateBox(L.MAX_BOX, true), L.MAX_BOX);
  assert.strictEqual(L.updateBox(3, false), 0);
});

test("pickNextVerb hopper over forrige verb", () => {
  for (let i = 0; i < 50; i++) {
    const v = L.pickNextVerb(verbs, {}, L.verbKey(verbs[3]), Math.random);
    assert.notStrictEqual(L.verbKey(v), L.verbKey(verbs[3]));
  }
});

test("pickNextVerb vekter boks 0 over boks 4", () => {
  const boxes = {};
  for (const v of verbs) boxes[L.verbKey(v)] = L.MAX_BOX;
  boxes[L.verbKey(verbs[3])] = 0;
  let hits = 0;
  const N = 2000;
  for (let i = 0; i < N; i++) {
    if (L.verbKey(L.pickNextVerb(verbs, boxes, null, Math.random)) === L.verbKey(verbs[3])) hits++;
  }
  // forventet andel: 16/(16+4) = 0.8
  assert.ok(hits / N > 0.7, "andel " + hits / N);
});

test("buildOptions gir 4 unike alternativer inkl. målverbet", () => {
  for (let i = 0; i < 50; i++) {
    const opts = L.buildOptions(verbs, verbs[3], Math.random);
    assert.strictEqual(opts.length, 4);
    assert.ok(opts.includes(verbs[3]));
    assert.strictEqual(new Set(opts.map(L.verbKey)).size, 4);
  }
});

test("buildOptions stokker posisjonen til riktig svar", () => {
  const positions = new Set();
  for (let i = 0; i < 200; i++) {
    positions.add(L.buildOptions(verbs, verbs[3], Math.random).indexOf(verbs[3]));
  }
  assert.ok(positions.size >= 3, "posisjoner: " + [...positions]);
});

test("masteredCount teller bokser >= MASTERED_BOX", () => {
  const boxes = {};
  boxes[L.verbKey(verbs[0])] = L.MASTERED_BOX;
  boxes[L.verbKey(verbs[1])] = L.MAX_BOX;
  boxes[L.verbKey(verbs[2])] = L.MASTERED_BOX - 1;
  assert.strictEqual(L.masteredCount(verbs, boxes), 2);
});
```

- [ ] **Step 2: Kjør testene — skal feile** — `node --test test/` → FAIL (finner ikke `../src/logic.js`)

- [ ] **Step 3: Skriv `src/logic.js`**

```js
const QuizLogic = (function () {
  const BOX_WEIGHTS = [16, 8, 4, 2, 1];
  const MAX_BOX = 4;
  const MASTERED_BOX = 3;

  function verbKey(verb) {
    return (verb.kanji || "") + "|" + verb.kana;
  }

  function updateBox(box, correct) {
    return correct ? Math.min(box + 1, MAX_BOX) : 0;
  }

  function pickNextVerb(verbs, boxes, lastKey, rng) {
    const candidates = verbs.filter(v => verbKey(v) !== lastKey);
    const pool = candidates.length > 0 ? candidates : verbs;
    const weights = pool.map(v => BOX_WEIGHTS[boxes[verbKey(v)] || 0]);
    let r = rng() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r < 0) return pool[i];
    }
    return pool[pool.length - 1];
  }

  function shuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildOptions(verbs, target, rng) {
    const others = verbs.filter(v => verbKey(v) !== verbKey(target));
    const distractors = shuffle(others, rng).slice(0, 3);
    return shuffle([target, ...distractors], rng);
  }

  function masteredCount(verbs, boxes) {
    return verbs.filter(v => (boxes[verbKey(v)] || 0) >= MASTERED_BOX).length;
  }

  return { verbKey, updateBox, pickNextVerb, shuffle, buildOptions, masteredCount, BOX_WEIGHTS, MAX_BOX, MASTERED_BOX };
})();
if (typeof module !== "undefined") module.exports = QuizLogic;
```

- [ ] **Step 4: Kjør testene — skal passere** — `node --test test/` → PASS (alle)

- [ ] **Step 5: Commit** — `git add src/logic.js test/logic.test.js && git commit -m "feat: Leitner- og spørsmålslogikk"`

---

### Task 3: UI (markup, stil, app-kode) med lokal verifisering

**Files:**
- Create: `index.html`, `src/style.css`, `src/app.js`, `.claude/launch.json`

**Interfaces:**
- Consumes: `VERBS` (Task 1), `QuizLogic` (Task 2) som globale variabler i nettleseren.
- Produces: ferdig fungerende side; `index.html` er malen Task 4 inliner.

- [ ] **Step 1: Skriv `index.html`**

```html
<title>Japansk verbquiz</title>
<link rel="stylesheet" href="src/style.css">
<main class="app">
  <header class="top">
    <div id="progress" class="progress-text"></div>
    <div class="progress-track"><div id="progress-bar" class="progress-fill"></div></div>
  </header>
  <section class="card">
    <div id="prompt" class="prompt" lang="ja"></div>
    <div id="options" class="options"></div>
    <button id="next" type="button" hidden>Neste</button>
  </section>
</main>
<script src="src/verbs.js"></script>
<script src="src/logic.js"></script>
<script src="src/app.js"></script>
```

- [ ] **Step 2: Skriv `src/style.css`**

```css
:root {
  --bg: #f7f6f3;
  --card: #ffffff;
  --text: #1c1c1e;
  --muted: #6e6e73;
  --accent: #2f6fed;
  --accent-text: #ffffff;
  --border: #d9d9de;
  --correct-bg: #e2f4e6;
  --correct-border: #3a9d5d;
  --wrong-bg: #fbe4e4;
  --wrong-border: #cc4444;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #191a1d;
    --card: #242629;
    --text: #ececec;
    --muted: #9a9aa0;
    --accent: #6fa0ff;
    --accent-text: #10131a;
    --border: #3a3c40;
    --correct-bg: #1f3a28;
    --correct-border: #4dbb72;
    --wrong-bg: #442325;
    --wrong-border: #e06666;
  }
}
:root[data-theme="dark"] {
  --bg: #191a1d;
  --card: #242629;
  --text: #ececec;
  --muted: #9a9aa0;
  --accent: #6fa0ff;
  --accent-text: #10131a;
  --border: #3a3c40;
  --correct-bg: #1f3a28;
  --correct-border: #4dbb72;
  --wrong-bg: #442325;
  --wrong-border: #e06666;
}
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
}
.app {
  max-width: 480px;
  margin: 0 auto;
  padding: 20px 16px 32px;
}
.progress-text {
  font-size: 0.85rem;
  color: var(--muted);
  margin-bottom: 6px;
}
.progress-track {
  height: 6px;
  border-radius: 3px;
  background: var(--border);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  width: 0;
  border-radius: 3px;
  background: var(--accent);
  transition: width 0.3s ease;
}
.prompt {
  font-size: 2.7rem;
  line-height: 1.2;
  text-align: center;
  margin: 56px 0 40px;
}
.prompt ruby rt {
  font-size: 0.95rem;
  color: var(--muted);
}
.options {
  display: grid;
  gap: 10px;
}
.option {
  padding: 14px 16px;
  font-size: 1.05rem;
  font-family: inherit;
  text-align: left;
  color: var(--text);
  background: var(--card);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
}
.option:disabled {
  cursor: default;
  opacity: 0.85;
}
.option.correct {
  background: var(--correct-bg);
  border-color: var(--correct-border);
  opacity: 1;
}
.option.wrong {
  background: var(--wrong-bg);
  border-color: var(--wrong-border);
  opacity: 1;
}
#next {
  margin-top: 20px;
  width: 100%;
  padding: 14px;
  font-size: 1.05rem;
  font-family: inherit;
  border: none;
  border-radius: 12px;
  background: var(--accent);
  color: var(--accent-text);
  cursor: pointer;
}
```

- [ ] **Step 3: Skriv `src/app.js`**

```js
(function () {
  const STORAGE_KEY = "japansk-verbquiz-v1";

  function loadBoxes() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return data && typeof data === "object" ? data : {};
    } catch (e) {
      return {};
    }
  }

  function saveBoxes(boxes) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(boxes));
    } catch (e) { /* fortsett uten lagring */ }
  }

  const boxes = loadBoxes();
  let lastKey = null;
  let current = null;
  let answered = false;

  const els = {
    progress: document.getElementById("progress"),
    progressBar: document.getElementById("progress-bar"),
    prompt: document.getElementById("prompt"),
    options: document.getElementById("options"),
    next: document.getElementById("next"),
  };

  function renderPrompt(verb) {
    els.prompt.textContent = "";
    if (verb.kanji) {
      const ruby = document.createElement("ruby");
      ruby.appendChild(document.createTextNode(verb.kanji));
      const rt = document.createElement("rt");
      rt.textContent = verb.kana;
      ruby.appendChild(rt);
      els.prompt.appendChild(ruby);
    } else {
      els.prompt.textContent = verb.kana;
    }
  }

  function renderProgress() {
    const mastered = QuizLogic.masteredCount(VERBS, boxes);
    els.progress.textContent = mastered + " av " + VERBS.length + " verb mestret";
    els.progressBar.style.width = (100 * mastered / VERBS.length) + "%";
  }

  function answer(clickedBtn, option) {
    if (answered) return;
    answered = true;
    const key = QuizLogic.verbKey(current.verb);
    const correct = option === current.verb;
    boxes[key] = QuizLogic.updateBox(boxes[key] || 0, correct);
    saveBoxes(boxes);
    lastKey = key;
    Array.from(els.options.children).forEach((btn, i) => {
      btn.disabled = true;
      if (current.options[i] === current.verb) btn.classList.add("correct");
    });
    if (!correct) clickedBtn.classList.add("wrong");
    renderProgress();
    els.next.hidden = false;
    els.next.focus();
  }

  function nextQuestion() {
    const verb = QuizLogic.pickNextVerb(VERBS, boxes, lastKey, Math.random);
    current = { verb, options: QuizLogic.buildOptions(VERBS, verb, Math.random) };
    answered = false;
    renderPrompt(verb);
    els.options.textContent = "";
    current.options.forEach(option => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option";
      btn.textContent = option.no;
      btn.addEventListener("click", () => answer(btn, option));
      els.options.appendChild(btn);
    });
    els.next.hidden = true;
  }

  els.next.addEventListener("click", nextQuestion);
  renderProgress();
  nextQuestion();
})();
```

- [ ] **Step 4: Lag `.claude/launch.json`**

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "japansk-quiz",
      "runtimeExecutable": "python3",
      "runtimeArgs": ["-m", "http.server", "4173"],
      "port": 4173
    }
  ]
}
```

- [ ] **Step 5: Verifiser i nettleserpanelet** — start `japansk-quiz`-serveren, åpne siden og sjekk: (a) ingen konsollfeil; (b) spørsmål med furigana rendres; (c) klikk riktig svar → grønn markering, «Neste» vises; (d) klikk feil svar → rød + riktig markert grønt; (e) `localStorage`-nøkkelen `japansk-verbquiz-v1` oppdateres og overlever refresh; (f) 375px-bredde uten horisontal scroll; (g) mørk modus via `resize_window` colorScheme.

- [ ] **Step 6: Commit** — `git add index.html src/style.css src/app.js .claude/launch.json && git commit -m "feat: quiz-UI med lagring"`

---

### Task 4: Bygg og publiser Artifact

**Files:**
- Create: `build.js`
- Create (generert): `dist/artifact.html`

**Interfaces:**
- Consumes: `index.html` + `src/*`-filene fra Task 1–3.
- Produces: `dist/artifact.html` — selvstendig fil klar for Artifact-publisering.

- [ ] **Step 1: Skriv `build.js`**

```js
const fs = require("node:fs");
let html = fs.readFileSync("index.html", "utf8");
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, p) =>
  "<style>\n" + fs.readFileSync(p, "utf8") + "</style>");
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, p) =>
  "<script>\n" + fs.readFileSync(p, "utf8") + "</script>");
if (/<link|<script src/.test(html)) throw new Error("uinlinede referanser igjen");
fs.mkdirSync("dist", { recursive: true });
fs.writeFileSync("dist/artifact.html", html);
console.log("Skrev dist/artifact.html (" + html.length + " tegn)");
```

- [ ] **Step 2: Kjør bygget og sjekk resultatet** — `node build.js` → skriver `dist/artifact.html`; `grep -c '<style>\|<script>' dist/artifact.html` skal vise 4 (1 style + 3 script), og `grep 'src=' dist/artifact.html` skal være tomt.

- [ ] **Step 3: Publiser som Artifact** — Artifact-verktøyet med `file_path: dist/artifact.html`, favicon 🈴, description «Multiple choice-quiz for japanske verb med smart repetisjon». (Last `artifact-design`-skillen først, som Artifact-verktøyet krever.)

- [ ] **Step 4: Verifiser publisert artifact** — åpne artifact-URL-en i nettleserpanelet og gjenta sjekkpunktene fra Task 3 Step 5 (minus dev-server).

- [ ] **Step 5: Commit** — `git add build.js dist/artifact.html && git commit -m "feat: byggescript og publisert artifact"`. Gi brukeren lenken.
