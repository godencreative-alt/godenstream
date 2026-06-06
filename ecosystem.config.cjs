const fs = require("fs");
const path = require("path");

function loadEnv(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    env[key] = value;
  }
  return env;
}

const root = __dirname;

module.exports = {
  apps: [
    {
      name: "godenstream",
      script: path.join(root, ".next/standalone/server.js"),
      cwd: path.join(root, ".next/standalone"),
      instances: 1,
      exec_mode: "fork",
      env: {
        ...loadEnv(path.join(root, ".env")),
        NODE_ENV: "production",
        HOSTNAME: "127.0.0.1",
        PORT: "3001",
      },
    },
  ],
};
