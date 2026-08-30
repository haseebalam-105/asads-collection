// Usage: node scripts/hash-password.mjs "YourStrongPassword123"
// Copy the printed hash into ADMIN_PASSWORD_HASH in .env.local


import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "YourPassword"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log("\nAdd this to your .env.local:\n");
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
