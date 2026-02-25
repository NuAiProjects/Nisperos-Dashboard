import type { Express } from "express";
import { type Server } from "http";
import {
  analyzeFindingRequestSchema,
  assistantAskRequestSchema,
  clauseLibraryResponseSchema,
  createFindingRequestSchema,
  reviewFindingRequestSchema,
} from "@shared/schema";
import {
  CLAUSE_LIBRARY_SECTIONS,
  CLAUSE_LIBRARY_STANDARD,
} from "@shared/clause-library";
import { storage } from "./storage";
import { getModelProvider } from "./model/provider";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const modelProvider = getModelProvider();

  app.get("/api/config/model", (_req, res) => {
    res.json({
      provider: modelProvider.getMetadata(),
      enabled: true,
    });
  });

  app.get("/api/clauses", (_req, res) => {
    const payload = {
      standard: CLAUSE_LIBRARY_STANDARD,
      sections: CLAUSE_LIBRARY_SECTIONS,
    };

    const parsed = clauseLibraryResponseSchema.parse(payload);
    res.json(parsed);
  });

  app.post("/api/model/analyze-finding", async (req, res) => {
    const parsed = analyzeFindingRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid analyze-finding request",
        errors: parsed.error.issues,
      });
    }

    try {
      const prediction = await modelProvider.analyzeFinding(parsed.data);
      return res.json(prediction);
    } catch (error) {
      return res.status(503).json({
        message: "Model provider unavailable",
        detail: error instanceof Error ? error.message : "Unknown provider error",
      });
    }
  });

  app.post("/api/assistant/ask", async (req, res) => {
    const parsed = assistantAskRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid assistant request",
        errors: parsed.error.issues,
      });
    }

    try {
      const answer = await modelProvider.askAssistant(parsed.data);
      return res.json(answer);
    } catch (error) {
      return res.status(503).json({
        message: "Model provider unavailable",
        detail: error instanceof Error ? error.message : "Unknown provider error",
      });
    }
  });

  app.get("/api/findings", async (_req, res) => {
    const findings = await storage.listFindings();
    return res.json(findings);
  });

  app.get("/api/findings/:id", async (req, res) => {
    const finding = await storage.getFinding(req.params.id);
    if (!finding) {
      return res.status(404).json({ message: "Finding not found" });
    }

    return res.json(finding);
  });

  app.post("/api/findings", async (req, res) => {
    const parsed = createFindingRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid finding request",
        errors: parsed.error.issues,
      });
    }

    const finding = await storage.createFinding(parsed.data);

    if (finding.analysis) {
      await storage.createAuditTrailEntry({
        findingId: finding.id,
        eventType: "model_prediction",
        payload: {
          classification: finding.analysis.classification,
          confidence: finding.analysis.confidence,
          suggestedClause: finding.analysis.suggestedClause,
        },
      });
    }

    return res.status(201).json(finding);
  });

  app.post("/api/findings/:id/review", async (req, res) => {
    const parsed = reviewFindingRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid review payload",
        errors: parsed.error.issues,
      });
    }

    const updated = await storage.reviewFinding(req.params.id, parsed.data);
    if (!updated) {
      return res.status(404).json({ message: "Finding not found" });
    }

    await storage.createAuditTrailEntry({
      findingId: updated.id,
      eventType: "human_override",
      payload: parsed.data,
    });

    return res.json(updated);
  });

  app.get("/api/findings/:id/audit-trail", async (req, res) => {
    const finding = await storage.getFinding(req.params.id);
    if (!finding) {
      return res.status(404).json({ message: "Finding not found" });
    }

    const trail = await storage.listAuditTrailByFindingId(req.params.id);
    return res.json(trail);
  });

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  return httpServer;
}
