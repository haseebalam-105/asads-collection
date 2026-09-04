/**
 * Database cleanup — removes duplicate slugs so unique indexes can be created.
 * Keeps the newest document for each slug.
 */
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: "/home/z/my-project/.env.local" });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "asads_collection";

async function cleanup() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  const db = client.db(dbName);

  for (const collName of ["products", "categories"]) {
    const coll = db.collection(collName);
    const all = await coll.find({}).sort({ createdAt: -1 }).toArray();
    console.log(`\n${collName}: ${all.length} total documents`);

    const seenSlugs = new Set();
    const toDelete = [];
    for (const doc of all) {
      if (seenSlugs.has(doc.slug)) {
        toDelete.push(doc._id);
        console.log(`  duplicate: ${doc.slug} (_id: ${doc._id})`);
      } else {
        seenSlugs.add(doc.slug);
      }
    }

    if (toDelete.length > 0) {
      const res = await coll.deleteMany({ _id: { $in: toDelete } });
      console.log(`  deleted ${res.deletedCount} duplicates`);
    } else {
      console.log(`  no duplicates found`);
    }

    // Now create the unique index
    try {
      await coll.createIndex({ slug: 1 }, { unique: true });
      await coll.createIndex({ id: 1 }, { unique: true });
      console.log(`  ✅ unique indexes created on slug + id`);
    } catch (err) {
      console.log(`  ⚠️ index creation: ${err.message}`);
    }
  }

  // Also create categoryId index on products
  try {
    await db.collection("products").createIndex({ categoryId: 1 });
    console.log("\n✅ products.categoryId index created");
  } catch (err) {
    console.log(`\n⚠️ categoryId index: ${err.message}`);
  }

  // Print final state
  const products = await db.collection("products").find({}, { projection: { slug: 1, name: 1 } }).toArray();
  const categories = await db.collection("categories").find({}, { projection: { slug: 1, name: 1 } }).toArray();
  console.log(`\nFinal state: ${products.length} products, ${categories.length} categories`);
  console.log("Products:", products.map(p => p.slug));
  console.log("Categories:", categories.map(c => c.slug));

  await client.close();
}

cleanup().catch(console.error);
