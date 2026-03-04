import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";
import type {
  AnalyzeFindingRequest,
  AnalyzeFindingResponse,
  AssistantAskRequest,
  AssistantAskResponse,
  Classification,
  ClauseSuggestion,
  ModelProviderMetadata,
} from "@shared/schema";
import { CLAUSE_LIBRARY_SECTIONS } from "@shared/clause-library";
import { MockModelProvider } from "./mock-provider";

export interface IModelProvider {
  getMetadata(): ModelProviderMetadata;
  analyzeFinding(input: AnalyzeFindingRequest): Promise<AnalyzeFindingResponse>;
  askAssistant(input: AssistantAskRequest): Promise<AssistantAskResponse>;
}

type RagReferenceSource = {
  doc_title: string;
  pages: string;
  snippet: string;
};

type RagQaResponse = {
  response: string;
  reference_source: RagReferenceSource[];
  confidence_score: number;
};

type BertTopClause = {
  clause_id: string;
  probability: number;
};

type BertPredictResponse = {
  classification: string;
  classification_confidence: number;
  predicted_clause: string;
  clause_confidence: number;
  top_clauses: BertTopClause[];
};

const DEFAULT_RAG_TIMEOUT_MS = 120_000;
const DEFAULT_BERT_TIMEOUT_MS = 120_000;

function resolveRagPaths() {
  const ragDir = process.env.RAG_DIR
    ? path.resolve(process.cwd(), process.env.RAG_DIR)
    : path.resolve(process.cwd(), "RAG");

  const dataDir = process.env.RAG_DATA_DIR
    ? path.resolve(process.cwd(), process.env.RAG_DATA_DIR)
    : path.resolve(ragDir, "rag_data");

  return { ragDir, dataDir };
}

async function ensurePathExists(targetPath: string): Promise<void> {
  await access(targetPath);
}

async function ensureRagArtifacts(ragDir: string, dataDir: string): Promise<void> {
  await Promise.all([
    ensurePathExists(path.join(ragDir, "qa.py")),
    ensurePathExists(path.join(dataDir, "chunks.jsonl")),
    ensurePathExists(path.join(dataDir, "bm25.json")),
    ensurePathExists(path.join(dataDir, "embeddings.npy")),
  ]);
}

function resolveBertPaths() {
  const bertDir = process.env.BERT_DIR
    ? path.resolve(process.cwd(), process.env.BERT_DIR)
    : path.resolve(process.cwd(), "BERT");

  return {
    bertDir,
    predictScript: path.join(bertDir, "predict.py"),
    clauseModelDir: path.join(bertDir, "distilbert_clause_saved"),
    typeModelDir: path.join(bertDir, "deberta_type_saved"),
  };
}

async function ensureBertArtifacts(bertDir: string): Promise<void> {
  await Promise.all([
    ensurePathExists(path.join(bertDir, "predict.py")),
    ensurePathExists(path.join(bertDir, "distilbert_clause_saved", "config.json")),
    ensurePathExists(path.join(bertDir, "distilbert_clause_saved", "model.safetensors")),
    ensurePathExists(path.join(bertDir, "distilbert_clause_saved", "id2clause.json")),
    ensurePathExists(path.join(bertDir, "deberta_type_saved", "config.json")),
    ensurePathExists(path.join(bertDir, "deberta_type_saved", "model.safetensors")),
    ensurePathExists(path.join(bertDir, "deberta_type_saved", "id2type.json")),
  ]);
}

function parseJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("RAG process returned empty output.");
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error("RAG process did not return JSON output.");
    }

    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }
}

function parseRagQaResponse(raw: string): RagQaResponse {
  const parsed = parseJsonObject(raw);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid JSON payload from RAG process.");
  }

  const payload = parsed as Partial<RagQaResponse>;
  if (typeof payload.response !== "string" || payload.response.trim().length === 0) {
    throw new Error("RAG response is missing a valid `response` field.");
  }

  if (!Array.isArray(payload.reference_source)) {
    throw new Error("RAG response is missing `reference_source` array.");
  }

  const confidence =
    typeof payload.confidence_score === "number" ? payload.confidence_score : 0.5;

  return {
    response: payload.response,
    reference_source: payload.reference_source
      .filter(
        (item): item is RagReferenceSource =>
          typeof item?.doc_title === "string" &&
          typeof item?.pages === "string" &&
          typeof item?.snippet === "string",
      )
      .slice(0, 8),
    confidence_score: Number.isFinite(confidence) ? confidence : 0.5,
  };
}

