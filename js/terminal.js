const terminal = document.getElementById('terminal');
const prompt = document.getElementById('prompt');
const input = document.getElementById('command-input');
let typingJitter = 50;
let typingDelay = 10;
let cursorBlinkSpeed = 300;
let longDelayProbability = 0.025;  // Play around with this to see what looks good.

const cursor = document.querySelector('.cursor');
const CURSOR_PADDING = 20;
const originalCursorPosition = prompt.scrollWidth + CURSOR_PADDING;
const CURSOR_CHAR = '▓' // _ ▄ █ ▓ ▒ ▌ 😏
const commands = [
  HELP,
  CLEAR,
  WHOAMI,
  FAMILY,
  INTERESTS,
  BLOG,
  MA,
  MARTIAL_ARTS,
  HACK,
  HACKING,
  CODE,
  CODING,
  PODCASTS,
  HUMOR,
  ELECTRONICS,
  EASTER_EGGS,
  SHOWS,
  VG,
  VIDEO_GAMES,
  COSPLAY,
  ML,
  MACHINE_LEARNING,
  ECHO,
  LS,
  CAT,
  DECODE,
  DECODE_TEXT,
  DELAY_MS,
  THEME
];

const parsedContent = {};

let markdown; 

// Initial positioning
let cursorPosition = originalCursorPosition;
cursor.style.left = `${cursorPosition}px`; // Set initial position

// History
let commandHistory = [];
let currentHistoryIndex = -1;

const mdConverter = new showdown.Converter();
mdConverter.setOption('tables', false);

// Handle command input.
input.addEventListener('keydown', (e) => {
  const step = 18;
  if (!originalCursorPosition) {
    originalCursorPosition =  prompt.scrollWidth + CURSOR_PADDING;
  }

  switch (e.key) {

    case 'Backspace':
      if (cursorPosition > originalCursorPosition) {
        cursorPosition -= step;
      }
      break;
    case 'ArrowUp':
      if (currentHistoryIndex < commandHistory.length - 1) {
        currentHistoryIndex++;
        input.value = commandHistory[currentHistoryIndex];
        cursorPosition = originalCursorPosition + (input.value.length * step);
        cursor.style.left = `${cursorPosition}px`;
      }
      break;
    case 'ArrowDown':
      if (currentHistoryIndex > -1) {
        currentHistoryIndex--;
        input.value = commandHistory[currentHistoryIndex];
        cursorPosition = originalCursorPosition + (input.value.length * step);
        cursor.style.left = `${cursorPosition}px`;
      } else {
        input.value = '';
        cursorPosition = originalCursorPosition;
        cursor.style.left = `${cursorPosition}px`;
      }
      break;
      case 'Tab':
        e.preventDefault(); // Prevent default Tab behavior
        const inputText = input.value.trim();
        const matchingCommands = commands.filter(cmd => cmd.startsWith(inputText));
        if (matchingCommands.length === 1) {
          input.value = matchingCommands[0];
          cursorPosition = originalCursorPosition + (input.value.length * step);
          cursor.style.left = `${cursorPosition}px`;
        } else if (matchingCommands.length > 1) {
          // Display a list of possible completions
          const completionList = document.createElement('ul');
          matchingCommands.forEach(keyword => {
            const listItem = document.createElement('li');
            listItem.textContent = keyword;
            completionList.appendChild(listItem);
          });
          // Position the completion list below the input field
          completionList.style.position = 'absolute';
          completionList.style.top = `${cursorPosition}px`;
          completionList.style.left = `${originalCursorPosition}px`;
          document.body.appendChild(completionList);
        }
        break;
    case 'Enter':
      const command = input.value;
      displayCommand(command);
      processCommand(command);
      commandHistory.push(command);
      currentHistoryIndex++;
      input.value = '';
      cursorPosition = originalCursorPosition;
      cursor.style.left = `${cursorPosition}px`;
      break;
    default:
      if (currentHistoryIndex === commandHistory.length - 1 && e.key!== 'Enter') {
        commandHistory.pop();
        currentHistoryIndex--;
      }
      cursorPosition += step;
      break;
  }

  cursor.style.left = `${cursorPosition}px`; // Position cursor next to the input text
});


function displayCommand(command) {
  const commandOutput = document.createElement('div');
  commandOutput.textContent = 'jtong@about.me:~$ ' + command;
  terminal.appendChild(commandOutput);

  // Process the command with a delay to simulate typing
  //setTimeout(() => {displayResponse(command);}, typingDelay);


  // Scroll terminal to the bottom after each command
  terminal.scrollTop = terminal.scrollHeight;
}


function displayResponse(outputText) {
  const response = document.createElement('div');
  response.classList.add('response');

  simulateTyping(outputText, response);

  terminal.appendChild(response);
}

