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
  character: string,
  quote: string,
  reason: string
) {
  await connectToMongo();
  const result = await blacklistCollection.insertOne({
    userId,
    character,
    quote,
    reason,
  });
  return result;
}

export async function getBlacklistedQuotes(
  userId: string
): Promise<{ quote: string; character: string; reason: string }[]> {
  await connectToMongo();
  const entries = await blacklistCollection.find({ userId }).toArray();
  return entries.map((entry) => ({
    quote: entry.quote,
    character: entry.character,
    reason: entry.reason,
  }));
}

export async function getQuotesByCharacter(
  userId: string,
  character: string
): Promise<{ quote: string; reason: string }[]> {
  await connectToMongo();
  const entries = await blacklistCollection
    .find({ userId, character })
    .toArray();
  return entries.map((entry) => ({
    quote: entry.quote,
    reason: entry.reason,
  }));
}

export async function removeFromBlacklist(
  userId: string,
  quote: string,
  character: string
) {
  await connectToMongo();
  const result = await blacklistCollection.deleteOne({
    userId,
    quote,
    character,
  });
  return result;
}


export async function updateBlacklistReason(
  userId: string,
  character: string,
  quote: string,
  newReason: string
) {
  await connectToMongo();
  return await blacklistCollection.updateOne(
    { userId, character, quote },
    { $set: { reason: newReason } }
  );
}
