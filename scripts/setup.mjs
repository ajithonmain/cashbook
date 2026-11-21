#!/usr/bin/env node
// Deploys CashBook (app + API + database) to the caller's own Cloudflare account.
//
//   npm run setup                         invite-only signup (default), prints an invite code
//   npm run setup -- --name my-ledger     choose the Pages project / database name
//   npm run setup -- --open-signup        anyone with the URL may create an account
//   npm run setup -- --close-signup       nobody new may register (existing users unaffected)
//   INVITE_CODE=<value> npm run setup     keep a specific invite code instead of generating one
//
// Requires `npx wrangler login` to have been completed by the account owner.
// Safe to re-run: it reuses the existing D1 database and Pages project.

import { execFileSync, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : d;
};

const PROJECT = opt("name", "cashbook");
const DB_NAME = opt("db", PROJECT);

if (!/^[a-z0-9][a-z0-9-]{0,56}$/.test(PROJECT)) {
  console.error("--name must be lowercase letters, digits and dashes (for example my-cashbook).");
  process.exit(1);
}
if (flag("open-signup") && flag("close-signup")) {
  console.error("Choose either --open-signup or --close-signup, not both.");
  process.exit(1);
}

function wr(cmdArgs, { input, allowFail = false } = {}) {
  const res = spawnSync("npx", ["--no-install", "wrangler", ...cmdArgs], {
    encoding: "utf8",
    input,
    stdio: ["pipe", "pipe", "pipe"],
  });
  const out = `${res.stdout}\n${res.stderr}`;
  if (res.status !== 0 && !allowFail) {
    console.error(out);
    throw new Error(`wrangler ${cmdArgs.join(" ")} failed`);
  }
  return { ok: res.status === 0, out };
}

const step = (msg) => console.log(`\n==> ${msg}`);
const putSecret = (name, value) => wr(["pages", "secret", "put", name, `--project-name=${PROJECT}`], { input: value });
const deleteSecret = (name) =>
  wr(["pages", "secret", "delete", name, `--project-name=${PROJECT}`], { input: "y\n", allowFail: true });

step("Checking Cloudflare login");
const who = wr(["whoami"], { allowFail: true });
if (!who.ok || /not authenticated/i.test(who.out)) {
  console.error("Not logged in to Cloudflare. Run `npx wrangler login` (it opens a browser), then run `npm run setup` again.");
  process.exit(1);
}

step(`Ensuring D1 database "${DB_NAME}"`);
let dbId;
const list = wr(["d1", "list", "--json"], { allowFail: true });
if (list.ok) {
  try {
    dbId = JSON.parse(list.out.slice(list.out.indexOf("["))).find((d) => d.name === DB_NAME)?.uuid;
  } catch {
    // fall through to create
  }
}
if (!dbId) dbId = wr(["d1", "create", DB_NAME]).out.match(/database_id\s*=\s*"([^"]+)"/)?.[1];
if (!dbId) {
  console.error("Could not determine the D1 database id.");
  process.exit(1);
}

step("Writing wrangler.toml");
writeFileSync(
  "wrangler.toml",
  readFileSync("wrangler.toml", "utf8")
    .replace(/^name = ".*"$/m, `name = "${PROJECT}"`)
    .replace(/database_name = ".*"/, `database_name = "${DB_NAME}"`)
    .replace(/database_id = ".*"/, `database_id = "${dbId}"`)
);

step("Applying database migrations");
wr(["d1", "migrations", "apply", DB_NAME, "--remote"], { input: "y\n" });

step(`Ensuring Pages project "${PROJECT}"`);
wr(["pages", "project", "create", PROJECT, "--production-branch=main"], { allowFail: true });

step("Building app");
execFileSync("npm", ["run", "build"], { stdio: "inherit" });

const deploy = () =>
  wr(["pages", "deploy", "dist", `--project-name=${PROJECT}`, "--branch=main", "--commit-dirty=true"]);

step("Deploying");
deploy();

step("Configuring sign-up");
let invite = "";
let signup;
if (flag("open-signup")) {
  putSecret("ALLOW_SIGNUP", "true");
  deleteSecret("INVITE_CODE");
  signup = "open";
} else if (flag("close-signup")) {
  deleteSecret("ALLOW_SIGNUP");
  deleteSecret("INVITE_CODE");
  signup = "closed";
} else {
  invite = process.env.INVITE_CODE || randomBytes(12).toString("base64url");
  putSecret("INVITE_CODE", invite);
  deleteSecret("ALLOW_SIGNUP");
  signup = "invite";
}

// Secrets only apply to new deployments.
step("Redeploying with settings");
const final = deploy();
const url = final.out.match(/https:\/\/[^\s]+\.pages\.dev/)?.[0] ?? `https://${PROJECT}.pages.dev`;

console.log("\n----------------------------------------");
console.log(`CashBook is live: ${url}`);
if (signup === "invite") {
  console.log(`Invite code: ${invite}`);
  console.log("Open the app > Settings > Create an account, and enter the invite code.");
  console.log("Share the code only with people you want to allow. Re-run with --close-signup when everyone has joined.");
} else if (signup === "open") {
  console.log("Sign-up is OPEN: anyone who finds the URL can create an account.");
} else {
  console.log("Sign-up is CLOSED. Existing accounts keep working.");
}
console.log("----------------------------------------");
