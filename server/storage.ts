import {
  type AuditTrailEntry,
  type CreateFindingRequest,
  type Finding,
  type InsertUser,
  type ReviewFindingRequest,
  type User,
} from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createFinding(input: CreateFindingRequest): Promise<Finding>;
  listFindings(): Promise<Finding[]>;
  getFinding(id: string): Promise<Finding | undefined>;
  reviewFinding(id: string, input: ReviewFindingRequest): Promise<Finding | undefined>;
  createAuditTrailEntry(entry: Omit<AuditTrailEntry, "id" | "createdAt">): Promise<AuditTrailEntry>;
  listAuditTrailByFindingId(findingId: string): Promise<AuditTrailEntry[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private findings: Map<string, Finding>;
  private auditTrail: Map<string, AuditTrailEntry[]>;

  constructor() {
    this.users = new Map();
    this.findings = new Map();
    this.auditTrail = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createFinding(input: CreateFindingRequest): Promise<Finding> {
    const now = new Date().toISOString();
    const finding: Finding = {
      id: randomUUID(),
      auditId: input.auditId,
      eventTag: input.eventTag,
      observedAt: input.observedAt,
      findingText: input.findingText,
      evidenceRefs: input.evidenceRefs ?? [],
      analysis: input.analysis,
      status: input.analysis ? "submitted" : "draft",
      finalClassification: input.analysis?.classification,
      finalClauseId: input.analysis?.suggestedClause.clauseId,
      reviewerNotes: undefined,
      createdAt: now,
      updatedAt: now,
    };

    this.findings.set(finding.id, finding);
    return finding;
  }

  async listFindings(): Promise<Finding[]> {
    return Array.from(this.findings.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  async getFinding(id: string): Promise<Finding | undefined> {
    return this.findings.get(id);
  }

  async reviewFinding(
    id: string,
    input: ReviewFindingRequest,
  ): Promise<Finding | undefined> {
    const existing = this.findings.get(id);
    if (!existing) {
      return undefined;
    }

    const updated: Finding = {
      ...existing,
      finalClassification: input.classification ?? existing.finalClassification,
      finalClauseId: input.clauseId ?? existing.finalClauseId,
      reviewerNotes: input.reviewerNotes ?? existing.reviewerNotes,
      status: "reviewed",
      updatedAt: new Date().toISOString(),
    };

    this.findings.set(id, updated);
    return updated;
  }

  async createAuditTrailEntry(
    entry: Omit<AuditTrailEntry, "id" | "createdAt">,
  ): Promise<AuditTrailEntry> {
    const created: AuditTrailEntry = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...entry,
    };

    const existing = this.auditTrail.get(entry.findingId) ?? [];
    existing.push(created);
    this.auditTrail.set(entry.findingId, existing);
    return created;
  }

  async listAuditTrailByFindingId(findingId: string): Promise<AuditTrailEntry[]> {
    return this.auditTrail.get(findingId) ?? [];
  }
}

export const storage = new MemStorage();
