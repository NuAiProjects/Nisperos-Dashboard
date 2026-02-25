import type {
  AnalyzeFindingRequest,
  AnalyzeFindingResponse,
  AssistantAskRequest,
  AssistantAskResponse,
  ModelProviderMetadata,
} from "@shared/schema";
import { MockModelProvider } from "./mock-provider";

export interface IModelProvider {
  getMetadata(): ModelProviderMetadata;
  analyzeFinding(input: AnalyzeFindingRequest): Promise<AnalyzeFindingResponse>;
  askAssistant(input: AssistantAskRequest): Promise<AssistantAskResponse>;
}

class ExternalModelProvider implements IModelProvider {
  getMetadata(): ModelProviderMetadata {
    return {
      name: process.env.MODEL_NAME || "external-model",
      mode: "external",
      modelVersion: process.env.MODEL_VERSION || "unconfigured",
    };
  }

  async analyzeFinding(
    _input: AnalyzeFindingRequest,
  ): Promise<AnalyzeFindingResponse> {
    throw new Error(
      "External model provider is not wired yet. Set MODEL_PROVIDER=mock until model integration is ready.",
    );
  }

  async askAssistant(_input: AssistantAskRequest): Promise<AssistantAskResponse> {
    throw new Error(
      "External model provider is not wired yet. Set MODEL_PROVIDER=mock until model integration is ready.",
    );
  }
}

export function getModelProvider(): IModelProvider {
  const mode = (process.env.MODEL_PROVIDER ?? "mock").toLowerCase();
  if (mode === "external") {
    return new ExternalModelProvider();
  }

  return new MockModelProvider();
}
