import {
  analyzeFindingResponseSchema,
  assistantAskResponseSchema,
  clauseLibraryResponseSchema,
  findingSchema,
  type AnalyzeFindingRequest,
  type AnalyzeFindingResponse,
  type AssistantAskRequest,
  type AssistantAskResponse,
  type ClauseLibraryResponse,
  type CreateFindingRequest,
  type Finding,
  type ReviewFindingRequest,
} from "@shared/schema";
import { apiRequest } from "./queryClient";

export async function analyzeFinding(
  input: AnalyzeFindingRequest,
): Promise<AnalyzeFindingResponse> {
  const response = await apiRequest("POST", "/api/model/analyze-finding", input);
  const payload = await response.json();
  return analyzeFindingResponseSchema.parse(payload);
}

export async function askAssistant(
  input: AssistantAskRequest,
): Promise<AssistantAskResponse> {
  const response = await apiRequest("POST", "/api/assistant/ask", input);
  const payload = await response.json();
  return assistantAskResponseSchema.parse(payload);
}

export async function createFinding(input: CreateFindingRequest): Promise<Finding> {
  const response = await apiRequest("POST", "/api/findings", input);
  const payload = await response.json();
  return findingSchema.parse(payload);
}

export async function getClauseLibrary(): Promise<ClauseLibraryResponse> {
  const response = await apiRequest("GET", "/api/clauses");
  const payload = await response.json();
  return clauseLibraryResponseSchema.parse(payload);
}

export async function reviewFinding(
  findingId: string,
  input: ReviewFindingRequest,
): Promise<Finding> {
  const response = await apiRequest("POST", `/api/findings/${findingId}/review`, input);
  const payload = await response.json();
  return findingSchema.parse(payload);
}
