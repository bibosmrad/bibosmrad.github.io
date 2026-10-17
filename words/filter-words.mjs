import fs from "node:fs";

const words = JSON.parse(fs.readFileSync("words/words.json", "utf8"));

const fiveLetterWords = words.filter((word) => {
  if (typeof word !== "string" || !/^[a-zA-ZčćđšžČĆĐŠŽ]+$/i.test(word)) {
    return false;
  }

  // Count LJ, NJ and DŽ as single letters.
  const letters = word.match(/dž|lj|nj|[a-zčćđšž]/gi);

  return letters?.length === 5;
});

fs.writeFileSync(
  "./words-5-letter.json",
  JSON.stringify(fiveLetterWords, null, 2) + "\n",
  "utf8",
);

console.log(`Saved ${fiveLetterWords.length} five-letter words.`);
