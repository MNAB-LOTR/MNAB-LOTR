import express, { Request, Response } from "express";
import path from "path";
import { createUser } from "./registration";
import { loginUser } from "./login";
import "./session";
import { check, validationResult } from "express-validator";
import session = require("express-session");
import { flashMiddleware } from "./middelware/flashMiddleware";
import {
  initBlacklist,
  addToBlacklist,
  getBlacklistedQuotes,
  getQuotesByCharacter,
} from "./blacklist";
import { initFavorites, addToFavorites, getFavoriteQuotes } from "./favorite";

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

app.get("/register", (req, res) => {
  var message = null;

  if (req.session && req.session.message) {
    message = req.session.message;
    delete req.session.message;
  }

  res.render("registration-page", {
    title: "Registratie",
    message: message,
  });
});

app.post("/register", (req, res) => {
  handleRegister(req, res);
});

app.get("/login", (req, res) => {
  const message = req.session?.message || null;

  if (req.session) {
    delete req.session.message;
  }

  res.render("login-page", { title: "Login", message: message });
});

app.post("/login", async (req: Request, res: Response) => {
  await handleLogin(req, res);
});

async function handleRegister(req: Request, res: Response) {
  const { email, password, confirmPassword } = req.body;

  if (!email || !password || !confirmPassword) {
    return res.render("registration-page", {
      title: "Registratie",
      error: "Vul alle velden in.",
    });
  }

  if (password !== confirmPassword) {
    return res.render("registration-page", {
      title: "Registratie",
      error: "Wachtwoorden komen niet overeen.",
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

    return res.render("registration-page", {
      title: "Registratie",
      error: "Er ging iets mis bij registratie.",
    });
  }
}

async function handleLogin(req: Request, res: Response) {
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
}

app.get("/favorites", async (req: Request, res: Response) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.redirect("/login");
  }

  try {
    const favoriteEntries = await getFavoriteQuotes(userId);
    const message =
      typeof req.query.message === "string" ? req.query.message : null;

    res.render("favorite-page", {
      title: "Favorites",
      favoriteEntries: favoriteEntries,
      message: message,
    });
  } catch (error) {
    console.error("Error fetching favorite quotes:", error);
    res.status(500).send("Server error");
  }
});

app.post("/api/favorites", async function (req: Request, res: Response) {
  const userId = req.session.userId;
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

app.get("/blacklist", async function (req, res) {
  const userId = req.session.userId;

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

app.post("/api/blacklist", function (req, res) {
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

app.listen(port, () => {
  console.log(`Server gestart op http://localhost:${port}`);
});
