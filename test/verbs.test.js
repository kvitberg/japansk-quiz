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