function displayResponseHtml(htmlContent) {
  const responseDiv = document.createElement('div');
  responseDiv.classList.add('response');
  responseDiv.innerHTML = htmlContent; // Set inner HTML to the converted Markdown

  simulateTyping(htmlContent, responseDiv, true);

  terminal.appendChild(responseDiv);
}

// Make sure the curosr intervals are cleared.
function stopCursorBlink(isHtml)
{
  var divs = document.getElementsByClassName('response');
  var divs = document.querySelectorAll('div.response');
  for (var j = 0; j < divs.length; j++) {
    let divContent = divs[j][isHtml ? 'innerHTML' : 'textContent'];
    divContent = divContent.replace(CURSOR_CHAR, '');
  }
  // Clearing by id is not enough.
  for(var x = 0; x < 5000; clearInterval(x++));
}

// Simulate typing effect with skewed jitter
function simulateTyping(text, element, isHtml = false, showCursor = true, delayOption = 1) {
  let i = 0;
  let isBlinking = true;

  stopCursorBlink(isHtml);

  function typeChar() {
    if (i <= text.length) {
      let currentChar = text.charAt(i);
      let cursor = '';
      if (showCursor) {
        cursor = (i % 2 === 0) ? CURSOR_CHAR : '';
      }

      if (isHtml) {
        element.innerHTML = text.substring(0, i) + cursor;
      } else {
        element.textContent = text.substring(0, i) + cursor;
      }

      i++;

      // Determine typing speed with a probability threshold
      let typingSpeed;
      if (delayOption === 1) {
        // 10% chance for a longer delay, otherwise short delay
        typingSpeed = Math.random() < longDelayProbability ? typingDelay + Math.random() * typingJitter : typingDelay;
      } else {
        // Typing speed in a given range
        typingSpeed = Math.random() * (typingDelay - typingJitter) + typingDelay;
      }

      setTimeout(typeChar, typingSpeed);
    } else {
      // Remove cursor once typing is finished
      if (isHtml) {
        element.innerHTML = text;
      } else {
        element.textContent = text;
      }

      blinkCursor();
    }
  }

  function blinkCursor() {
    if (!showCursor) {
      return;
    }
    timeoutId = setInterval(() => {
      text = isBlinking ? text.replace(CURSOR_CHAR, '') : text + CURSOR_CHAR;
      element[isHtml ? 'innerHTML' : 'textContent'] = text;
      isBlinking = !isBlinking;
      // console.log(text, isBlinking); // Debug
    }, cursorBlinkSpeed);

    //console.log(timeoutId); // Debug
  }

  typeChar();
}


