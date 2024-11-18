# Pre-Commit Hook

Because Github Pages won't include the `ReadMe.md`, I have a pre-commit hook that populates the `js\readme.js` with a `base64` encoded string of teh contents of `ReadMe.md` that will get decoded by the page.  This `pre-commit` script should be included under `.git\hooks`.

```sh
#!/bin/bash

# Configuration
SOURCE_FILE="README.md"
TARGET_JS_FILE="js/readme.js"
CONSTANT_NAME="readme"

if [ ! -f "$SOURCE_FILE" ]; then
  echo "Source file not found: $SOURCE_FILE"
  exit 1
fi

if [ ! -f "$TARGET_JS_FILE" ]; then
  echo "Target JavaScript file not found: $TARGET_JS_FILE"
  exit 2
fi


if ! git diff --quiet --cached "$SOURCE_FILE"; then
  echo "Source file has changes. Proceeding with base64 encoding."

  # Base64 encode the source file
  BASE64_ENCODED=$(base64 "$SOURCE_FILE")

  # Update the JavaScript file with the base64 encoded string
  sed -i "/^const ${CONSTANT_NAME} = /c\\const ${CONSTANT_NAME} = \"$BASE64_ENCODED\";" "$TARGET_JS_FILE"

  # Check if the sed command was successful
  if [ $? -ne 0 ]; then
    echo "Failed to update the JavaScript file."
    exit 3
  fi

  # Stage the changes to the JavaScript file
  git add "$TARGET_JS_FILE"

  echo "Pre-commit hook completed successfully."
else
  echo "Source file has no changes. Skipping base64 encoding."
  exit 0
fi
```