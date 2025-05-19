import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const MONGO_URI = "mongodb+srv://amelie_bontemps:Am3Lo678@clusterlotr.ym74pn1.mongodb.net/";
const DB_NAME = "MNAB-LOTR";
const COLLECTION_NAME = "users";

let usersCollection: any;

async function connect() {
  if (!usersCollection) {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    usersCollection = db.collection(COLLECTION_NAME);
    console.log("✅ Verbonden met MongoDB users-collectie");
  }
}

export async function createUser({ email, password }: { email: string; password: string }) {
  await connect();

  const existing = await usersCollection.findOne({ email });
  if (existing) {
    throw new Error("Gebruiker bestaat al");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await usersCollection.insertOne({ email, password: hashedPassword });

  return result;
}
