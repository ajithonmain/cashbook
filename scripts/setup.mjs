#!/usr/bin/env node
// One-command deploy of CashBook to the caller's own Cloudflare account.
// Usage: npm run setup [-- --name my-cashbook] [--no-sync]
// Requires: `npx wrangler login` already completed by the account owner.

import { execFileSync, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};

const PROJECT = opt("name", "cashbook");
const DB_NAME = opt("db", PROJECT);
const WRANGLER = ["wrangler"];

function wr(cmdArgs, { input, allowFail = false } = {}) {
  const res = spawnSync("npx", ["--no-install", ...WRANGLER, ...cmdArgs], {
    encoding: "utf8",
    input,
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (res.status !== 0 && !allowFail) {
    console.error(res.stdout);
    console.error(res.stderr);
    throw new Error(`wrangler ${cmdArgs.join(" ")} failed`);
  }
  return { ok: res.status === 0, out: `${res.stdout}\n${res.stderr}` };
}

function step(msg) {
  console.log(`\n==> ${msg}`);
}

step("Checking Cloudflare login");
const who = wr(["whoami"], { allowFail: true });
if (!who.ok || /not authenticated/i.test(who.out)) {
  console.error("Not logged in to Cloudflare. Run `npx wrangler login` (needs a browser), then re-run `npm run setup`.");
  process.exit(1);
}

step(`Ensuring D1 database "${DB_NAME}"`);
let dbId;
const list = wr(["d1", "list", "--json"], { allowFail: true });
if (list.ok) {
  try {
    const json = JSON.parse(list.out.slice(list.out.indexOf("[")));
    dbId = json.find((d) => d.name === DB_NAME)?.uuid;
  } catch {
    // fall through to create
  }
}
if (!dbId) {
  const created = wr(["d1", "create", DB_NAME]);
  dbId = created.out.match(/database_id\s*=\s*"([^"]+)"/)?.[1];
}
if (!dbId) {
  console.error("Could not determine D1 database id.");
  process.exit(1);
}

step("Writing wrangler.toml");
const toml = readFileSync("wrangler.toml", "utf8")
  .replace(/^name = ".*"$/m, `name = "${PROJECT}"`)
  .replace(/database_name = ".*"/, `database_name = "${DB_NAME}"`)
  .replace(/database_id = ".*"/, `database_id = "${dbId}"`);
writeFileSync("wrangler.toml", toml);

step("Applying database schema");
wr(["d1", "execute", DB_NAME, "--remote", "--file=./schema.sql", "--yes"]);

step(`Ensuring Pages project "${PROJECT}"`);
wr(["pages", "project", "create", PROJECT, "--production-branch=main"], { allowFail: true });

step("Building app");
execFileSync("npm", ["run", "build"], { stdio: "inherit" });

step("Deploying");
const deploy = wr(["pages", "deploy", "dist", `--project-name=${PROJECT}`, "--branch=main", "--commit-dirty=true"]);
const url = deploy.out.match(/https:\/\/[^\s]+\.pages\.dev/)?.[0] ?? `https://${PROJECT}.pages.dev`;

let token = "";
if (!flag("no-sync")) {
  step("Setting sync token secret");
  token = process.env.CASHBOOK_TOKEN || randomBytes(24).toString("hex");
  wr(["pages", "secret", "put", "CASHBOOK_TOKEN", `--project-name=${PROJECT}`], { input: token });
  // Secrets apply to new deployments only.
  wr(["pages", "deploy", "dist", `--project-name=${PROJECT}`, "--branch=main", "--commit-dirty=true"]);
}

console.log("\n----------------------------------------");
console.log(`CashBook is live: ${url}`);
if (token) {
  console.log(`Sync token (paste into Settings > Sync token on each device):\n  ${token}`);
  console.log("Store it in a password manager. Re-run with CASHBOOK_TOKEN=<value> to keep the same token.");
} else {
  console.log("Sync disabled (--no-sync). App runs fully on-device.");
}
console.log("----------------------------------------");
