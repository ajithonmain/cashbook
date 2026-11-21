#!/usr/bin/env node
// Owner-only maintenance for a deployed CashBook. Runs SQL against your remote D1 database
// through wrangler, so it needs the same `wrangler login` as `npm run setup`.
//
//   npm run admin -- list-users
//   npm run admin -- reset-password <email>        prints a new temporary password
//   npm run admin -- revoke-sessions <email>       signs the user out everywhere
//   npm run admin -- delete-user <email>           removes the user and all their data
//   add --local to act on the local development database instead

import { pbkdf2Sync, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const local = args.includes("--local");
const [command, emailArg] = args.filter((a) => !a.startsWith("--"));

const dbName = readFileSync("wrangler.toml", "utf8").match(/database_name = "([^"]+)"/)?.[1];
if (!dbName) {
  console.error("Could not read database_name from wrangler.toml");
  process.exit(1);
}

function sql(statement, json = false) {
  const res = spawnSync(
    "npx",
    ["--no-install", "wrangler", "d1", "execute", dbName, local ? "--local" : "--remote", "--command", statement, ...(json ? ["--json"] : [])],
    { encoding: "utf8" }
  );
  if (res.status !== 0) {
    console.error(res.stdout, res.stderr);
    process.exit(1);
  }
  return res.stdout;
}

const quote = (s) => `'${String(s).replace(/'/g, "''")}'`;
const normalize = (e) => String(e ?? "").trim().toLowerCase();

// Same format as server/lib/crypto.ts: pbkdf2-sha256$<iterations>$<salt b64>$<hash b64>
function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(password, salt, 100_000, 32, "sha256");
  return `pbkdf2-sha256$100000$${salt.toString("base64")}$${hash.toString("base64")}`;
}

function requireEmail() {
  const email = normalize(emailArg);
  if (!email.includes("@")) {
    console.error(`Usage: npm run admin -- ${command} <email>`);
    process.exit(1);
  }
  return email;
}

function userExists(email) {
  const out = JSON.parse(sql(`SELECT id FROM users WHERE email = ${quote(email)}`, true));
  return (out[0]?.results ?? []).length > 0;
}

switch (command) {
  case "list-users": {
    const out = JSON.parse(
      sql(
        "SELECT u.email, datetime(u.created_at/1000,'unixepoch') AS created, (SELECT COUNT(*) FROM sessions s WHERE s.user_id=u.id) AS devices, (SELECT COUNT(*) FROM books b WHERE b.user_id=u.id AND b.deleted=0) AS books FROM users u ORDER BY u.created_at",
        true
      )
    );
    console.table(out[0]?.results ?? []);
    break;
  }
  case "reset-password": {
    const email = requireEmail();
    if (!userExists(email)) {
      console.error("No such user.");
      process.exit(1);
    }
    const temp = randomBytes(9).toString("base64url");
    sql(`UPDATE users SET password_hash = ${quote(hashPassword(temp))} WHERE email = ${quote(email)}`);
    sql(`DELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE email = ${quote(email)})`);
    console.log(`Temporary password for ${email}: ${temp}`);
    console.log("Give it to the user and ask them to change it in Settings. All their devices were signed out.");
    break;
  }
  case "revoke-sessions": {
    const email = requireEmail();
    sql(`DELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE email = ${quote(email)})`);
    console.log(`Signed ${email} out of every device.`);
    break;
  }
  case "delete-user": {
    const email = requireEmail();
    if (!args.includes("--yes")) {
      console.error(`This permanently deletes ${email} and all their books and entries. Re-run with --yes to confirm.`);
      process.exit(1);
    }
    const who = `(SELECT id FROM users WHERE email = ${quote(email)})`;
    for (const table of ["transactions", "books", "sessions"]) sql(`DELETE FROM ${table} WHERE user_id = ${who}`);
    sql(`DELETE FROM users WHERE email = ${quote(email)}`);
    console.log(`Deleted ${email}.`);
    break;
  }
  default:
    console.error("Commands: list-users | reset-password <email> | revoke-sessions <email> | delete-user <email> --yes   (add --local for the dev database)");
    process.exit(1);
}
