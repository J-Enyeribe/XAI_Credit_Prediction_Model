#!/bin/bash
# scripts/setup-skills.sh

MANIFEST=".opencode/skills-manifest.json"
TEMP_FILE=$(mktemp)

if [ ! -f "$MANIFEST" ]; then
    echo "Error: Manifest file not found at $MANIFEST"
    exit 1
fi

echo "Starting skill installation process..."
echo "--------------------------------------------------"

# Save repo-skill pairs to a temporary file to avoid stdin consumption issues
python3 -c "
import json
with open('$MANIFEST') as f:
    data = json.load(f)
    for item in data:
        for skill in item['skills']:
            print(f\"{item['repo']} {skill}\")
" > "$TEMP_FILE"

# Read from the temporary file
while read -r REPO SKILL; do
    if [ -z "$REPO" ] || [ -z "$SKILL" ]; then
        continue
    fi
    
    echo "Installing skill: $SKILL from $REPO..."
    # Use -y and -g for non-interactive global installation
    npx skills add "$REPO" --skill "$SKILL" -y -g
    if [ $? -eq 0 ]; then
        echo "✅ Successfully installed $SKILL"
    else
        echo "❌ Failed to install $SKILL"
    fi
done < "$TEMP_FILE"

# Cleanup
rm "$TEMP_FILE"

echo "--------------------------------------------------"
echo "Skill installation process complete."