// Process commands with themes and delay settings
async  function processCommand(command) {
  const [mainCommand, ...args] = command.split(' ');
  const initialState = '<div class="scanline"></div>'

  var divTerminal = document.getElementById('terminal');

  // Scroll terminal to the bottom after typing is complete
  // var scrollInterval = setInterval(function() {
  //   divTerminal.scrollTop = divTerminal.scrollHeight;
  // }, 100);

  let htmlContent;
  switch (mainCommand.toLowerCase()) {
    case HELP:
      let output = `Available commands: ${commands.join(', ')}`;
      displayResponse(output);
      break;
    case 'test':
      displayLoadingEffect(divTerminal, "TEST test !", true);
      break;
    case CLS:
    case CLEAR:
      terminal.innerHTML = initialState; // Clear terminal output
      break;
    case WHOAMI:
      markdownContent = getContentUnderHeader(markdown, "Jeff Tong")
      htmlContent = mdConverter.makeHtml(markdownContent);
      displayResponseHtml(htmlContent);
      break;

    case 'next':
      return 'TODO';

    case FAMILY:
      markdownContent = getContentUnderHeader(markdown, "Jeff Tong/Family")
      htmlContent = mdConverter.makeHtml(markdownContent);
      displayResponseHtml(htmlContent);
      break;
    case INTERESTS:
      markdownContent = getContentUnderHeader(markdown, "Jeff Tong/Interests")
      htmlContent = mdConverter.makeHtml(markdownContent);
      displayResponseHtml(htmlContent);
      break;
    case BLOG:
    case BLOGGING:
        markdownContent = getContentUnderHeader(markdown, "Jeff Tong/Interests/Blogging")
        htmlContent = mdConverter.makeHtml(markdownContent);
        displayResponseHtml(htmlContent);
        break;
    case MA:
    case MARTIAL_ARTS:
      markdownContent = getContentUnderHeader(markdown, "Jeff Tong/Interests/Martial Arts")
      htmlContent = mdConverter.makeHtml(markdownContent);
      displayResponseHtml(htmlContent, stopCursorBlink);
      console.log((typingDelay  + typingJitter) * (htmlContent.length));
      setTimeout(stopCursorBlink, (typingDelay  + typingJitter) * (htmlContent.length) / 4.2, true);
      break;
    case SHOWS:
      markdownContent = getContentUnderHeader(markdown, "Jeff Tong/Interests/Shows")
      htmlContent = mdConverter.makeHtml(markdownContent);
      displayResponseHtml(htmlContent);
      break;
    case VG:
    case VIDEO_GAMES:
      markdownContent = getContentUnderHeader(markdown, "Jeff Tong/Interests/Video Games")
      htmlContent = mdConverter.makeHtml(markdownContent);
      displayResponseHtml(htmlContent);
      break;
    case ELECTRONICS:
      markdownContent = getContentUnderHeader(markdown, "Jeff Tong/Interests/Electronics")
      htmlContent = mdConverter.makeHtml(markdownContent);
      displayResponseHtml(htmlContent);
      break;
    case EASTER_EGGS:
      markdownContent = getContentUnderHeader(markdown, "Jeff Tong/Interests/Humor/Easter Comments Eggs")
      htmlContent = mdConverter.makeHtml(markdownContent);
      displayResponseHtml(htmlContent);
      break;
    case HACK:
    case HACKING:
      if (args.length > 0) {
        displayLoadingEffect(divTerminal, args.join(' '));
        break;
      }
      markdownContent = getContentUnderHeader(markdown, "Jeff Tong/Interests/Hacking")
      markdownContent += "<br/><br/><h3>";
      markdownContent += getContentUnderHeader(markdown, "Jeff Tong/Interests/Hacking/Bug Bounties")
      markdownContent += "</h3>";
      htmlContent = mdConverter.makeHtml(markdownContent);
      displayResponseHtml(htmlContent);
      setTimeout(stopCursorBlink, (typingDelay  + typingJitter) * (htmlContent.length) / 4.2, true);
      break;
    case CODE:
    case CODING:
      markdownContent = getContentUnderHeader(markdown, "Jeff Tong/Interests/Coding")
      htmlContent = mdConverter.makeHtml(markdownContent);
      displayResponseHtml(htmlContent);
      setTimeout(stopCursorBlink, (typingDelay  + typingJitter) * (htmlContent.length) / 5, true);
      break;
    case ML:
    case MACHINE_LEARNING:
      markdownContent = getContentUnderHeader(markdown, "Jeff Tong/Interests/Machine Learning")
      htmlContent = mdConverter.makeHtml(markdownContent);
      displayResponseHtml(htmlContent);
      break;
    case COSPLAY:
      markdownContent = getContentUnderHeader(markdown, "Jeff Tong/Interests/Cosplay")
      htmlContent = mdConverter.makeHtml(markdownContent);
      displayResponseHtml(htmlContent);
      break;
    case PODCASTS:
      markdownContent = getContentUnderHeader(markdown, "Jeff Tong/Interests/Podcasts")
      htmlContent = mdConverter.makeHtml(markdownContent);
      displayResponseHtml(htmlContent);
      break;
    case 'tmux':
      displayResponse('Too 1337');
      await new Promise(r => setTimeout(r, 500));
      stopCursorBlink(divTerminal);
      displayResponseHtml('<a href="https://github.com/tmux/tmux/wiki">TMUX</a>')
      break;
    case 'ssh':
      displayResponse('Secure Shell has been disabled.');
      break;
    case LS:
      let fileListing = `
-rwxr-xr-x 1 user user  456 Jan 12 14:30 expoit.sh
drwxr-xr-x 3 user user 4096 Jan 12 14:30 some_dir
-rw-r--r-- 1 user user  789 Jan 12 14:30 passwords.txt
lrwxr-xr-x 1 user user   10 Jan 12 14:30 link1 -> passwords.txt
`;

      const files = [];
      const lines = fileListing.split('\n');
      // Every 8th element is a file or directory.
      for (let i = 0; i < lines.length; i++) {
        const elements = lines[i].trim().split(/\s+/);
        for (let j = 0; j < elements.length; j += 8) {
          files.push(elements[j + 8]);
        }
      }
      let listing = '';
      if (args.length == 0) {
        listing = files.join(' ');
      }
      else if (args.includes('-l')) {
        listing = fileListing;
      } 
      else if (args.includes('-a')) {
        listing = files.join(' ') + '.ssh';
      } 
      else if (args.includes('-la') || (args.includes('-al'))) {
        listing = fileListing + '-rwxr-xr-x 1 root user 2064 Jan 12 14:30 .ssh'
      }
      else {
        listing = `ls: ${args.join(' ')}: No such file or directory`;
      }
 
      displayResponse(listing);
      break;
    case 'humor':
      markdownContent = getContentUnderHeader(markdown, "Jeff Tong/Interests/Humor")
      htmlContent = mdConverter.makeHtml(markdownContent);
      displayResponseHtml(htmlContent);
      break;
    case 'cat':
      if (args.length == 0) {
        displayResponse('😼');
      }
      else if (args.includes('passwords.txt')) {
        displayResponse('482c811da5d5b4bc6d497ffa98491e38')
      }
      else if (args.includes('.ssh/id_rsa')) {
        displayResponse('Nice work hacker!');
      } 
      else {
        displayResponse(`cat: ${args.join(' ')}: No such file or directory`)
      }
      break;
    case 'echo':
      displayResponse(args.join(' '));
      break;
    case 'decode':
      
      if (args.length > 0) {
        displayLoadingEffect(divTerminal, args.join(' '));
      }
      else {
        displayLoadingEffect(divTerminal, "Decode Me...", true, true, true, "aHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1YN0htbHRVV1hncyZ0PTAxcw==".split(''));
        break;
      }

      break;
    case 'delay':
      typingDelay = parseInt(args[0]) || 500; // Set typing delay
      typingJitter = parseInt(args[2]) || 100; // Set typing jitter
      displayResponse(`Typing delay set to ${typingDelay}ms and typing jitter to ${typingJitter}.`);
      break;
    case 'matrix':
      displayResponse("Entering the Matrix...");
      startMatrixEffect();  // Trigger Matrix effect
      break;
    case 'theme':
      setTheme(args[0].toLowerCase());
      displayResponse(`Theme changed to ${args[0]}.`);
      break;
    default:
      displayResponse(`Command not found: ${command}`);
      break;
  }
}




