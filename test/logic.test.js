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
