(function () {
  const ROUND_LENGTH = 10;
  const MODE_KEY = "japansk-quiz-mode";

  const MODES = {
    verbs: { items: VERBS, storageKey: "japansk-verbquiz-v1" },
    words: { items: WORDS, storageKey: "japansk-gloser-v1" },
  };

  function read(key) {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      return data && typeof data === "object" ? data : {};
    } catch (e) {
      return {};
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* fortsett uten lagring */ }
  }

  function loadMode() {
    try {
      const saved = localStorage.getItem(MODE_KEY);
      return Object.prototype.hasOwnProperty.call(MODES, saved) ? saved : "verbs";
    } catch (e) {
      return "verbs";
    }
  }

  let mode = loadMode();
  let items = MODES[mode].items;
  let boxes = read(MODES[mode].storageKey);
  let lastKey = null;
  let current = null;
  let selected = null;
  let phase = "choose"; // "choose" | "feedback"
  let roundProgress = 0; // riktige svar denne runden, 0..ROUND_LENGTH

  const els = {
    tabs: { verbs: document.getElementById("tab-verbs"), words: document.getElementById("tab-words") },
    progress: document.getElementById("progress"),
    progressBar: document.getElementById("progress-bar"),
    prompt: document.getElementById("prompt"),
    options: document.getElementById("options"),
    footer: document.getElementById("footer"),
    feedback: document.getElementById("feedback"),
    feedbackTitle: document.getElementById("feedback-title"),
    feedbackText: document.getElementById("feedback-text"),
    action: document.getElementById("action"),
  };

  function renderTabs() {
    Object.keys(MODES).forEach(name => {
      els.tabs[name].setAttribute("aria-selected", String(name === mode));
    });
  }

  function renderPrompt(item) {
    els.prompt.textContent = "";
    if (item.kanji) {
      const ruby = document.createElement("ruby");
      ruby.appendChild(document.createTextNode(item.kanji));
      const rt = document.createElement("rt");
      rt.textContent = item.kana;
      ruby.appendChild(rt);
      els.prompt.appendChild(ruby);
    } else {
      els.prompt.textContent = item.kana;
    }
  }

  function renderProgress() {
    els.progress.textContent = roundProgress + " av " + ROUND_LENGTH;
    els.progressBar.style.width = (100 * roundProgress / ROUND_LENGTH) + "%";
  }

  function select(index) {
    if (phase !== "choose") return;
    selected = index;
    Array.from(els.options.children).forEach((btn, i) => {
      btn.classList.toggle("selected", i === index);
    });
    els.action.disabled = false;
  }

  function check() {
    if (selected === null) return;
    phase = "feedback";
    const key = QuizLogic.verbKey(current.item);
    const correct = current.options[selected] === current.item;
    boxes[key] = QuizLogic.updateBox(boxes[key] || 0, correct);
    write(MODES[mode].storageKey, boxes);
    lastKey = key;
    Array.from(els.options.children).forEach((btn, i) => {
      btn.disabled = true;
      btn.classList.remove("selected");
      if (current.options[i] === current.item) btn.classList.add("reveal-correct");
      else if (i === selected) btn.classList.add("reveal-wrong");
    });
    if (correct) roundProgress++;
    els.footer.classList.add(correct ? "good" : "bad");
    els.feedbackTitle.textContent = correct ? "Riktig!" : "Feil!";
    els.feedbackText.textContent = correct ? "" : "Riktig svar: " + current.item.no;
    els.feedbackText.hidden = correct;
    els.feedback.hidden = false;
    els.action.textContent = "Fortsett";
    renderProgress();
  }

  function nextQuestion() {
    if (roundProgress >= ROUND_LENGTH) {
      roundProgress = 0;
      renderProgress();
    }
    const item = QuizLogic.pickNextVerb(items, boxes, lastKey, Math.random);
    current = { item, options: QuizLogic.buildOptions(items, item, Math.random) };
    selected = null;
    phase = "choose";
    renderPrompt(item);
    els.options.textContent = "";
    current.options.forEach((option, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option";
      btn.textContent = option.no;
      btn.addEventListener("click", () => select(i));
      els.options.appendChild(btn);
    });
    els.footer.classList.remove("good", "bad");
    els.feedback.hidden = true;
    els.action.textContent = "Sjekk";
    els.action.disabled = true;
  }

  function switchMode(name) {
    if (name === mode) return;
    mode = name;
    items = MODES[mode].items;
    boxes = read(MODES[mode].storageKey);
    lastKey = null;
    roundProgress = 0;
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch (e) { /* fortsett uten lagring */ }
    renderTabs();
    renderProgress();
    nextQuestion();
  }

  Object.keys(MODES).forEach(name => {
    els.tabs[name].addEventListener("click", () => switchMode(name));
  });
  els.action.addEventListener("click", () => {
    if (phase === "choose") check();
    else nextQuestion();
  });

  renderTabs();
  renderProgress();
  nextQuestion();
})();
