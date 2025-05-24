import express, { Request, Response } from "express";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const router = express.Router();
const MONGO_URI =
  "mongodb+srv://mayasliman:vywdaq-pytJiz-6wecri@clusterlotr.ym74pn1.mongodb.net/";
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

export async function loginUser(
  email: string,
  password: string
): Promise<boolean> {
  const db = await connectDB();
  const users = db.collection(COLLECTION_NAME);

  const user = await users.findOne({ email });
  if (!user) {
    throw new Error("Gebruiker niet gevonden");
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new Error("Wachtwoord is incorrect");
  }

  return true;
}

router.get("/login", (req: Request, res: Response) => {
  const message = req.session?.message || null;

  if (req.session) {
    delete req.session.message;
  }

  res.render("login-page", { title: "Login", message });
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.session.message = {
      type: "error",
      content: "Vul alle velden in.",
    };
    return res.redirect("/login");
  }

  try {
    const success = await loginUser(email, password);
    if (success) {
      req.session.userId = email;
      return res.redirect("/home");
    } else {
      req.session.message = {
        type: "error",
        content: "Ongeldige inloggegevens.",
      };
      return res.redirect("/login");
    }
  } catch (error: any) {
    req.session.message = {
      type: "error",
      content: error.message || "Er ging iets mis bij inloggen.",
    };
    return res.redirect("/login");
  }
});

export default router;
