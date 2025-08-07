: "${PORT:=8000}"
#!/usr/bin/env bash
set -euo pipefail
# ensure Python can import modules from the project root
export PYTHONPATH="$PWD"


# 0. Ensure we’re in project root
if [[ ! -f requirements.txt ]]; then
  echo "✗ Cannot find requirements.txt. Please cd into your project root."
  exit 1
fi
echo "✔️ Detected requirements.txt — proceeding."

# 1. Check Python & venv
echo "\n➤ Python version:"
python3 --version
echo "\n➤ Creating .venv…"
python3 -m venv .venv
source .venv/bin/activate

# 2. Upgrade pip & install dev tools
echo "\n➤ Upgrading pip & installing pipreqs/pipdeptree…"
pip install --upgrade pip setuptools wheel
pip install pipreqs pipdeptree

echo "\n➤ Regenerating requirements.txt with pipreqs (fallback to pip freeze)…"
if pipreqs --force . ; then
  echo "  ✓ pipreqs succeeded."
else
  echo "  ⚠️ pipreqs failed—falling back to pip freeze."
  pip freeze > requirements.txt
fi

# 3. Install & verify dependencies
echo "\n➤ Installing dependencies from requirements.txt…"
pip install -r requirements.txt
echo "\n➤ Checking for conflicts…"
pip check
echo "\n➤ Showing dependency tree…"
pipdeptree

# 4. Scan for missing imports
echo "\n➤ Running missing-imports checker…"
python3 scripts/check_missing_imports.py

# 5. Verify environment variables (customize this list)
echo "\n➤ Verifying required environment variables…"
REQUIRED_VARS=(DATABASE_URL SECRET_KEY)  # ← update this list!
for v in "\${REQUIRED_VARS[@]}"; do
  if [[ -z "\${!v-}" ]]; then
    echo "  ✗ \$\{v\} is not set!"
    exit 1
  else
    echo "  ✓ \$\{v\} = \${!v}"
  fi
done

# 6. Smoke-test Uvicorn startup
echo "➤ Starting Uvicorn for 5s…"
uvicorn main:app --host 127.0.0.1 --port ${PORT:-8000} --lifespan on &
UVICORN_PID=$!
sleep 5
kill "$UVICORN_PID"
