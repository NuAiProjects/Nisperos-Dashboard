# Render Option 2: Node Web + Private Python Inference Service

This setup runs:

- `nisperos-dashboard-web` (Node/Express + Vite build) as the public web app
- `nisperos-inference` (FastAPI) as a private internal service for BERT/RAG

The Node app calls the private service over Render private networking using
`MODEL_PROVIDER=remote`.

## 1) Create the private inference service

Service type:

- Private Service
- Environment: Python 3
- Root directory: `python-service`

Build and start commands:

```bash
pip install -r requirements.txt
```

```bash
uvicorn app:app --host 0.0.0.0 --port $PORT
```

Environment variables:

- `PYTHON_BIN=python3`
- `BERT_DIR=/var/data/BERT` (or path where BERT artifacts exist)
- `RAG_DIR=/var/data/RAG` (or path where RAG code exists)
- `RAG_DATA_DIR=/var/data/RAG/rag_data` (or path where RAG indexes exist)
- `MODEL_API_KEY=<random-shared-secret>` (recommended)
- Optional: `BERT_TIMEOUT_MS`, `RAG_TIMEOUT_MS`, `BERT_TOP_K`, `RAG_TOP_K`, `RAG_ST_MODEL`

Health check path:

- `/health`

## 2) Create the public Node web service

Service type:

- Web Service
- Environment: Node

Build and start commands:

```bash
npm ci && npm run build
```

```bash
npm start
```

Environment variables:

- `MODEL_PROVIDER=remote`
- `REMOTE_MODEL_URL=http://<private-service-internal-url>`
- `REMOTE_MODEL_API_KEY=<same-value-as-MODEL_API_KEY>`
- Optional: `REMOTE_BERT_TIMEOUT_MS`, `REMOTE_RAG_TIMEOUT_MS`

`PORT` is automatically handled by Render.

## 3) Artifact strategy for BERT/RAG files

GitHub normal pushes cannot store your large model files (>100MB). Use one of:

- Render disk + startup sync from object storage (S3/R2/GCS)
- Git LFS for selected artifacts
- Separate artifact repository/download process

Required runtime files for external inference:

- `BERT/predict.py`
- `BERT/distilbert_clause_saved/model.safetensors`
- `BERT/deberta_type_saved/model.safetensors`
- `RAG/qa.py`
- `RAG/rag_data/chunks.jsonl`
- `RAG/rag_data/bm25.json`
- `RAG/rag_data/embeddings.npy`

## 4) Local smoke test

Start private inference service:

```bash
cd python-service
uvicorn app:app --host 0.0.0.0 --port 8001
```

Then start Node app from repo root with:

- `MODEL_PROVIDER=remote`
- `REMOTE_MODEL_URL=http://127.0.0.1:8001`

Node endpoints `/api/model/analyze-finding` and `/api/assistant/ask` should now use the private inference service.
