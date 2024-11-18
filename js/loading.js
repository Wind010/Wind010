// Updated alphabet to include all letters, numbers, and common symbols
const ALPHABET_RANGE = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  ..."0123456789",
  ..."!@#$%^&*()_+-=[]{}|;:'\",.<>/?`~"
];
let letterCount = 0;
let finished = false;
let word = "";
let displaySpan;
let repeatAnimation = false;
let skipWhitespace = false;

let characterAttemptInterval = 75;
let decodingInterval = 1000;
let decodeStringRepeatInterval = 1500;
let alphabet = null;

function displayLoadingEffect(parentDiv, inputText, skipSpaces = false, repeat = false, glow = true
  , alphaRange = ALPHABET_RANGE, charAttemptIncrement = 75, decodeInterval = 1000
  , decodeStrRepeatInterval = 1500) {
  // Clear previous span if any.
  displaySpan && displaySpan.remove();

  word = inputText.trim();
  letterCount = 0;
  finished = false;
  skipWhitespace = skipSpaces;
  repeatAnimation = repeat;

  alphabet = alphaRange;

  characterAttemptInterval = charAttemptIncrement;
  decodingInterval = decodeInterval;
  decodeStringRepeatInterval = decodeStrRepeatInterval;

  // Create a single span element for the text
  displaySpan = document.createElement("span");
  displaySpan.classList.add("loading");
  
  if (glow) {
    displaySpan.classList.add("glow");
  }

  displaySpan.textContent = "";
  parentDiv.appendChild(displaySpan);

  // Animate
  setTimeout(write, characterAttemptInterval);
  setTimeout(increment, decodingInterval);
}

function write() {
  if (!finished) {
    let randomText = "";
    for (let i = 0; i < word.length; i++) {
      if (i < letterCount) {
        // Reveal correct letters up to `letterCount`, spaces displayed as is.
        randomText += word[i] === " " && skipWhitespace ? " " : word[i];
      } else {
        // Randomize non-revealed characters.
        randomText += word[i] === " " && skipWhitespace ? " " : alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }
    displaySpan.textContent = randomText;
    setTimeout(write, characterAttemptInterval);
  }
}

function increment() {
  // Reveal the next letter in the sequence and stop.
  if (word[letterCount] !== " ") {
    displaySpan.textContent = displaySpan.textContent.slice(0, letterCount);
  }

  letterCount++;

  if (letterCount > word.length) {
    finished = true;
    if (repeatAnimation) {
      setTimeout(reset, decodeStringRepeatInterval);
    }
  } else {
    setTimeout(increment, decodingInterval);
  }
}

function reset() {
  letterCount = 0;
  finished = false;
  setTimeout(increment, decodingInterval);
  setTimeout(write, characterAttemptInterval);
}