function appendToTerminal(text) {
  const output = document.createElement("div");
  output.textContent = text;
  terminalElement.appendChild(output);
  terminalElement.scrollTop = terminalElement.scrollHeight; // Auto-scroll to the bottom
}

function startMatrixEffect() {
  // Add a matrix class to terminal
  terminalElement.classList.add("matrix");

  // Remove any existing effect
  if (document.querySelector("#matrixCanvas")) return;

  const canvas = document.createElement("canvas");
  canvas.id = "matrixCanvas";
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.zIndex = "0"; // Behind terminal text
  canvas.style.pointerEvents = "none";
  terminalElement.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  canvas.width = terminalElement.clientWidth;
  canvas.height = terminalElement.clientHeight;

  const matrixChars = "abcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()*&^%+-/~{[|`]}";
  const fontSize = 16;
  const columns = canvas.width / fontSize;
  const drops = Array(Math.floor(columns)).fill(1);

  function drawMatrix() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#0f0"; // Matrix green color
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < drops.length; i++) {
      const text = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  setInterval(drawMatrix, 33);  // 33ms for smoother animation
}

// Function to change theme based on user input
function setTheme(theme) {
  const body = document.body;
  const validThemes = ['retro', 'matrix', 'startrek'];

  if (validThemes.includes(theme)) {
    body.className = theme; // Set class to body
    terminal.className = theme; // Apply theme to terminal
    input.className = theme; // Apply theme to input
  } else {
    return `Invalid theme: ${theme}. Use Retro, Matrix, or StarTrek.`;
  }
}


function getContentUnderHeader(markdown, headerPath) {
  // Convert header path into an array for levels (e.g., "Jeff Tong/Family" -> ["Jeff Tong", "Family"])
  const headerLevels = headerPath.split('/');

  // Build a regex to match the specified header
  const headerRegex = new RegExp(`^#{${headerLevels.length}}\\s+${headerLevels[headerLevels.length - 1]}$`, 'm');
  const match = markdown.match(headerRegex);

  if (!match) {
      return null; // Header not found
  }

  // Find the content after the matched header
  const startIndex = match.index + match[0].length;
  const contentAfterHeader = markdown.slice(startIndex).trim();

  // Build a regex to match the next header of the same or higher level
  const nextHeaderRegex = new RegExp(`^#{1,${headerLevels.length}}\\s+`, 'm');
  const nextMatch = contentAfterHeader.match(nextHeaderRegex);

  // Determine the end index
  const endIndex = nextMatch ? nextMatch.index : contentAfterHeader.length;

  // Return the content under the specified header, up to the next same/higher-level header
  const result = contentAfterHeader.slice(0, endIndex).trim();

  // Remove any sub-headers (e.g., `### Blogging`) within the result
  const cleanResult = result.split(/\n(?=##|\n#)/)[0].trim();

  return cleanResult;
}

// Github pages doesn't allow access directly to the markdown.  
// Fallback to the base64 encoded version.
async function fetchMarkdown() {
  try {
    const response = await fetch('readme.md'); // Path to the Markdown file
    if (!response.ok) {
      console.log(response);
      throw new Error('Network response was not ok');
    }
    const markdownText = await response.text();
    markdown = markdownText;
  } catch (error) {
    console.error('Error fetching markdown:', error);
    console.debug('Using the base64 version');
    markdown = atob(readme);
  }
}

fetchMarkdown();

