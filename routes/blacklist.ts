import express, { Request, Response } from "express";
import { MongoClient, Collection } from "mongodb";
import dotenv from "dotenv";

dotenv.config(); 

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);
let blacklistCollection: Collection;
const DB_NAME = process.env.MONGODB_DB!;
const router = express.Router();

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

router.get("/blacklist", async function (req, res) {
  const userId = req.session.userId as string;

  if (!userId) {
    return res.redirect("/login");
  }

  try {
    const blacklistedQuotes = await getBlacklistedQuotes(userId);
    res.render("blacklist-page", {
      title: "Blacklist",
      blacklistedQuotes: blacklistedQuotes,
    });
  } catch (error) {
    console.log("Fout bij ophalen van blacklist:", error);
    res.status(500).send("Serverfout");
  }
});

router.get("/blacklist/download", async function (req: Request, res: Response) {
  const userId = req.session.userId;

  if (!userId) {
    res.status(401).send("Niet toegestaan: log eerst in.");
    return;
  }

  try {
    const blacklistEntries = await getBlacklistedQuotes(userId);

    let tekst = "Personage , Quote , Reden:\n";

    blacklistEntries.forEach((item) => {
      const personage = item.character ? item.character : "";
      const quote = item.quote ? item.quote : "";
      const reden = item.reason ? item.reason : "";
      tekst += `- ${personage}: "${quote}", Reden: "${reden}"\n`;
    });

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=blacklist.txt");
    res.send(tekst);
  } catch (error) {
    console.error("Fout bij het genereren van blacklist bestand:", error);
    res.status(500).send("Serverfout bij het aanmaken van het bestand.");
  }
});

router.delete(
  "/blacklist/delete",
  async function (req: Request, res: Response) {
    const userId = req.session?.userId;

    if (!userId) {
      res.status(401).send("Niet toegestaan: log eerst in.");
      return;
    }

    const { quote, character } = req.body;

    if (!quote || !character) {
      res
        .status(400)
        .send("Ontbrekende parameters: quote en character zijn vereist.");
      return;
    }

    try {
      const result = await removeFromBlacklist(userId, quote, character);

      if (result.deletedCount === 1) {
        res.status(200).send("Quote succesvol verwijderd uit blacklist.");
      } else {
        res.status(404).send("Quote niet gevonden in blacklist.");
      }
    } catch (error) {
      console.error("Fout bij verwijderen van quote uit blacklist:", error);
      res
        .status(500)
        .send("Serverfout bij verwijderen van quote uit blacklist.");
    }
  }
);

router.post("/api/blacklist", function (req, res) {
  const userId = req.session.userId;
  const { character, quote, reason } = req.body;

  console.log("userId:", userId);
  console.log("character:", character);
  console.log("quote:", quote);
  console.log("reason:", reason);

  if (!userId || !character || !quote || !reason) {
    res.status(400).json({ error: "Missing required fields." });
    return;
  }

  addToBlacklist(userId, character, quote, reason)
    .then(() => {
      res.json({ message: "Quote successfully added to blacklist." });
    })
    .catch((error) => {
      console.log("Error adding to blacklist:", error);
      res.status(500).json({ error: "Failed to add to blacklist." });
    });
});

export default router;
