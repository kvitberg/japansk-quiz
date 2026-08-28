const fs = require("node:fs");
let html = fs.readFileSync("index.html", "utf8");
html = html.replace(/^<!doctype html>\n/i, "");
html = html.replace(/<meta name="viewport"[^>]*>\n/, "");
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (tag, p) =>
  p.startsWith("http") ? tag : "<style>\n" + fs.readFileSync(p, "utf8") + "</style>");
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, p) =>
  "<script>\n" + fs.readFileSync(p, "utf8") + "</script>");
const rest = (html.match(/<link [^>]*href="([^"]+)"|<script src="([^"]+)"/g) || [])
  .filter(t => !t.includes("fonts.googleapis.com"));
if (rest.length > 0) throw new Error("uinlinede referanser igjen: " + rest.join(", "));
fs.mkdirSync("dist", { recursive: true });
fs.writeFileSync("dist/artifact.html", html);
console.log("Skrev dist/artifact.html (" + html.length + " tegn)");