function parseBertPredictResponse(raw: string): BertPredictResponse {
  const parsed = parseJsonObject(raw);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid JSON payload from BERT classifier.");
  }

  const payload = parsed as Partial<BertPredictResponse>;
  if (typeof payload.classification !== "string") {
    throw new Error("BERT response is missing `classification`.");
  }

  if (typeof payload.predicted_clause !== "string") {
    throw new Error("BERT response is missing `predicted_clause`.");
  }

  if (!Array.isArray(payload.top_clauses)) {
    throw new Error("BERT response is missing `top_clauses`.");
  }

  return {
    classification: payload.classification,
    classification_confidence:
      typeof payload.classification_confidence === "number"
        ? payload.classification_confidence
        : 0.5,
    predicted_clause: payload.predicted_clause,
    clause_confidence:
      typeof payload.clause_confidence === "number" ? payload.clause_confidence : 0.5,
    top_clauses: payload.top_clauses.filter(
      (item): item is BertTopClause =>
        typeof item?.clause_id === "string" && typeof item?.probability === "number",
    ),
  };
}

const AVAILABLE_CLAUSE_SUGGESTIONS: ClauseSuggestion[] = CLAUSE_LIBRARY_SECTIONS.flatMap(
  (section) => section.subclauses.map((subclause) => ({
    clauseId: subclause.id,
    title: subclause.title,
    probability: 0,
  })),
);

const CLAUSE_BY_ID = new Map(
  AVAILABLE_CLAUSE_SUGGESTIONS.map((item) => [item.clauseId, item]),
);

function normalizeToLibraryClause(clauseId: string): string {
  const trimmed = clauseId.trim();
  if (!trimmed) {
    return "8.7";
  }

  if (CLAUSE_BY_ID.has(trimmed)) {
    return trimmed;
  }

  const pieces = trimmed.split(".");
  while (pieces.length > 1) {
    pieces.pop();
    const candidate = pieces.join(".");
    if (CLAUSE_BY_ID.has(candidate)) {
      return candidate;
    }
  }

  const root = pieces[0];
  const firstRootMatch = AVAILABLE_CLAUSE_SUGGESTIONS.find((item) =>
    item.clauseId.startsWith(`${root}.`),
  );
  if (firstRootMatch) {
    return firstRootMatch.clauseId;
  }

  return "8.7";
}

function normalizeClassification(label: string): Classification {
  return label.trim().toUpperCase() === "OFI" ? "OFI" : "NC";
}

function getTopClauseSuggestions(topClauses: BertTopClause[]): ClauseSuggestion[] {
  const normalized = new Map<string, number>();

  for (const item of topClauses) {
    const clauseId = normalizeToLibraryClause(item.clause_id);
    const probability = clampZeroToOne(item.probability);
    const current = normalized.get(clauseId) ?? 0;
    if (probability > current) {
      normalized.set(clauseId, probability);
    }
  }

  if (normalized.size === 0) {
    return [
      {
        clauseId: "8.7",
        title: CLAUSE_BY_ID.get("8.7")?.title ?? "Control of nonconforming outputs",
        probability: 0.5,
      },
    ];
  }

  return Array.from(normalized.entries())
    .map(([clauseId, probability]) => ({
      clauseId,
      title: CLAUSE_BY_ID.get(clauseId)?.title ?? `Clause ${clauseId}`,
      probability,
    }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5);
}

function getSalientPhrases(text: string): string[] {
  const sanitized = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "were",
    "from",
    "have",
    "has",
    "had",
    "into",
    "into",
    "but",
    "not",
    "are",
    "was",
    "audit",
    "finding",
  ]);

  const seen = new Set<string>();
  const tokens = sanitized
    .split(/\s+/)
    .filter((token) => token.length >= 4 && !stopWords.has(token));

  for (const token of tokens) {
    if (seen.size >= 6) {
      break;
    }

    seen.add(token);
  }

  return Array.from(seen);
}

function clampZeroToOne(value: number): number {
  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
}

