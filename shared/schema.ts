import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const classificationSchema = z.enum(["NC", "OFI"]);

export const clauseSuggestionSchema = z.object({
  clauseId: z.string().min(1),
  title: z.string().min(1),
  probability: z.number().min(0).max(1),
});

export const similarFindingSchema = z.object({
  id: z.string().min(1),
  excerpt: z.string().min(1),
  classification: classificationSchema,
});

export const modelProviderMetadataSchema = z.object({
  name: z.string().min(1),
  mode: z.enum(["mock", "external"]),
  modelVersion: z.string().min(1),
});

export const analyzeFindingRequestSchema = z.object({
  auditId: z.string().optional(),
  eventTag: z.string().optional(),
  observedAt: z.string().optional(),
  findingText: z.string().min(1),
  evidenceRefs: z.array(z.string().min(1)).default([]),
});

export const analyzeFindingResponseSchema = z.object({
  classification: classificationSchema,
  confidence: z.number().min(0).max(1),
  suggestedClause: clauseSuggestionSchema,
  topClauseSuggestions: z.array(clauseSuggestionSchema).min(1),
  rationale: z.string().min(1),
  salientPhrases: z.array(z.string().min(1)).default([]),
  similarFindings: z.array(similarFindingSchema).default([]),
  provider: modelProviderMetadataSchema,
  generatedAt: z.string().min(1),
});

export const findingStatusSchema = z.enum(["draft", "submitted", "reviewed"]);

export const findingSchema = z.object({
  id: z.string().min(1),
  auditId: z.string().optional(),
  eventTag: z.string().optional(),
  observedAt: z.string().optional(),
  findingText: z.string().min(1),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  analysis: analyzeFindingResponseSchema.optional(),
  status: findingStatusSchema,
  finalClassification: classificationSchema.optional(),
  finalClauseId: z.string().optional(),
  reviewerNotes: z.string().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const createFindingRequestSchema = z.object({
  auditId: z.string().optional(),
  eventTag: z.string().optional(),
  observedAt: z.string().optional(),
  findingText: z.string().min(1),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  analysis: analyzeFindingResponseSchema.optional(),
});

export const reviewFindingRequestSchema = z.object({
  classification: classificationSchema.optional(),
  clauseId: z.string().optional(),
  reviewerNotes: z.string().optional(),
});

export const auditTrailEntrySchema = z.object({
  id: z.string().min(1),
  findingId: z.string().min(1),
  eventType: z.enum(["model_prediction", "human_override", "status_change"]),
  payload: z.record(z.unknown()),
  createdAt: z.string().min(1),
});

export const assistantCitationSchema = z.object({
  title: z.string().min(1),
  clauseId: z.string().min(1),
  snippet: z.string().min(1),
});

export const assistantAskRequestSchema = z.object({
  query: z.string().min(1),
  findingText: z.string().optional(),
});

export const assistantAskResponseSchema = z.object({
  answer: z.string().min(1),
  citations: z.array(assistantCitationSchema).default([]),
  guidance: z.array(z.string().min(1)).default([]),
  provider: modelProviderMetadataSchema,
  generatedAt: z.string().min(1),
});

export const clauseItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
});

export const clauseSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subclauses: z.array(clauseItemSchema).default([]),
});

export const clauseLibraryResponseSchema = z.object({
  standard: z.string().min(1),
  sections: z.array(clauseSectionSchema),
});

export type Classification = z.infer<typeof classificationSchema>;
export type ClauseSuggestion = z.infer<typeof clauseSuggestionSchema>;
export type SimilarFinding = z.infer<typeof similarFindingSchema>;
export type ModelProviderMetadata = z.infer<typeof modelProviderMetadataSchema>;
export type AnalyzeFindingRequest = z.infer<typeof analyzeFindingRequestSchema>;
export type AnalyzeFindingResponse = z.infer<typeof analyzeFindingResponseSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type CreateFindingRequest = z.infer<typeof createFindingRequestSchema>;
export type ReviewFindingRequest = z.infer<typeof reviewFindingRequestSchema>;
export type AuditTrailEntry = z.infer<typeof auditTrailEntrySchema>;
export type AssistantCitation = z.infer<typeof assistantCitationSchema>;
export type AssistantAskRequest = z.infer<typeof assistantAskRequestSchema>;
export type AssistantAskResponse = z.infer<typeof assistantAskResponseSchema>;
export type ClauseItem = z.infer<typeof clauseItemSchema>;
export type ClauseSection = z.infer<typeof clauseSectionSchema>;
export type ClauseLibraryResponse = z.infer<typeof clauseLibraryResponseSchema>;
