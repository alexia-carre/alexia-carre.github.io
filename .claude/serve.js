// Minimal local server for previewing the site (zero dependencies).
// Usage: node .claude/serve.js  →  http://localhost:8080
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
};

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  let file = path.join(root, p);
  // Like GitHub Pages: /about also serves about.html
  if (!path.extname(file) && fs.existsSync(file + ".html")) file += ".html";
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { "Content-Type": types[".html"] });
    return fs.createReadStream(path.join(root, "404.html")).on("error", () => res.end("404")).pipe(res);
  }
  res.writeHead(200, { "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(8080, () => console.log("Preview: http://localhost:8080"));
