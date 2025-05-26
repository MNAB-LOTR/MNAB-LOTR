import express, { Request, Response } from "express";
import { MongoClient, Collection } from "mongodb";
import dotenv from "dotenv";

dotenv.config(); 


const uri =  process.env.MONGODB_URI!;
const client = new MongoClient(uri);
let favoriteCollection: Collection;
const DB_NAME = process.env.MONGODB_DB!;
const router = express.Router();

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

export async function addToFavorites(
  userId: string,
  character: string,
  quote: string
) {
  await connectToMongo();

  const exists = await favoriteCollection.findOne({ userId, character, quote });
  if (exists) {
    return { acknowledged: false, message: "Quote already in favorites" };
  }

  const result = await favoriteCollection.insertOne({
    userId,
    character,
    quote,
  });
  return result;
}

export async function getFavoriteQuotes(
  userId: string
): Promise<{ quote: string; character: string }[]> {
  await connectToMongo();
  const entries = await favoriteCollection.find({ userId }).toArray();
  return entries.map((entry) => ({
    quote: entry.quote,
    character: entry.character,
  }));
}

export async function removeFromFavorites(
  userId: string,
  quote: string,
  character: string
) {
  await connectToMongo();
  const result = await favoriteCollection.deleteOne({
    userId,
    quote,
    character,
  });
  return result;
}

router.get("/favorites", async (req: Request, res: Response) => {
  const userId = req.session?.userId;

  if (!userId) {
    return res.redirect("/login");
  }

  try {
    const favoriteEntries = await getFavoriteQuotes(userId);
    const message =
      typeof req.query.message === "string" ? req.query.message : null;

    res.render("favorite-page", {
      title: "Favorites",
      favoriteEntries,
      message,
    });
  } catch (error) {
    console.error("Error fetching favorite quotes:", error);
    res.status(500).send("Server error");
  }
});

router.get("/favorites/download", async (req: Request, res: Response) => {
  const userId = req.session?.userId;

  if (!userId) {
    res.status(401).send("Not allowed: please login first.");
    return;
  }

  try {
    const favorites = await getFavoriteQuotes(userId);
    let text = "Character , Quote:\n";

    favorites.forEach((item) => {
      const character = item.character ?? "";
      const quote = item.quote ?? "";
      text += `- ${character}: "${quote}"\n`;
    });

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=favorites.txt");
    res.send(text);
  } catch (error) {
    console.error("Error generating text file:", error);
    res.status(500).send("Server error creating file.");
  }
});

router.delete("/favorites/delete", async (req: Request, res: Response) => {
  const userId = req.session?.userId;

  if (!userId) {
    res.status(401).send("Not allowed: please login first.");
    return;
  }

  const { quote, character } = req.body;

  if (!quote || !character) {
    res
      .status(400)
      .send("Missing parameters: quote and character are required.");
    return;
  }

  try {
    const result = await removeFromFavorites(userId, quote, character);

    if (result.deletedCount === 1) {
      res.status(200).send("Quote successfully removed.");
    } else {
      res.status(404).send("Quote not found.");
    }
  } catch (error) {
    console.error("Error removing quote:", error);
    res.status(500).send("Server error removing quote.");
  }
});

router.post("/api/favorites", async (req: Request, res: Response) => {
  const userId = req.session?.userId;
  const character = req.body.character;
  const quote = req.body.quote;

  if (!userId || !quote) {
    res.status(400).json({ error: "Missing userId or quote" });
    return;
  }

  try {
    const result = await addToFavorites(userId, character, quote);

    if ((result as any).acknowledged === false) {
      res.status(409).json({ message: "Quote already in favorites" });
    } else {
      res.json({ message: "Quote added to favorites" });
    }
  } catch (error) {
    console.error("Error adding to favorites:", error);
    res.status(500).json({ error: "Failed to add to favorites" });
  }
});

export default router;
