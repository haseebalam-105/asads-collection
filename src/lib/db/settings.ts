import { getDb } from "@/lib/db";
import { siteSettings as defaultSettings } from "@/lib/settings";

export type SiteSettingsDoc = typeof defaultSettings;

const DOC_ID = "site";

export async function dbGetSettings(): Promise<SiteSettingsDoc> {
  const db = await getDb();
  const doc = await db
    .collection("settings")
    .findOne({ _key: DOC_ID }, { projection: { _id: 0, _key: 0 } });
  return { ...defaultSettings, ...(doc || {}) } as SiteSettingsDoc;
}

export async function dbUpdateSettings(updates: Partial<SiteSettingsDoc>): Promise<void> {
  const db = await getDb();
  await db
    .collection("settings")
    .updateOne({ _key: DOC_ID }, { $set: updates }, { upsert: true });
}
