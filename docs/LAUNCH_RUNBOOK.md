# FinClarity Launch Runbook

This runbook publishes the current FinClarity project as:

- **Frontend:** Vercel
- **Backend:** Google Cloud Run
- **Source:** GitHub

The backend is containerized because FinClarity uses PyTorch + Transformers + FinBERT.
The Docker image pre-caches `ProsusAI/finbert` so the first live sentiment request does
not need to download the model from Hugging Face.

---

## 0. Why these settings

Recommended starting Cloud Run configuration:

- Region: `europe-west2`
- CPU: `1`
- Memory: `3Gi`
- Concurrency: `2`
- Minimum instances: `0`
- Maximum instances: `2`
- Request timeout: `300s`
- Startup CPU boost: enabled
- Public / unauthenticated access: enabled

This is deliberately conservative for a portfolio project. FinBERT is much heavier than
the rest of the FastAPI application. If Cloud Run logs show out-of-memory errors, raise
memory to `4Gi` before changing model code.

---

## 1. Validate locally before GitHub

```bash
cd /Users/gurpeet/Desktop/finclarity
source .venv/bin/activate

python -m pytest -q
npm run lint
npm run build
python3 scripts/verify_launch_config.py
```

Expected:
- backend tests pass
- lint passes
- build passes
- launch-config verifier passes

---

## 2. Initialize Git locally

The project currently has no `.git` repository.

```bash
cd /Users/gurpeet/Desktop/finclarity

git init
git branch -M main
git add .
git status --short
```

Before committing, check that `.before-*`, `.venv`, `node_modules`, `dist`, `.env`
and `__pycache__` do NOT appear in the staged file list.

Then:

```bash
git commit -m "Prepare FinClarity for public launch"
```

---

## 3. Create the GitHub repository

On GitHub:

1. Create a new repository named `finclarity`.
2. Do **not** add a README, `.gitignore`, or license from GitHub because the local project
   already contains those files.
3. Choose Public when you are ready for recruiters to see it.
4. Copy the repository HTTPS URL.

Back in Terminal:

```bash
git remote add origin https://github.com/YOUR-USERNAME/finclarity.git
git push -u origin main
```

If GitHub asks for authentication, complete GitHub's browser/device authentication flow.

---

## 4. Deploy the FastAPI backend to Cloud Run

You do not need Docker or `gcloud` installed on the Mac.

Open Google Cloud Console, create/select a project, ensure billing is enabled, and open
**Cloud Shell**. Cloud Shell already has the Google Cloud CLI.

Clone the repository:

```bash
git clone https://github.com/YOUR-USERNAME/finclarity.git
cd finclarity
```

Set the project:

```bash
gcloud config set project YOUR-GCP-PROJECT-ID
```

Enable the required services:

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com
```

Deploy from source. Cloud Run will detect the root `Dockerfile`:

```bash
gcloud run deploy finclarity-api \
  --source . \
  --region europe-west2 \
  --allow-unauthenticated \
  --cpu 1 \
  --memory 3Gi \
  --concurrency 2 \
  --min-instances 0 \
  --max-instances 2 \
  --timeout 300 \
  --cpu-boost
```

The build can take several minutes because the image installs CPU PyTorch and downloads
the FinBERT model during the build.

At the end Cloud Run prints a URL similar to:

```text
https://finclarity-api-xxxxxxxxxx.nw.a.run.app
```

Save that URL.

Test:

```bash
curl https://YOUR-CLOUD-RUN-URL/api/health
```

Also open:

```text
https://YOUR-CLOUD-RUN-URL/docs
```

---

## 5. Deploy the React/Vite frontend to Vercel

On Vercel:

1. Sign in.
2. Choose **Add New → Project**.
3. Import the `finclarity` GitHub repository.
4. Vercel should detect Vite.
5. Build command: `npm run build`
6. Output directory: `dist`
7. Add the environment variable:

```text
VITE_API_BASE_URL=https://YOUR-CLOUD-RUN-URL
```

Apply it to Production (and Preview if you want preview deployments to use the API).

Deploy.

The included `vercel.json` sends SPA deep links such as
`/institutional/black-litterman` back to `index.html`, so React Router can handle them.

Save the production URL, for example:

```text
https://finclarity.vercel.app
```

---

## 6. Lock backend CORS to the live frontend

Return to Google Cloud Shell:

```bash
gcloud run services update finclarity-api \
  --region europe-west2 \
  --set-env-vars FINCLARITY_CORS_ORIGINS=https://YOUR-VERCEL-DOMAIN
```

Do not include a trailing slash.

If you later add a custom domain, use a comma-separated value:

```text
https://finclarity.vercel.app,https://www.yourdomain.com
```

---

## 7. Final live QA

Check:

```text
/
 /about
 /retail
 /retail/portfolio
 /retail/action-centre
 /retail/sentiment
 /retail/risk
 /retail/performance
 /retail/diversification
 /retail/stress
 /retail/exposure
 /retail/health
 /retail/understand
 /institutional
 /institutional/portfolio
 /institutional/efficient-frontier
 /institutional/sentiment
 /institutional/black-litterman
 /institutional/factors
 /institutional/risk
 /institutional/backtesting
 /institutional/settings
```

Then run at least one real model workflow from each side:

Retail:
- save a portfolio
- Analyse Portfolio
- Risk
- Performance
- Action Centre
- Sentiment

Institutional:
- save portfolio
- Efficient Frontier
- Black-Litterman
- Risk Analytics
- Backtesting

The first FinBERT inference after a new Cloud Run instance starts may be slower than later
requests because the model still has to be loaded from disk into memory.

---

## 8. README promotion

After final screenshots are placed in `docs/screenshots/`, replace the short development
README with the recruiter README:

```bash
cp README.md README_DEV_BACKUP.md
cp README_RECRUITER.md README.md

git add README.md README_DEV_BACKUP.md docs/screenshots
git commit -m "Publish FinClarity portfolio README and screenshots"
git push
```

Vercel will automatically redeploy after the push.

---

## 9. Cost / scaling guardrails

For a recruiter portfolio site:

- keep Cloud Run minimum instances at `0`
- keep maximum instances low
- keep concurrency low because FinBERT is CPU/memory-heavy
- review Cloud Run billing/usage after launch
- do not expose paid third-party API credentials in Vite environment variables

If cold starts become annoying, increasing minimum instances to `1` improves responsiveness
but creates a continuous running-cost commitment.

---

## 10. Model licensing

`ProsusAI/finbert` is used under its model license. FinClarity is currently a non-commercial
educational / portfolio project.

Do not turn the live deployment into a paid/commercial service without reviewing that
license and, if necessary, replacing the sentiment model.
