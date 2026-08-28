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