function sanitizeSnippet(snippet: string): string {
  const clean = snippet.replace(/\s+/g, " ").trim();
  if (!clean) {
    return "Relevant excerpt retrieved from indexed references.";
  }

  return clean.slice(0, 320);
}

function resolvePythonBin(ragDir: string): string {
  if (process.env.BERT_PYTHON_BIN) {
    return process.env.BERT_PYTHON_BIN;
  }

  if (process.env.RAG_PYTHON_BIN) {
    return process.env.RAG_PYTHON_BIN;
  }

  if (process.env.PYTHON_BIN) {
    return process.env.PYTHON_BIN;
  }

  const localCandidates = [
    path.join(ragDir, ".venv", "Scripts", "python.exe"),
    path.join(process.cwd(), "RAG", ".venv", "Scripts", "python.exe"),
    path.join(process.cwd(), ".venv", "Scripts", "python.exe"),
  ];

  for (const candidate of localCandidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return "python";
}

function runRagQa(
  question: string,
  ragDir: string,
  dataDir: string,
): Promise<RagQaResponse> {
  const pythonBin = resolvePythonBin(ragDir);
  const scriptPath = path.join(ragDir, "qa.py");
  const timeoutMs = Number(process.env.RAG_TIMEOUT_MS ?? DEFAULT_RAG_TIMEOUT_MS);
  const args = [scriptPath, question, "--data_dir", dataDir];

  if (process.env.RAG_TOP_K) {
    args.push("--top_k", process.env.RAG_TOP_K);
  }

  if (process.env.RAG_ST_MODEL) {
    args.push("--st_model", process.env.RAG_ST_MODEL);
  }

  return new Promise((resolve, reject) => {
    const child = spawn(pythonBin, args, {
      cwd: ragDir,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    const timeoutHandle = setTimeout(() => {
      child.kill();
      reject(
        new Error(
          `RAG process timed out after ${timeoutMs}ms. Set RAG_TIMEOUT_MS to a higher value if needed.`,
        ),
      );
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timeoutHandle);
      reject(
        new Error(
          `Unable to start Python for RAG. Configure RAG_PYTHON_BIN. Detail: ${error.message}`,
        ),
      );
    });

    child.on("close", (code) => {
      clearTimeout(timeoutHandle);

      if (code !== 0) {
        const detail = stderr.trim() || stdout.trim() || "No process output.";
        reject(new Error(`RAG process failed (exit ${code}): ${detail.slice(0, 500)}`));
        return;
      }

      try {
        resolve(parseRagQaResponse(stdout));
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Failed to parse RAG output."));
      }
    });
  });
}

function runBertPredict(findingText: string, bertDir: string): Promise<BertPredictResponse> {
  const pythonBin = resolvePythonBin(bertDir);
  const scriptPath = path.join(bertDir, "predict.py");
  const timeoutMs = Number(process.env.BERT_TIMEOUT_MS ?? DEFAULT_BERT_TIMEOUT_MS);
  const args = [scriptPath, "--bert_dir", bertDir, "--text", findingText];

  if (process.env.BERT_TOP_K) {
    args.push("--top_k", process.env.BERT_TOP_K);
  }

  return new Promise((resolve, reject) => {
    const child = spawn(pythonBin, args, {
      cwd: bertDir,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    const timeoutHandle = setTimeout(() => {
      child.kill();
      reject(
        new Error(
          `BERT classifier timed out after ${timeoutMs}ms. Set BERT_TIMEOUT_MS to a higher value if needed.`,
        ),
      );
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timeoutHandle);
      reject(
        new Error(
          `Unable to start Python for BERT classifier. Configure BERT_PYTHON_BIN or RAG_PYTHON_BIN. Detail: ${error.message}`,
        ),
      );
    });

    child.on("close", (code) => {
      clearTimeout(timeoutHandle);

      if (code !== 0) {
        const detail = stderr.trim() || stdout.trim() || "No process output.";
        reject(new Error(`BERT classifier failed (exit ${code}): ${detail.slice(0, 500)}`));
        return;
      }

      try {
        resolve(parseBertPredictResponse(stdout));
      } catch (error) {
        reject(
          error instanceof Error ? error : new Error("Failed to parse BERT classifier output."),
        );
      }
    });
  });
}

function shouldUseExternalByDefault(): boolean {
  const ragDir = process.env.RAG_DIR
    ? path.resolve(process.cwd(), process.env.RAG_DIR)
    : path.resolve(process.cwd(), "RAG");
  const bertDir = process.env.BERT_DIR
    ? path.resolve(process.cwd(), process.env.BERT_DIR)
    : path.resolve(process.cwd(), "BERT");

  return (
    existsSync(path.join(ragDir, "qa.py")) || existsSync(path.join(bertDir, "predict.py"))
  );
}

class ExternalModelProvider implements IModelProvider {
  getMetadata(): ModelProviderMetadata {
    return {
      name: process.env.MODEL_NAME || "python-rag-bert-provider",
      mode: "external",
      modelVersion: process.env.MODEL_VERSION || "qa.py + predict.py",
    };
  }

  async analyzeFinding(
    input: AnalyzeFindingRequest,
  ): Promise<AnalyzeFindingResponse> {
    const { bertDir } = resolveBertPaths();
    try {
      await ensureBertArtifacts(bertDir);
    } catch (error) {
      throw new Error(
        `BERT artifacts are missing. Expected classifier files under ${bertDir}. Detail: ${
          error instanceof Error ? error.message : "Unknown filesystem error"
        }`,
      );
    }

    const bertResult = await runBertPredict(input.findingText, bertDir);
    const classification = normalizeClassification(bertResult.classification);
    const topClauseSuggestions = getTopClauseSuggestions(bertResult.top_clauses);
    const suggestedClause = topClauseSuggestions[0] ?? {
      clauseId: "8.7",
      title: CLAUSE_BY_ID.get("8.7")?.title ?? "Control of nonconforming outputs",
      probability: 0.5,
    };
    const confidence = clampZeroToOne(
      (clampZeroToOne(bertResult.classification_confidence) + suggestedClause.probability) / 2,
    );

    const similarFindings =
      classification === "NC"
        ? [
            {
              id: "BERT-NC-001",
              excerpt: "Classifier aligned this text to a requirement gap pattern.",
              classification: "NC" as const,
            },
          ]
        : [
            {
              id: "BERT-OFI-001",
              excerpt: "Classifier aligned this text to an improvement-oriented pattern.",
              classification: "OFI" as const,
            },
          ];

    return {
      classification,
      confidence,
      suggestedClause,
      topClauseSuggestions,
      rationale: `BERT classifier predicted ${classification} and mapped the finding to clause ${suggestedClause.clauseId}.`,
      salientPhrases: getSalientPhrases(input.findingText),
      similarFindings,
      provider: this.getMetadata(),
      generatedAt: new Date().toISOString(),
    };
  }

  async askAssistant(input: AssistantAskRequest): Promise<AssistantAskResponse> {
    const { ragDir, dataDir } = resolveRagPaths();

    try {
      await ensureRagArtifacts(ragDir, dataDir);
    } catch (error) {
      throw new Error(
        `RAG index artifacts are missing. Expected qa.py and rag_data files under ${ragDir}. Detail: ${
          error instanceof Error ? error.message : "Unknown filesystem error"
        }`,
      );
    }

    const question = input.findingText
      ? `${input.query}\n\nFinding context:\n${input.findingText}`
      : input.query;

    const rag = await runRagQa(question, ragDir, dataDir);
    const citations = rag.reference_source.map((source, index) => ({
      title: source.doc_title.trim() || `Reference ${index + 1}`,
      clauseId: source.pages.trim() ? `pp. ${source.pages.trim()}` : `ref-${index + 1}`,
      snippet: sanitizeSnippet(source.snippet),
    }));

    const confidence = clampZeroToOne(rag.confidence_score);

    return {
      answer: rag.response.trim(),
      citations,
      guidance: [
        `RAG confidence score: ${confidence.toFixed(2)}.`,
        `Retrieved ${citations.length} source chunk${citations.length === 1 ? "" : "s"}.`,
        "Validate high-stakes decisions against cited documents and official policy.",
      ],
      provider: this.getMetadata(),
      generatedAt: new Date().toISOString(),
    };
  }
}

export function getModelProvider(): IModelProvider {
  const inferredDefaultMode = shouldUseExternalByDefault() ? "external" : "mock";
  const mode = (process.env.MODEL_PROVIDER ?? inferredDefaultMode).toLowerCase();
  if (mode === "external") {
    return new ExternalModelProvider();
  }

  return new MockModelProvider();
}
