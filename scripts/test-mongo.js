// Quick MongoDB connectivity test
const { MongoClient } = require("mongodb");
require("dotenv").config({ path: "/home/z/my-project/lll/.env.local" });

const uri = process.env.MONGODB_URI;
console.log("Testing MongoDB connection...");
console.log("URI (redacted):", uri ? uri.replace(/:[^@]+@/, ":***@") : "NOT SET");

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 8000,
  connectTimeoutMS: 8000,
});

(async () => {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    const db = client.db(process.env.MONGODB_DB || "asads_collection");
    const cats = await db.collection("categories").countDocuments();
    const prods = await db.collection("products").countDocuments();
    console.log(`✅ categories: ${cats}, products: ${prods}`);
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
})();
