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
  let selected = null;
  let phase = "choose"; // "choose" | "feedback"

  const els = {
    progress: document.getElementById("progress"),
    progressBar: document.getElementById("progress-bar"),
    badge: document.getElementById("badge"),
    prompt: document.getElementById("prompt"),
    options: document.getElementById("options"),
    footer: document.getElementById("footer"),
    feedback: document.getElementById("feedback"),
    feedbackTitle: document.getElementById("feedback-title"),
    feedbackText: document.getElementById("feedback-text"),
    action: document.getElementById("action"),
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
    const key = QuizLogic.verbKey(current.verb);
    const correct = current.options[selected] === current.verb;
    boxes[key] = QuizLogic.updateBox(boxes[key] || 0, correct);
    saveBoxes(boxes);
    lastKey = key;
    Array.from(els.options.children).forEach((btn, i) => {
      btn.disabled = true;
      btn.classList.remove("selected");
      if (current.options[i] === current.verb) btn.classList.add("reveal-correct");
      else if (i === selected) btn.classList.add("reveal-wrong");
    });
    els.footer.classList.add(correct ? "good" : "bad");
    els.feedbackTitle.textContent = correct ? "Riktig!" : "Feil!";
    els.feedbackText.textContent = correct ? "" : "Riktig svar: " + current.verb.no;
    els.feedbackText.hidden = correct;
    els.feedback.hidden = false;
    els.action.textContent = "Fortsett";
    renderProgress();
  }

  function nextQuestion() {
    const verb = QuizLogic.pickNextVerb(VERBS, boxes, lastKey, Math.random);
    current = { verb, options: QuizLogic.buildOptions(VERBS, verb, Math.random) };
    selected = null;
    phase = "choose";
    els.badge.hidden = QuizLogic.verbKey(verb) in boxes;
    renderPrompt(verb);
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

  els.action.addEventListener("click", () => {
    if (phase === "choose") check();
    else nextQuestion();
  });
  renderProgress();
  nextQuestion();
})();
