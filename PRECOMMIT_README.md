# Pre-Commit Hook

`terminal.html` needs its personal/bio content as a JS string (GitHub Pages won't let `terminal.js` `fetch()` a same-origin markdown file reliably, so it falls back to a decoded copy). A pre-commit hook keeps `js/terminal-content.js` in sync with `terminal.md` by base64-encoding it whenever `terminal.md` changes. This `pre-commit` script should be included under `.git/hooks` (not tracked by git, so it must be installed manually per clone).

`README.md` is unrelated to this pipeline — it's the flashy GitHub-profile page and is not consumed by `terminal.html`.

```sh
#!/bin/bash

# Keep js/terminal-content.js in sync with terminal.md (only when terminal.md is staged).
SOURCE_FILE="terminal.md"
TARGET_JS_FILE="js/terminal-content.js"
CONSTANT_NAME="terminalContent"

if [ ! -f "$SOURCE_FILE" ]; then
  echo "Source file not found: $SOURCE_FILE"
  exit 1
fi

if [ ! -f "$TARGET_JS_FILE" ]; then
  echo "Target JavaScript file not found: $TARGET_JS_FILE"
  exit 2
fi

# Skip all work unless terminal.md is staged for commit.
if git diff --quiet --cached -- "$SOURCE_FILE"; then
  echo "terminal.md has no staged changes. Skipping terminal-content.js update."
  exit 0
fi

echo "terminal.md has staged changes. Updating js/terminal-content.js..."

# Use a single-line base64 value so the JS const remains a single line.
BASE64_ENCODED=$(base64 < "$SOURCE_FILE" | tr -d '\n')

# Update only the `const terminalContent = "...";` line.
if ! perl -0pi -e 's/^const\s+'"$CONSTANT_NAME"'\s*=\s*".*";$/const '"$CONSTANT_NAME"' = "'"$BASE64_ENCODED"'";/m' "$TARGET_JS_FILE"; then
  echo "Failed to update $TARGET_JS_FILE"
  exit 3
fi

# Stage the generated file if it changed.
git add "$TARGET_JS_FILE"

echo "Updated and staged $TARGET_JS_FILE"
exit 0
```
