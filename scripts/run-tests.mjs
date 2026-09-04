// Standalone test runner — loads env, swaps admin password, runs tests
import fs from "fs";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { spawn } from "child_process";

const ENV_PATH = "/home/z/my-project/.env.local";
const BACKUP_PATH = "/home/z/my-project/.env.local.backup";
const TEST_PASSWORD = "Test@12345";

// Read and parse env (handle \r\n line endings)
const envContent = fs.readFileSync(ENV_PATH, "utf8");
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2].replace(/\\$/g, "$").trim();
  }
}
console.log("MONGODB_URI:", env.MONGODB_URI ? `${env.MONGODB_URI.slice(0, 30)}...` : "NOT SET");

// Backup original env
fs.writeFileSync(BACKUP_PATH, envContent);

// Generate test hash and write it (escaped for @next/env)
const hash = bcrypt.hashSync(TEST_PASSWORD, 10);
const escapedHash = hash.replace(/\$/g, "\\$");
const updated = envContent.split("\n").map(l =>
  l.startsWith("ADMIN_PASSWORD_HASH=") ? `ADMIN_PASSWORD_HASH=${escapedHash}` : l
).join("\n");
fs.writeFileSync(ENV_PATH, updated);
console.log("Admin password set to test value");

// Clean up leftover test data
const client = new MongoClient(env.MONGODB_URI);
await client.connect();
const db = client.db(env.MONGODB_DB || "asads_collection");
await db.collection("categories").deleteMany({ slug: /test-cat-|^e2e-test-|^e2e-|^bad-prod-|^no-name-|^orphan-/ });
await db.collection("products").deleteMany({ slug: /^e2e-|^bad-prod-|^no-name-|^orphan-/ });
await db.collection("orders").deleteMany({ "customer.phone": { $in: ["0300-1234567", "0300-9999999"] } });
console.log("cleaned up leftover test data");
await client.close();

// Start dev server
const dev = spawn("node", ["node_modules/next/dist/bin/next", "dev", "-p", "3000"], {
  cwd: "/home/z/my-project",
  stdio: "ignore",
  detached: true,
  env: { ...process.env, ...env },
});
dev.unref();

// Wait for server
console.log("waiting for dev server...");
await new Promise((r) => setTimeout(r, 12000));

// Test home
const res = await fetch("http://127.0.0.1:3000/");
console.log("home:", res.status);

// Run the test suite
const test = spawn("node", ["/home/z/my-project/scripts/comprehensive-test.mjs"], {
  cwd: "/home/z/my-project",
  stdio: "inherit",
  env: { ...process.env, ...env, MONGODB_DB: env.MONGODB_DB || "asads_collection" },
});

test.on("close", (code) => {
  // Restore original env
  fs.copyFileSync(BACKUP_PATH, ENV_PATH);
  fs.unlinkSync(BACKUP_PATH);
  try { process.kill(-dev.pid); } catch {}
  process.exit(code || 0);
});
