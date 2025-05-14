import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const MONGO_URI = "mongodb+srv://mayasliman:vywdaq-pytJiz-6wecri@clusterlotr.ym74pn1.mongodb.net/";
const DB_NAME = "MNAB-LOTR"; 
const COLLECTION_NAME = "users";

const client = new MongoClient(MONGO_URI);
let db: any;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(DB_NAME);
  }
  return db;
}

export async function loginUser(email: string, password: string): Promise<boolean> {
  const db = await connectDB();
  const users = db.collection(COLLECTION_NAME);

  const user = await users.findOne({ email });
  if (!user) {
    throw new Error('Gebruiker niet gevonden');
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new Error('Wachtwoord is incorrect');
  }

  return true;
}
