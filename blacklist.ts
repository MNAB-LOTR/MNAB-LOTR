import { MongoClient, Collection } from "mongodb";

const uri =
  "mongodb+srv://nailadhaim:eah6oI9VDuvliRhh@clusterlotr.ym74pn1.mongodb.net/";
const client = new MongoClient(uri);
let blacklistCollection: Collection;
const DB_NAME = "MNAB-LOTR";

async function connectToMongo() {
  if (!blacklistCollection) {
    await client.connect();
    const db = client.db(DB_NAME);
    blacklistCollection = db.collection("blacklist");
  }
}

export async function initBlacklist() {
  await connectToMongo();
}

export async function addToBlacklist(
  userId: string,
  quote: string,
  reason: string
) {
  await connectToMongo();
  const result = await blacklistCollection.insertOne({ userId, quote, reason });
  return result;
}

export async function getBlacklistedQuotes(
  userId: string
): Promise<{ quote: string; reason: string }[]> {
  await connectToMongo();
  const entries = await blacklistCollection.find({ userId }).toArray();
  return entries.map((entry) => ({
    quote: entry.quote,
    reason: entry.reason,
  }));
}
