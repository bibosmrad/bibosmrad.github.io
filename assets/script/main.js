let words = [];

document.addEventListener("DOMContentLoaded", async () => {
  await loadWords();

  initRestrictNonLetters();

  const form = document.querySelector("form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const values = getFormValues();
    // console.log(values);

    const finalWords = filterWords(
      values.correctLetters,
      values.misplacedRows,
      values.uniqueAbsentLetters,
    );

    const resultsList = document.querySelector(".results-list");

    // Clear existing results
    while (resultsList.firstChild) {
      resultsList.removeChild(resultsList.firstChild);
    }

    finalWords.splice(0, 30).forEach((word) => {
      const listItem = document.createElement("li");
      listItem.textContent = word;

      resultsList.appendChild(listItem);
    });
  });

  const misplacedButton = document.getElementById("new-misplaced-row");
  misplacedButton.addEventListener("click", addMisplacedRow);

  const absentButton = document.getElementById("new-absent-row");
  absentButton.addEventListener("click", addAbsentRow);
});

async function loadWords() {
  try {
    const response = await fetch("words/words-5-letter.json");

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    words = await response.json();
  } catch (error) {
    console.error("Failed to load words:", error);
  }
}

function initRestrictNonLetters() {
  const inputRows = document.querySelectorAll(".input-row");
  inputRows.forEach((row) => {
    const letterInputs = row.querySelectorAll(".letter-input");

    letterInputs.forEach((input, index) => {
      restrictNonLetters(input, index, letterInputs);
    });
  });
}

function focusNextInput(input) {
  const allInputs = [
    ...document.querySelectorAll(".absent-letters .letter-input"),
  ];

  const index = allInputs.indexOf(input);

  if (index !== -1 && index < allInputs.length - 1) {
    allInputs[index + 1].focus();
  }
}

const digraphs = ["LJ", "NJ", "DŽ"];

function restrictNonLetters(input, index, letterInputs) {
  const isAbsent = input.closest(".absent-letters") !== null;

  input.addEventListener("input", function () {
    let value = this.value.replace(/[^\p{L}]/gu, "").toLocaleUpperCase("hr");

    // Absent letters: allow a digraph in one box
    if (isAbsent) {
      if (value.length > 2) {
        value = value.slice(0, 2);
      }

      // If the first letter cannot start a digraph,
      // keep only that letter and move to the next box.
      if (value.length === 1 && !["L", "N", "D"].includes(value)) {
        this.value = value;
        focusNextInput(this);
        return;
      }

      // If the second letter doesn't complete a digraph,
      // keep the first letter here and move the second
      // letter into the next box.
      if (value.length === 2 && !digraphs.includes(value)) {
        const firstLetter = value[0];
        const secondLetter = value[1];

        this.value = firstLetter;

        focusNextInput(this);

        const allInputs = [
          ...document.querySelectorAll(".absent-letters .letter-input"),
        ];

        const currentIndex = allInputs.indexOf(this);

        if (currentIndex !== -1 && currentIndex < allInputs.length - 1) {
          allInputs[currentIndex + 1].value = secondLetter;
        }

        return;
      }

      this.value = value;

      // Move to the next box when a digraph is complete.
      if (digraphs.includes(value) && index < letterInputs.length - 1) {
        letterInputs[index + 1].focus();
      }

      return;
    }

    // Correct and misplaced letters
    this.value = value;

    // Handle a digraph typed across two adjacent boxes
    if (this.value.length === 1 && index > 0) {
      const previousInput = letterInputs[index - 1];
      const combined = previousInput.value + this.value;

      if (digraphs.includes(combined)) {
        previousInput.value = combined;
        this.value = "";
        this.focus();
        return;
      }
    }

    // Move forward after a letter or digraph
    if (this.value.length > 0 && index < letterInputs.length - 1) {
      letterInputs[index + 1].focus();
    }
  });

  input.addEventListener("keydown", function (event) {
    // In absent letters, use the right arrow to keep
    // L and J separate instead of entering LJ together.
    if (isAbsent && event.key === "ArrowRight") {
      if (index < letterInputs.length - 1) {
        event.preventDefault();
        letterInputs[index + 1].focus();
      }
      return;
    }

    if (event.key === "Backspace" && this.value === "" && index > 0) {
      letterInputs[index - 1].value = "";
      letterInputs[index - 1].focus();
    }
  });
}

