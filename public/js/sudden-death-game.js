document.addEventListener("DOMContentLoaded", async () => {
  const quoteElement = document.getElementById("quote");
  const characterButtons = document.querySelectorAll(".character-btn");
  const movieButtons = document.querySelectorAll(".movie-btn");
  const submitButton = document.getElementById("submit");
  const questionNumberElement = document.getElementById("question-number");
  const scoreElement = document.getElementById("score");
  const likeButton = document.getElementById("like-btn");
  const dislikeButton = document.getElementById("dislike-btn");
  const modal = document.getElementById("reasonModal");
  const reasonInput = document.getElementById("reasonInput");
  const submitReasonBtn = document.getElementById("submitReasonBtn");
  const cancelReasonBtn = document.getElementById("cancelReasonBtn");

  let currentQuestionIndex = 0;
  let score = 0;
  let selectedCharacter = null;
  let selectedMovie = null;
  let questions = [];

  const API_KEY = "D0O13tGGVgcrpwoe7ZnA";

  async function fetchData() {
    try {
      const headers = { Authorization: `Bearer ${API_KEY}` };

      const quotesResponse = await fetch("https://the-one-api.dev/v2/quote", {
        headers,
      });
      const quotesData = await quotesResponse.json();

      if (!quotesData || !Array.isArray(quotesData.docs)) {
        throw new Error("Invalid data format for quotes");
      }

      const charactersResponse = await fetch(
        "https://the-one-api.dev/v2/character",
        { headers }
      );
      const charactersData = await charactersResponse.json();

      if (!charactersData || !Array.isArray(charactersData.docs)) {
        throw new Error("Invalid data format for characters");
      }

      const moviesResponse = await fetch("https://the-one-api.dev/v2/movie", {
        headers,
      });
      const moviesData = await moviesResponse.json();

      if (!moviesData || !Array.isArray(moviesData.docs)) {
        throw new Error("Invalid data format for movies");
      }

      questions = generateQuestions(quotesData, charactersData, moviesData);
      loadQuestion();
    } catch (error) {
      console.error("Error fetching data from API:", error);
    }
  }

  function generateQuestions(quotesData, charactersData, moviesData) {
    const shuffledQuotes = shuffleArray(quotesData.docs);

    return shuffledQuotes.slice(0, 10).map((quote) => {
      const correctCharacter = charactersData.docs.find(
        (character) => character._id === quote.character
      );
      const correctMovie = moviesData.docs.find(
        (movie) => movie._id === quote.movie
      );

      const shuffledCharacters = shuffleArray(charactersData.docs);
      const shuffledMovies = shuffleArray(moviesData.docs);

      return {
        quote: quote.dialog,
        correctCharacter: correctCharacter ? correctCharacter.name : null,
        correctMovie: correctMovie ? correctMovie.name : null,
        options: {
          characters: shuffledCharacters.slice(0, 3).map((c) => c.name),
          movies: shuffledMovies.slice(0, 3).map((m) => m.name),
        },
      };
    });
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function loadQuestion() {
    if (currentQuestionIndex >= 10) {
      endGame();
      return;
    }

    likeButton.style.color = "black";

    const question = questions[currentQuestionIndex];
    quoteElement.textContent = `"${question.quote}"`;

    characterButtons.forEach((button, index) => {
      button.textContent = question.options.characters[index] || "N/A";
      button.classList.remove("selected");
      button.onclick = () => {
        selectedCharacter = selectButton(
          characterButtons,
          selectedCharacter,
          button.textContent
        );
      };
    });

    movieButtons.forEach((button, index) => {
      button.textContent = question.options.movies[index] || "N/A";
      button.classList.remove("selected");
      button.onclick = () => {
        selectedMovie = selectButton(
          movieButtons,
          selectedMovie,
          button.textContent
        );
      };
    });
    questionNumberElement.textContent = currentQuestionIndex + 1;
  }

  dislikeButton.addEventListener("click", function () {
    modal.style.display = "flex";
    reasonInput.value = "";
  });

  const userId = localStorage.getItem("userId");

  submitReasonBtn.onclick = function () {
    const reason = reasonInput.value.trim();
    if (!reason) {
      alert(
        "Geef een reden op waarom je de quote op de zwarte lijst wilt zetten."
      );
      return;
    }

    const question = questions[currentQuestionIndex];
    const quoteText = question.quote;
    const character = question.correctCharacter;

    fetch("/api/blacklist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        character: character,
        quote: quoteText,
        reason: reason,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          modal.style.display = "none";
          currentQuestionIndex++;
          loadQuestion();
        } else {
          alert("Fout bij blacklisten");
        }
      })
      .catch((error) => {
        console.error(error);
        alert("Fout bij blacklisten");
        modal.style.display = "none";
      });
  };

  cancelReasonBtn.onclick = function () {
    modal.style.display = "none";
  };

  likeButton.addEventListener("click", function () {
    if (likeButton.style.color === "black" || likeButton.style.color === "") {
      likeButton.style.color = "red";
    }

    var question = questions[currentQuestionIndex];
    var quoteText = question.quote;
    var character = question.correctCharacter;

    fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        character: character,
        quote: quoteText,
      }),
    })
      .then(function (res) {
        if (!res.ok) {
          throw new Error("Server returned status " + res.status);
        }
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Expected JSON but got " + contentType);
        }
        return res.json();
      })
      .then(function (data) {
        if (!data.message) {
          alert("Fout bij toevoegen aan favorieten.");
        }
      })
      .catch(function (error) {
        console.error("Fetch error:", error);
        alert("Fout bij toevoegen aan favorieten.");
      });
  });

  function selectButton(buttons, selectedValue, newValue) {
    buttons.forEach((btn) => btn.classList.remove("selected"));
    if (selectedValue !== newValue) {
      selectedValue = newValue;
      buttons.forEach((btn) => {
        if (btn.textContent === newValue) {
          btn.classList.add("selected");
        }
      });
    }
    return selectedValue;
  }

  submitButton.addEventListener("click", function () {
    if (!selectedCharacter || !selectedMovie) {
      alert("Kies een personage en een film!");
      return;
    }

    const question = questions[currentQuestionIndex];

    if (
      selectedCharacter !== question.correctCharacter ||
      selectedMovie !== question.correctMovie
    ) {
      endGame();
      return;
    }

    let points = 0;
    if (selectedCharacter === question.correctCharacter) points += 0.5;
    if (selectedMovie === question.correctMovie) points += 0.5;
    score += points;

    scoreElement.textContent = score;
    selectedCharacter = null;
    selectedMovie = null;
    currentQuestionIndex++;
    loadQuestion();
  });

  function endGame() {
    const gameResult = document.querySelector(".game-result");
    const finalScoreElement = document.querySelector(".final-score");

    finalScoreElement.innerHTML = `Game over!<br> Je eindscore is ${score} van de 10.`;

    gameResult.style.display = "block";

    document.querySelector(".quiz-container").style.display = "none";

    document
      .querySelector(".restart-btn")
      .addEventListener("click", function () {
        location.reload();
      });
  }

  await fetchData();
});
