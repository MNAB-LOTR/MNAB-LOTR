import express, { Request, Response } from "express";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const MONGO_URI =
  "mongodb+srv://amelie_bontemps:Am3Lo678@clusterlotr.ym74pn1.mongodb.net/";
const DB_NAME = "MNAB-LOTR";
const COLLECTION_NAME = "users";

let usersCollection: any;
const router = express.Router();

async function connect() {
  if (!usersCollection) {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    usersCollection = db.collection(COLLECTION_NAME);
    console.log("Verbonden met MongoDB users-collectie");
  }
}

export async function createUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  await connect();

  const existing = await usersCollection.findOne({ email });
  if (existing) {
    throw new Error("Gebruiker bestaat al");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await usersCollection.insertOne({
    email,
    password: hashedPassword,
  });

  return result;
}

router.get("/register", (req, res) => {
  var message = null;

  if (req.session && req.session.message) {
    message = req.session.message;
    delete req.session.message;
  }

  return res.render("registration-page", {
    title: "Registratie",
    error: null,
    message: message,
  });
});

router.post("/register", async (req: Request, res: Response) => {
  const { email, password, confirmPassword } = req.body;

  if (!email || !password || !confirmPassword) {
    return res.render("registration-page", {
      title: "Registratie",
      error: "Vul alle velden in.",
      message: null,
    });
  }

  if (password !== confirmPassword) {
    return res.render("registration-page", {
      title: "Registratie",
      error: "Wachtwoorden komen niet overeen.",
      message: null,
    });
  }

  try {
    await createUser({ email, password });

    req.session.message = {
      type: "success",
      content: "Registratie succesvol. Je kunt nu inloggen.",
    };

    return res.redirect("/login");
  } catch (error: any) {
    console.error("Error tijdens registratie:", error.message);

    let errorMsg = "Er ging iets mis bij registratie.";
    if (
      error.message.includes("E11000") ||
      error.message.toLowerCase().includes("bestaat al") ||
      error.message.toLowerCase().includes("already")
    ) {
      errorMsg = "Gebruiker bestaat al.";
    }

    return res.render("registration-page", {
      title: "Registratie",
      error: errorMsg,
      message: null,
    });
  }
});

export default router;
