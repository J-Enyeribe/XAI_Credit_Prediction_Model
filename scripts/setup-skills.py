import json
import subprocess
import os

MANIFEST_PATH = ".opencode/skills-manifest.json"

def install_skills():
    if not os.path.exists(MANIFEST_PATH):
        print(f"Error: Manifest file not found at {MANIFEST_PATH}")
        return

    with open(MANIFEST_PATH, 'r') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {e}")
            return

    print("Starting skill installation process...")
    print("-" * 50)

    for item in data:
        repo = item.get('repo')
        skills = item.get('skills', [])
        
        for skill in skills:
            print(f"Installing skill: {skill} from {repo}...")
            try:
                # Use subprocess.run with capture_output=False to see the progress
                # Use -y and -g for non-interactive global installation
                result = subprocess.run(
                    ["npx", "skills", "add", repo, "--skill", skill, "-y", "-g"],
                    check=True,
                    text=True
                )
                print(f"✅ Successfully installed {skill}")
            except subprocess.CalledProcessError as e:
                print(f"❌ Failed to install {skill}: {e}")

    print("-" * 50)
    print("Skill installation process complete.")

if __name__ == "__main__":
    install_skills()
