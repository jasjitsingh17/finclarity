FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/opt/huggingface \
    HF_HUB_DISABLE_TELEMETRY=1

WORKDIR /app

COPY requirements-deploy.txt .

RUN python -m pip install --upgrade pip setuptools wheel \
    && python -m pip install \
       torch==2.14.1 \
       --index-url https://download.pytorch.org/whl/cpu \
    && python -m pip install -r requirements-deploy.txt

# Cache only the FinBERT assets used by FinClarity at image-build time.
# This avoids a large Hugging Face download on the first live request.
RUN python - <<'PY'
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
)

model_name = "ProsusAI/finbert"

AutoTokenizer.from_pretrained(
    model_name
)

AutoModelForSequenceClassification.from_pretrained(
    model_name
)

print("FinBERT cached in container image")
PY

COPY backend ./backend

ENV PORT=8080

CMD ["sh", "-c", "exec uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
