import express, { Request, Response } from "express";
import path from "path";
import { createUser } from "./routes/registration";
import { loginUser } from "./routes/login";
import "./session";
import { check, validationResult } from "express-validator";
import session from "express-session";
import { flashMiddleware } from "./middelware/flashMiddleware";
import {
  initBlacklist,
  addToBlacklist,
  getBlacklistedQuotes,
  getQuotesByCharacter,
  removeFromBlacklist,
} from "./routes/blacklist";
import {
  initFavorites,
  addToFavorites,
  getFavoriteQuotes,
  removeFromFavorites,
} from "./routes/favorite";
import { updateBlacklistReason } from "./routes/blacklist";
import loginRouter from "./routes/login";
import registrationRouter from "./routes/registration";
import favoriteRouter from "./routes/favorite";
import blacklistRouter from "./routes/blacklist";

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);
app.use(loginRouter);
app.use(registrationRouter);
app.use(favoriteRouter);
app.use(blacklistRouter);

app.get("/", (req, res) => {
  const games = [
    {
      name: "Lord of the Rings",
      image: "/assets/images/LOTR.jpeg",
      description:
        "Een episch fantasyverhaal over de strijd tussen goed en kwaad in Midden-aarde.",
    },
    {
      name: "Fortnite",
      image: "/assets/images/Fortnite.jpeg",
      description:
        'Een "battle royale" game met constante updates en een creatieve bouwmodus.',
    },
    {
      name: "FIFA",
      image: "/assets/images/FIFA.jpeg",
      description:
        "Een populaire voetbalgame met realistische gameplay en jaarlijkse updates.",
    },
    {
      name: "Pokémon",
      image: "/assets/images/Pokémon.jpg",
      description:
        "Een wereldberoemde franchise met games, anime en kaartspellen waarin spelers Pokémon vangen.",
    },
    {
      name: "LEGO Masters",
      image: "/assets/images/legoMasters.jpg",
      description:
        "Een realityshow waarin deelnemers strijden om de beste LEGO-kunstwerken te maken.",
    },
    {
      name: "Magic: The Gathering",
      image: "/assets/images/MTG.jpg",
      description:
        "Een strategisch kaartspel met uitgebreide lore en miljoenen spelers wereldwijd.",
    },
  ];

  res.render("index", { title: "Landingspagina", games });
});

app.get("/debug-blacklist", async (req, res) => {
  const data = await getBlacklistedQuotes(
    req.session?.userId || "test@example.com"
  );
  res.json(data);
});

app.get("/home", (req, res) => {
  res.render("home", { title: "Home" });
});

app.get("/quiz-selection", (req, res) => {
  res.render("quiz-selection", { title: "Quiz selectie" });
});

app.get("/sudden-death", (req, res) => {
  res.render("sudden-death", { title: "Sudden Death" });
});

app.get("/ten-rounds", (req, res) => {
  res.render("ten-rounds", { title: "Ten Rounds" });
});

const handleUpdateReason = async (req: any, res: any) => {
  const userId = req.session?.userId as string;
  const { quote, character, reason } = req.body;

  if (!userId || !quote || !character || !reason) {
    return res.status(400).send("Verplichte velden ontbreken.");
  }

  try {
    const result = await updateBlacklistReason(
      userId,
      character,
      quote,
      reason
    );
    if (result.modifiedCount === 1) {
      res.send("Reden succesvol bijgewerkt.");
    } else {
      res.status(404).send("Item niet gevonden.");
    }
  } catch (err) {
    console.error("❌ Fout bij update:", err);
    res.status(500).send("Kon reden niet bijwerken.");
  }
};

app.put("/update-reason", handleUpdateReason);

app.listen(port, () => {
  console.log(`Server draait op http://localhost:${port}`);
});

export default app;
