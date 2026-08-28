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
