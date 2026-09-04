// Swap ADMIN_PASSWORD_HASH in .env.local with a known test hash
import fs from "fs";
import bcrypt from "bcryptjs";

const ENV_PATH = "/home/z/my-project/.env.local";
const BACKUP_PATH = "/home/z/my-project/.env.local.backup";
const TEST_PASSWORD = "Test@12345";

// Read original
const original = fs.readFileSync(ENV_PATH, "utf8");
fs.writeFileSync(BACKUP_PATH, original);

// Generate hash
const hash = bcrypt.hashSync(TEST_PASSWORD, 10);
console.log("Generated hash:", hash);

// Replace the ADMIN_PASSWORD_HASH line
// IMPORTANT: escape $ as \$ because @next/env expands $VAR references
const escapedHash = hash.replace(/\$/g, "\\$");
const lines = original.split("\n");
const updated = lines.map(line => {
  if (line.startsWith("ADMIN_PASSWORD_HASH=")) {
    return `ADMIN_PASSWORD_HASH=${escapedHash}`;
  }
  return line;
}).join("\n");

fs.writeFileSync(ENV_PATH, updated);
console.log("Updated .env.local with escaped hash:", escapedHash);

// Verify by reading back and unescaping
const verify = fs.readFileSync(ENV_PATH, "utf8");
const match = verify.match(/^ADMIN_PASSWORD_HASH=(.+)$/m);
if (match) {
  const rawEnvValue = match[1].replace(/\\$/g, "$");
  console.log("Raw env value:", match[1]);
  console.log("Unescaped value:", rawEnvValue);
  const ok = bcrypt.compareSync(TEST_PASSWORD, rawEnvValue);
  console.log("bcrypt verify:", ok ? "✅ PASS" : "❌ FAIL");
}
