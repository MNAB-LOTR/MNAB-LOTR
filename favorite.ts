import { MongoClient, Collection } from "mongodb";

const uri =
  "mongodb+srv://nailadhaim:eah6oI9VDuvliRhh@clusterlotr.ym74pn1.mongodb.net/";
const client = new MongoClient(uri);
let favoriteCollection: Collection;
const DB_NAME = "MNAB-LOTR";

async function connectToMongo() {
  if (!favoriteCollection) {
    await client.connect();
    const db = client.db(DB_NAME);
    favoriteCollection = db.collection("favorites");
  }
}

export async function initFavorites() {
  await connectToMongo();
}

export async function addToFavorites(userId: string, quote: string) {
  await connectToMongo();

  const exists = await favoriteCollection.findOne({ userId, quote });
  if (exists) {
    return { acknowledged: false, message: "Quote already in favorites" };
  }

  const result = await favoriteCollection.insertOne({ userId, quote });
  return result;
}

export async function getFavoriteQuotes(userId: string): Promise<string[]> {
  await connectToMongo();
  const entries = await favoriteCollection.find({ userId }).toArray();
  return entries.map((entry) => entry.quote);
}

export async function removeFromFavorites(userId: string, quote: string) {
  await connectToMongo();
  const result = await favoriteCollection.deleteOne({ userId, quote });
  return result;
}