function addMisplacedRow() {
  const lastRow = document.querySelector(
    ".misplaced-letters .input-row:last-of-type",
  );

  if (!lastRow) {
    console.error("No existing misplaced-letters row found.");
    return;
  }

  const newRow = document.createElement("div");
  newRow.classList.add("input-row");
  newRow.dataset.row = Number(lastRow.dataset.row) + 1;

  for (let i = 1; i <= 5; i++) {
    const input = document.createElement("input");

    input.dataset.position = i;
    input.classList.add("letter-input");
    input.type = "text";
    input.maxLength = 2;

    newRow.appendChild(input);
  }

  const letterInputs = newRow.querySelectorAll(".letter-input");
  letterInputs.forEach((input, index) => {
    restrictNonLetters(input, index, letterInputs);
  });

  lastRow.insertAdjacentElement("afterend", newRow);
}

function addAbsentRow() {
  const absentRow = document.querySelector(".absent-letters .input-row");

  if (!absentRow) {
    console.error("No existing absent-letters row found.");
    return;
  }

  for (let i = 1; i <= 8; i++) {
    const input = document.createElement("input");

    input.classList.add("letter-input");
    input.type = "text";
    input.maxLength = 2;

    absentRow.appendChild(input);
  }

  const letterInputs = absentRow.querySelectorAll(".letter-input");
  letterInputs.forEach((input, index) => {
    restrictNonLetters(input, index, letterInputs);
  });
}

function getFormValues() {
  const correctLetters = Array(5).fill("");

  document
    .querySelectorAll(".correct-letters .letter-input")
    .forEach((input) => {
      if (input.value.trim() !== "") {
        const position = Number(input.dataset.position) - 1;
        correctLetters[position] = input.value.trim().toLocaleLowerCase("hr");
      }
    });

  const misplacedRows = [];

  document.querySelectorAll(".misplaced-letters .input-row").forEach((row) => {
    const letters = [...row.querySelectorAll(".letter-input")].map((input) =>
      input.value.trim().toLocaleLowerCase("hr"),
    );

    if (letters.some((letter) => letter !== "")) {
      misplacedRows.push(letters);
    }
  });

  const absentLetters = [
    ...document.querySelectorAll(".absent-letters .letter-input"),
  ]
    .map((input) => input.value.trim().toLocaleLowerCase("hr"))
    .filter((letter) => letter !== "");

  const uniqueAbsentLetters = [...new Set(absentLetters)];

  return {
    correctLetters,
    misplacedRows,
    uniqueAbsentLetters,
  };
}

function filterWords(correctLetters, misplacedRows, absentLetters) {
  // Correct letters
  let correctFilteredWords = [];

  correctFilteredWords = words.filter((word) => {
    const array = word.toLocaleLowerCase("hr").match(/DŽ|LJ|NJ|./giu) || [];

    if (correctLetters.size < 1) return true;

    return correctLetters.every((correctLetter, index) => {
      if (correctLetter === "") return true;

      return array[index] === correctLetter;
    });
  });

  // Misplaced letters
  let misplacedFilteredWords = correctFilteredWords;

  misplacedRows.forEach((misplacedLetters) => {
    misplacedLetters.forEach((misplacedLetter, index) => {
      if (misplacedLetter === "") return;

      misplacedFilteredWords = misplacedFilteredWords.filter((word) => {
        const array = word.toLocaleLowerCase("hr").match(/DŽ|LJ|NJ|./giu) || [];

        // The word must contain this letter
        if (!array.includes(misplacedLetter)) {
          return false;
        }

        // The letter must NOT be in this position
        if (array[index] === misplacedLetter) {
          return false;
        }

        return true;
      });
    });
  });

  // Absent letters
  const absentFilteredWords = misplacedFilteredWords.filter((word) => {
    const array = word.toLocaleLowerCase("hr").match(/DŽ|LJ|NJ|./giu) || [];

    return !absentLetters.some((letter) => array.includes(letter));
  });

  const resultWords = absentFilteredWords;

  return resultWords;
}
