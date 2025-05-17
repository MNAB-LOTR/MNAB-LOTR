import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import { error } from 'console';

const MONGO_URI = "mongodb+srv://amelie_bontemps:Am3Lo678@clusterlotr.ym74pn1.mongodb.net/";
const DB_NAME = "MNAB-LOTR"; 
const COLLECTION_NAME = "users";

interface UserInput {
  email: string;
  password: string;
}

const client = new MongoClient(MONGO_URI);
let db: any;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(DB_NAME);
    console.log('Verbonden met MongoDB');
  }
  return db;
}

export async function createUser({ email, password }: UserInput): Promise<void> {
  const db = await connectDB();
  const users = db.collection(COLLECTION_NAME);

  const existingUser = await users.findOne({ email });
  if (existingUser) {
    throw new Error("Gebruiker bestaat al."); // Toont aan dat de gebruiker al bestaat al
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await users.insertOne({
    email,
    password: hashedPassword,
    createdAt: new Date(),
  });

  console.log('Gebruiker succesvol aangemaakt');
}
