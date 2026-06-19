import https from "https";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const TOKEN = process.env.VERCEL_TOKEN || "vcp_7eularMoankzb3IW5V7h1rC5ejImzCyuaMZqhm9vXL5PAoX8wz1nI4Xt";
const ROOT = join(process.cwd(), "frontend", "dist");

async function api(method, path, body, raw) {
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
        try { resolve(raw ? { status: r.statusCode, body: data } : { status: r.statusCode, body: JSON.parse(data) }); }
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
    const full = join(dir, e.name);
    const rel = relative(root, full).replace(/\\/g, "/");
    if (e.isDirectory()) scan(full, root, files);
    else files.push(rel);
  }
  return files;
}

async function main() {
  console.log("TaskMN — Déploiement Vercel\n");

  const fileList = scan(ROOT, ROOT).map((f) => {
    const content = readFileSync(join(ROOT, f));
    const isText = [".html", ".js", ".css", ".json", ".svg", ".txt", ".xml"].some(e => f.endsWith(e));
    return {
      file: f,
      data: isText ? content.toString("utf-8") : content.toString("base64"),
      ...(isText ? {} : {}),
    };
  });

  console.log(`📄 ${fileList.length} fichiers\n`);

  // Use vercel.json from project root for config
  const vercelConfig = JSON.parse(readFileSync(join(process.cwd(), "vercel.json"), "utf-8"));

  const body = {
    name: "taskmn",
    files: fileList,
    framework: "vite",
    buildCommand: "cd frontend && npx vite build",
    outputDirectory: "frontend/dist",
    installCommand: "cd frontend && npm install",
    projectSettings: {
      framework: "vite",
    },
  };

  const deploy = await api("POST", "/v13/deployments", body);

  if (deploy.status !== 200 && deploy.status !== 201) {
    console.log("❌", deploy.status, deploy.body?.error?.message || JSON.stringify(deploy.body || "").slice(0, 300));
    process.exit(1);
  }

  const url = deploy.body.url;
  const uid = deploy.body.id || deploy.body.uid;
  console.log(`   URL: https://${url}`);
  console.log("\n⏳ Build...\n");

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 10000));
    const s = await api("GET", "/v13/deployments/" + uid);
    const state = s.body.readyState || s.body.state;
    console.log(`   [${i + 1}] ${state || "?"}`);
    if (state === "READY" || s.body.ready) {
      console.log(`\n✅  DÉPLOIEMENT RÉUSSI !`);
      console.log(`🌐  https://${url}`);
      process.exit(0);
    }
    if (state === "ERROR") {
      console.log(`\n❌ Build échoué`);
      console.log(`   ${s.body.errorMessage || JSON.stringify(s.body).slice(0, 300)}`);
      process.exit(1);
    }
  }
}

main().catch(console.error);
