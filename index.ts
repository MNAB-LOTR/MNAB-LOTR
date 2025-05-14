import express, { Request, Response } from "express";
import path from "path";
import { createUser } from "./registration";
import { loginUser } from "./login";
import { check, validationResult } from "express-validator";
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req: Request, res: Response) => {
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

app.get("/login", (req: Request, res: Response) => {
  res.render("login-page", { title: "Login" });
});

app.get("/register", (req: Request, res: Response) => {
  res.render("registration-page", { title: "Registratie" });
});

app.post("/register", (req: Request, res: Response) => {
  handleRegister(req, res);
});

app.post("/login", (req: Request, res: Response) => {
  handleLogin(req, res);
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
    return res.redirect("/login");
  } catch (error: any) {
    console.error("❌ Error tijdens registratie:", error.message);
    return res.render("registration-page", {
      title: "Registratie",
      error: error.message || "Er ging iets mis bij registratie.",
    });
  }
}

async function handleLogin(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Vul alle velden in.");
  }

  try {
    const success = await loginUser(email, password);
    if (success) {
      return res.redirect("/home");
    } else {
      return res.status(401).send("Ongeldige inloggegevens.");
    }
  } catch (error: any) {
    console.error("❌ Login fout:", error.message);
    return res.status(401).send(error.message);
  }
}

app.get("/favorites", (req: Request, res: Response) => {
  res.render("favorite-page", { title: "Favorieten" });
});

app.get("/blacklist", (req: Request, res: Response) => {
  res.render("blacklist-page", { title: "Blacklist" });
});

app.get("/home", (req: Request, res: Response) => {
  res.render("home", { title: "Home" });
});

app.get("/quiz-selection", (req: Request, res: Response) => {
  res.render("quiz-selection", { title: "Quiz selectie" });
});

app.get("/sudden-death", (req: Request, res: Response) => {
  res.render("sudden-death", { title: "Sudden Death" });
});

app.get("/ten-rounds", (req: Request, res: Response) => {
  res.render("ten-rounds", { title: "Ten Rounds" });
});

app.listen(port, () => {
  console.log(`✅ Server gestart op http://localhost:${port}`);
});
