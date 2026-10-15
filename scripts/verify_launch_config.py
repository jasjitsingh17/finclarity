from pathlib import Path
import json
import re
import sys

ROOT = Path.cwd()

required = {
    "requirements-deploy.txt": ROOT / "requirements-deploy.txt",
    "Dockerfile": ROOT / "Dockerfile",
    ".dockerignore": ROOT / ".dockerignore",
    ".gcloudignore": ROOT / ".gcloudignore",
    "vercel.json": ROOT / "vercel.json",
    "THIRD_PARTY_NOTICES.md": ROOT / "THIRD_PARTY_NOTICES.md",
    "docs/LAUNCH_RUNBOOK.md": ROOT / "docs" / "LAUNCH_RUNBOOK.md",
    "src/lib/apiBase.js": ROOT / "src" / "lib" / "apiBase.js",
    ".env.example": ROOT / ".env.example",
}

failures = []

for label, path in required.items():
    if path.exists() and path.stat().st_size > 0:
        print("✓", label)
    else:
        failures.append(f"missing/empty: {label}")
        print("✗", label)

dockerfile = (ROOT / "Dockerfile").read_text(errors="replace")

checks = {
    "Cloud Run PORT binding": "${PORT:-8080}" in dockerfile,
    "CPU-only PyTorch index": "download.pytorch.org/whl/cpu" in dockerfile,
    "FinBERT image cache": "ProsusAI/finbert" in dockerfile,
    "FastAPI startup": "uvicorn backend.main:app" in dockerfile,
}

for label, passed in checks.items():
    print(("✓" if passed else "✗"), label)
    if not passed:
        failures.append(label)

try:
    config = json.loads(
        (ROOT / "vercel.json").read_text()
    )

    rewrites = config.get("rewrites", [])

    spa_ok = any(
        item.get("destination") == "/index.html"
        for item in rewrites
        if isinstance(item, dict)
    )

    print(
        ("✓" if spa_ok else "✗"),
        "Vercel SPA rewrite",
    )

    if not spa_ok:
        failures.append("Vercel SPA rewrite")
except Exception as exc:
    failures.append(f"vercel.json invalid: {exc}")
    print("✗ vercel.json parse")

api_base = (
    ROOT
    / "src"
    / "lib"
    / "apiBase.js"
).read_text(errors="replace")

if "VITE_API_BASE_URL" in api_base:
    print("✓ VITE_API_BASE_URL")
else:
    print("✗ VITE_API_BASE_URL")
    failures.append("VITE_API_BASE_URL missing")

main_text = (
    ROOT
    / "backend"
    / "main.py"
).read_text(errors="replace")

if "FINCLARITY_CORS_ORIGINS" in main_text:
    print("✓ FINCLARITY_CORS_ORIGINS")
else:
    print("✗ FINCLARITY_CORS_ORIGINS")
    failures.append("FINCLARITY_CORS_ORIGINS missing")

if failures:
    print()
    print("FAILED:")
    for item in failures:
        print(" -", item)
    raise SystemExit(1)

print()
print("PASS — FinClarity launch configuration is structurally ready.")
