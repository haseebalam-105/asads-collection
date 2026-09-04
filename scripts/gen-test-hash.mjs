// Generate bcrypt hash for the test password
import bcrypt from "bcryptjs";
import fs from "fs";

const TEST_PASSWORD = "Test@12345";
const hash = await bcrypt.hash(TEST_PASSWORD, 10);
console.log("Hash for", TEST_PASSWORD, ":", hash);

// Write to a temp file for the test runner to use
fs.writeFileSync("/tmp/test-admin-hash.txt", hash);
