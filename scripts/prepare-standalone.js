const fs = require("fs");
const path = require("path");

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");
const standaloneNextDir = path.join(standaloneDir, ".next");

function copyDir(source, target) {
  if (!fs.existsSync(source)) return;
  fs.rmSync(target, { force: true, recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

if (!fs.existsSync(standaloneDir)) {
  console.error("Missing .next/standalone. Run `npm run build` first.");
  process.exit(1);
}

fs.mkdirSync(standaloneNextDir, { recursive: true });
copyDir(path.join(root, ".next", "static"), path.join(standaloneNextDir, "static"));
copyDir(path.join(root, "public"), path.join(standaloneDir, "public"));

console.log("Standalone assets copied.");
