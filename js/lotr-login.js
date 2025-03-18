document.addEventListener("DOMContentLoaded", function() {
    const buttons = document.querySelectorAll("button");
    buttons.forEach(button => {
      button.addEventListener("click", function(event) {
        const gameName = this.parentElement.querySelector(".game-name").textContent;
        if (gameName === "Lord of the Rings") {
          window.location.href = "login-page.html";
        }
        else{
            alert("Je hebt geen toegang tot " + gameName);
        }
      });
    });
  });