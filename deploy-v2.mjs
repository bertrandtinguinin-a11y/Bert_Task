import https from "https";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative, extname } from "path";

const TOKEN = process.env.VERCEL_TOKEN || "vcp_7eularMoankzb3IW5V7h1rC5ejImzCyuaMZqhm9vXL5PAoX8wz1nI4Xt";
const ROOT = process.cwd();
const IGNORE = ["node_modules", ".git", ".vscode", ".venv", "__pycache__", "*.pyc", "start.bat", "start.sh", "deploy-vercel.mjs", "deploy-v2.mjs", "readme.md", "README.md"];
const TEXT_EXTS = [".html", ".js", ".jsx", ".css", ".json", ".svg", ".xml", ".txt", ".md", ".yml", ".yaml", ".toml", ".env", ".sh", ".bat", ".py"];

async function api(method, path, body) {
  return new Promise((resolve) => {
    const opts = {
      hostname: "api.vercel.com",
      path,
      method,
      headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" },
    };
    const d = body ? JSON.stringify(body) : "";
    if (body) opts.headers["Content-Length"] = Buffer.byteLength(d);
    const req = https.request(opts, (r) => {
      let data = "";
      r.on("data", (c) => data += c);
      r.on("end", () => {
        try { resolve({ status: r.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: r.statusCode, body: data }); }
      });
    });
    req.on("error", (e) => resolve({ status: 0, body: { error: { message: e.message } } }));
    if (body) req.write(d);
    req.end();
  });
}

function scan(dir, root, files = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.includes(e.name)) continue;
    if (e.name.startsWith(".")) continue;
    const full = join(dir, e.name);
    const rel = relative(root, full).replace(/\\/g, "/");
    if (e.isDirectory()) scan(full, root, files);
    else {
      // Skip large files
      try { if (statSync(full).size > 1_000_000) continue; } catch { continue; }
      files.push(rel);
    }
  }
  return files;
}

async function main() {
  console.log("TaskMN — Déploiement Vercel v2 (source files)\n");

  const allFiles = scan(ROOT, ROOT);
  console.log(`📄 ${allFiles.length} fichiers source\n`);

  const fileList = allFiles.map((f) => {
    const content = readFileSync(join(ROOT, f));
    const ext = extname(f).toLowerCase();
    const isText = TEXT_EXTS.includes(ext);

    // For text files, we can try sending as plain text
    // For binary/non-text, use base64
    return {
      file: f,
      data: isText ? content.toString("utf-8") : content.toString("base64"),
    };
  });

  // Static site only - no build needed
  const body = {
    name: "taskmn",
    files: fileList,
    framework: "vite",
    buildCommand: "cd frontend && npx vite build",
    outputDirectory: "frontend/dist",
    installCommand: "cd frontend && npm install",
  };

  console.log("🚀 Déploiement...\n");
  const deploy = await api("POST", "/v13/deployments", body);

  if (deploy.status !== 200 && deploy.status !== 201) {
    console.log("❌", deploy.status, deploy.body?.error?.message || JSON.stringify(deploy.body || "").slice(0, 300));
    process.exit(1);
  }

  const url = deploy.body.url;
  const uid = deploy.body.id || deploy.body.uid;
  console.log(`   URL: https://${url}`);
  console.log("\n⏳ Build en cours...\n");

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 10000));
    const s = await api("GET", "/v13/deployments/" + uid);
    const state = s.body.readyState || s.body.state;
    console.log(`   [${i + 1}] ${state || "?"}`);

    if (state === "READY" || s.body.ready === true) {
      console.log(`\n✅  DÉPLOIEMENT RÉUSSI !`);
      console.log(`🌐  https://${url}`);
      console.log(`   Alias: https://taskmn.vercel.app`);
      process.exit(0);
    }
    if (state === "ERROR") {
      console.log(`\n❌ Build échoué`);
      console.log(`   ${s.body.errorMessage || ""}`);
      // Show build logs
      if (uid) {
        const logs = await api("GET", "/v1/deployments/" + uid + "/builds");
        console.log("\n📋 Logs:", JSON.stringify(logs.body).slice(0, 500));
      }
      process.exit(1);
    }
  }
  console.log("\n⏰ Timeout");
}

main().catch(console.error);
