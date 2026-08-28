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
