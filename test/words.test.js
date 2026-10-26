const test = require("node:test");
const assert = require("node:assert");
const WORDS = require("../src/words.js");

test("100-140 gloser", () => {
  assert.ok(WORDS.length >= 100 && WORDS.length <= 140, "fikk " + WORDS.length);
});

test("alle gloser har gyldig kana og norsk betydning", () => {
  for (const w of WORDS) {
    assert.match(w.kana, /^[ぁ-んァ-ヶー]+$/, JSON.stringify(w));
    assert.ok(w.no.length > 0, JSON.stringify(w));
    assert.ok(!w.no.startsWith("å "), "verb havnet i gloselisten: " + JSON.stringify(w));
    assert.ok(w.kanji === null || typeof w.kanji === "string");
  }
});

test("unike nøkler (kanji|kana)", () => {
  const keys = WORDS.map(w => (w.kanji || "") + "|" + w.kana);
  assert.strictEqual(new Set(keys).size, WORDS.length);
});

test("unike norske betydninger", () => {
  const meanings = WORDS.map(w => w.no);
  const dupes = meanings.filter((m, i) => meanings.indexOf(m) !== i);
  assert.deepStrictEqual(dupes, [], "duplikater: " + dupes.join(", "));
});

test("ingen glose deler betydning med et verb", () => {
  const VERBS = require("../src/verbs.js");
  const verbMeanings = new Set(VERBS.map(v => v.no));
  for (const w of WORDS) {
    assert.ok(!verbMeanings.has(w.no), "kollisjon: " + w.no);
  }
});
