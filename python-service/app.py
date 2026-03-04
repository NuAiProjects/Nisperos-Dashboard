from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

DEFAULT_TIMEOUT_MS = 120_000


class BertPredictRequest(BaseModel):
    text: str = Field(min_length=1)
    top_k: int | None = Field(default=None, ge=1)


class RagQaRequest(BaseModel):
    question: str = Field(min_length=1)
    top_k: int | None = Field(default=None, ge=1)
    st_model: str | None = Field(default=None, min_length=1)


def parse_json_object(raw: str) -> dict[str, Any]:
    text = (raw or "").strip()
    if not text:
        raise ValueError("Process returned empty output.")

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        first = text.find("{")
        last = text.rfind("}")
        if first == -1 or last == -1 or last <= first:
            raise ValueError("Process output did not contain a JSON object.")
        parsed = json.loads(text[first : last + 1])

    if not isinstance(parsed, dict):
        raise ValueError("Process output JSON payload must be an object.")
    return parsed


def parse_timeout(env_name: str, fallback: int = DEFAULT_TIMEOUT_MS) -> int:
    raw = os.getenv(env_name)
    if raw is None:
        return fallback

    try:
        parsed = int(raw)
    except ValueError:
        return fallback

    return parsed if parsed > 0 else fallback


def resolve_python_bin(*env_keys: str) -> str:
    for key in env_keys:
        value = os.getenv(key)
        if value:
            return value

    if sys.executable:
        return sys.executable
    return "python3"


def resolve_rag_paths() -> tuple[Path, Path]:
    rag_dir = Path(os.getenv("RAG_DIR", "RAG")).resolve()
    data_dir = Path(os.getenv("RAG_DATA_DIR", str(rag_dir / "rag_data"))).resolve()
    return rag_dir, data_dir


def resolve_bert_dir() -> Path:
    return Path(os.getenv("BERT_DIR", "BERT")).resolve()


def ensure_exists(target: Path, label: str) -> None:
    if not target.exists():
        raise HTTPException(status_code=503, detail=f"Missing {label}: {target}")


def run_process(args: list[str], cwd: Path, timeout_ms: int) -> dict[str, Any]:
    try:
        completed = subprocess.run(
            args,
            cwd=str(cwd),
            env=os.environ.copy(),
            capture_output=True,
            text=True,
            timeout=timeout_ms / 1000,
            check=False,
        )
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Unable to start Python process. Check PYTHON_BIN/RAG_PYTHON_BIN/BERT_PYTHON_BIN. {exc}",
        ) from exc
    except subprocess.TimeoutExpired as exc:
        raise HTTPException(
            status_code=504,
            detail=f"Inference process timed out after {timeout_ms}ms.",
        ) from exc

    if completed.returncode != 0:
        detail = (completed.stderr or completed.stdout or "No process output").strip()
        raise HTTPException(
            status_code=503,
            detail=f"Inference process failed (exit {completed.returncode}): {detail[:500]}",
        )

    try:
        return parse_json_object(completed.stdout)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


def verify_api_key(x_model_api_key: str | None = Header(default=None)) -> None:
    expected = os.getenv("MODEL_API_KEY")
    if expected and x_model_api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid inference API key.")


app = FastAPI(title="Nisperos Inference Service", version="1.0.0")


@app.get("/health")
def health() -> dict[str, Any]:
    rag_dir, data_dir = resolve_rag_paths()
    bert_dir = resolve_bert_dir()
    return {
        "status": "ok",
        "python_bin": resolve_python_bin("PYTHON_BIN"),
        "bert_dir": str(bert_dir),
        "rag_dir": str(rag_dir),
        "rag_data_dir": str(data_dir),
        "artifacts": {
            "bert_predict": (bert_dir / "predict.py").exists(),
            "rag_qa": (rag_dir / "qa.py").exists(),
            "rag_chunks": (data_dir / "chunks.jsonl").exists(),
            "rag_bm25": (data_dir / "bm25.json").exists(),
            "rag_embeddings": (data_dir / "embeddings.npy").exists(),
        },
    }


@app.post("/bert/predict", dependencies=[Depends(verify_api_key)])
def bert_predict(payload: BertPredictRequest) -> dict[str, Any]:
    bert_dir = resolve_bert_dir()
    script = bert_dir / "predict.py"
    ensure_exists(script, "BERT predict script")
    ensure_exists(bert_dir / "distilbert_clause_saved" / "model.safetensors", "clause model")
    ensure_exists(bert_dir / "deberta_type_saved" / "model.safetensors", "classification model")

    python_bin = resolve_python_bin("BERT_PYTHON_BIN", "RAG_PYTHON_BIN", "PYTHON_BIN")
    timeout_ms = parse_timeout("BERT_TIMEOUT_MS")
    args = [
        python_bin,
        str(script),
        "--bert_dir",
        str(bert_dir),
        "--text",
        payload.text,
    ]

    top_k = payload.top_k
    if top_k is None and os.getenv("BERT_TOP_K"):
        try:
            top_k = int(os.getenv("BERT_TOP_K", ""))
        except ValueError:
            top_k = None
    if top_k:
        args.extend(["--top_k", str(top_k)])

    return run_process(args, bert_dir, timeout_ms)


@app.post("/rag/qa", dependencies=[Depends(verify_api_key)])
def rag_qa(payload: RagQaRequest) -> dict[str, Any]:
    rag_dir, data_dir = resolve_rag_paths()
    script = rag_dir / "qa.py"
    ensure_exists(script, "RAG QA script")
    ensure_exists(data_dir / "chunks.jsonl", "RAG chunks")
    ensure_exists(data_dir / "bm25.json", "RAG BM25 index")
    ensure_exists(data_dir / "embeddings.npy", "RAG embeddings")

    python_bin = resolve_python_bin("RAG_PYTHON_BIN", "BERT_PYTHON_BIN", "PYTHON_BIN")
    timeout_ms = parse_timeout("RAG_TIMEOUT_MS")
    args = [
        python_bin,
        str(script),
        payload.question,
        "--data_dir",
        str(data_dir),
    ]

    top_k = payload.top_k
    if top_k is None and os.getenv("RAG_TOP_K"):
        try:
            top_k = int(os.getenv("RAG_TOP_K", ""))
        except ValueError:
            top_k = None
    if top_k:
        args.extend(["--top_k", str(top_k)])

    st_model = payload.st_model or os.getenv("RAG_ST_MODEL")
    if st_model:
        args.extend(["--st_model", st_model])

    return run_process(args, rag_dir, timeout_ms)
