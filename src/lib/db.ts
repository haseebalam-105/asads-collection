import { MongoClient, Db } from "mongodb";

// Reused across hot-reloads in dev and across serverless invocations where
// possible. Requires MONGODB_URI in .env.local — see .env.example.

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "asads_collection";

declare global {
  // eslint-disable-next-line no-var
  var __MONGO_CLIENT_PROMISE__: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local — see .env.example."
    );
  }
  if (!globalThis.__MONGO_CLIENT_PROMISE__) {
    const client = new MongoClient(uri);
    globalThis.__MONGO_CLIENT_PROMISE__ = client.connect();
  }
  return globalThis.__MONGO_CLIENT_PROMISE__;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(dbName);
}

/** True if MONGODB_URI is configured — lets API routes fail gracefully with
 * a clear message instead of a stack trace when the DB isn't set up yet. */
export function isDbConfigured() {
  return Boolean(uri);
}
