import type {
  AnalyzeFindingRequest,
  AnalyzeFindingResponse,
  AssistantAskRequest,
  AssistantAskResponse,
  ClauseSuggestion,
  Classification,
  ModelProviderMetadata,
} from "@shared/schema";
import { CLAUSE_LIBRARY_SECTIONS } from "@shared/clause-library";
import type { IModelProvider } from "./provider";

type ClauseRule = {
  suggestion: ClauseSuggestion;
  keywords: string[];
};

const CLAUSE_RULES: ClauseRule[] = [
  {
    suggestion: {
      clauseId: "8.7",
      title: "Control of nonconforming outputs",
      probability: 0,
    },
    keywords: ["nonconform", "defect", "rework", "reject", "failed", "out of spec"],
  },
  {
    suggestion: {
      clauseId: "8.5",
      title: "Production and service provision",
      probability: 0,
    },
    keywords: ["production", "inspection", "process", "line", "operation"],
  },
  {
    suggestion: { clauseId: "7.2", title: "Competence", probability: 0 },
    keywords: ["training", "competence", "qualified", "skill", "awareness"],
  },
  {
    suggestion: { clauseId: "7.5", title: "Documented information", probability: 0 },
    keywords: ["record", "document", "procedure", "form", "logbook"],
  },
  {
    suggestion: { clauseId: "9.2", title: "Internal audit", probability: 0 },
    keywords: ["audit", "audit plan", "audit report", "checklist"],
  },
  {
    suggestion: {
      clauseId: "10.2",
      title: "Nonconformity and corrective action",
      probability: 0,
    },
    keywords: ["corrective action", "root cause", "containment", "ncr"],
  },
];

const NEGATIVE_CUES = [
  "missing",
  "expired",
  "not",
  "no",
  "failed",
  "without",
  "incomplete",
  "nonconform",
];

const POSITIVE_CUES = ["improve", "opportunity", "consider", "recommend", "could"];

function getProviderMetadata(): ModelProviderMetadata {
  return {
    name: "mock-heuristic-provider",
    mode: "mock",
    modelVersion: "v1",
  };
}

function getClauseProbabilities(text: string): ClauseSuggestion[] {
  const lowered = text.toLowerCase();
  const rawScores = CLAUSE_RULES.map((rule) => {
    const score = rule.keywords.reduce(
      (acc, keyword) => (lowered.includes(keyword) ? acc + 1 : acc),
      0,
    );

    return {
      ...rule.suggestion,
      probability: score,
    };
  });

  const total = rawScores.reduce((acc, item) => acc + item.probability, 0);
  if (total === 0) {
    return [
      {
        clauseId: "8.7",
        title: "Control of nonconforming outputs",
        probability: 0.5,
      },
      {
        clauseId: "10.2",
        title: "Nonconformity and corrective action",
        probability: 0.3,
      },
      { clauseId: "7.5", title: "Documented information", probability: 0.2 },
    ];
  }

  return rawScores
    .map((item) => ({
      ...item,
      probability: item.probability / total,
    }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3);
}

function getClassification(text: string): Classification {
  const lowered = text.toLowerCase();
  const negative = NEGATIVE_CUES.filter((token) => lowered.includes(token)).length;
  const positive = POSITIVE_CUES.filter((token) => lowered.includes(token)).length;

  return negative >= positive ? "NC" : "OFI";
}

function getConfidence(
  classification: Classification,
  topClauseProbability: number,
): number {
  const baseline = classification === "NC" ? 0.7 : 0.62;
  return Math.min(0.98, baseline + topClauseProbability * 0.2);
}

function getSalientPhrases(text: string): string[] {
  const lowered = text.toLowerCase();
  const matched = [
    ...NEGATIVE_CUES.filter((token) => lowered.includes(token)),
    ...POSITIVE_CUES.filter((token) => lowered.includes(token)),
  ];

  const unique = Array.from(new Set(matched));
  return unique.slice(0, 6);
}

function getDefaultCitations() {
  return [
    {
      title: "Competence",
      clauseId: "7.2",
      snippet:
        "Determine necessary competence and retain evidence for personnel affecting QMS effectiveness.",
    },
    {
      title: "Documented information",
      clauseId: "7.5",
      snippet: "Documented information must be controlled and retained where required.",
    },
  ];
}

function clauseExists(clauseId: string): boolean {
  return CLAUSE_LIBRARY_SECTIONS.some((section) =>
    section.subclauses.some((subclause) => subclause.id === clauseId),
  );
}

export class MockModelProvider implements IModelProvider {
  getMetadata(): ModelProviderMetadata {
    return getProviderMetadata();
  }

  async analyzeFinding(
    input: AnalyzeFindingRequest,
  ): Promise<AnalyzeFindingResponse> {
    const topClauseSuggestions = getClauseProbabilities(input.findingText);
    const suggestedClause = topClauseSuggestions[0];
    const classification = getClassification(input.findingText);
    const confidence = getConfidence(classification, suggestedClause.probability);
    const salientPhrases = getSalientPhrases(input.findingText);
    const similarFindings =
      classification === "NC"
        ? [
            {
              id: "AUD-2024-014",
              excerpt: "Final inspection records were incomplete for two lots.",
              classification: "NC" as const,
            },
            {
              id: "AUD-2023-112",
              excerpt: "Calibration sticker missing on gauges used in production.",
              classification: "NC" as const,
            },
          ]
        : [
            {
              id: "AUD-2024-051",
              excerpt: "Opportunity to improve onboarding competency tracking.",
              classification: "OFI" as const,
            },
          ];

    return {
      classification,
      confidence,
      suggestedClause: clauseExists(suggestedClause.clauseId)
        ? suggestedClause
        : {
            clauseId: "8.7",
            title: "Control of nonconforming outputs",
            probability: 0.5,
          },
      topClauseSuggestions,
      rationale:
        salientPhrases.length > 0
          ? `Prediction based on detected cues: ${salientPhrases.join(", ")}.`
          : "Prediction based on general nonconformity and process language in the finding.",
      salientPhrases,
      similarFindings,
      provider: this.getMetadata(),
      generatedAt: new Date().toISOString(),
    };
  }

  async askAssistant(input: AssistantAskRequest): Promise<AssistantAskResponse> {
    const lowered = input.query.toLowerCase();

    if (lowered.includes("difference") && lowered.includes("nc") && lowered.includes("ofi")) {
      return {
        answer:
          "NC is a requirement not being fulfilled and usually needs containment plus corrective action. OFI is an improvement opportunity where requirements are mostly met but can be strengthened.",
        citations: [
          {
            title: "Nonconformity and corrective action",
            clauseId: "10.2",
            snippet: "React to the nonconformity and take action to control and correct it.",
          },
        ],
        guidance: [
          "Use NC for direct requirement gaps.",
          "Use OFI for improvement recommendations without clear requirement breach.",
        ],
        provider: this.getMetadata(),
        generatedAt: new Date().toISOString(),
      };
    }

    if (lowered.includes("9.3")) {
      return {
        answer:
          "Clause 9.3 requires top management to review QMS performance at planned intervals, including audit results, objectives, risks, and opportunities for improvement.",
        citations: [
          {
            title: "Management review",
            clauseId: "9.3",
            snippet: "Management review evaluates suitability, adequacy, effectiveness, and strategic alignment.",
          },
        ],
        guidance: [
          "Prepare review inputs before the meeting.",
          "Record outputs, decisions, and assigned actions.",
        ],
        provider: this.getMetadata(),
        generatedAt: new Date().toISOString(),
      };
    }

    return {
      answer:
        "Based on ISO 9001:2015, evaluate the finding against requirement intent, classify as NC or OFI, map the most relevant clause, and retain supporting documented information.",
      citations: getDefaultCitations(),
      guidance: [
        "Check if a requirement is explicitly unmet.",
        "Capture objective evidence in the finding record.",
        "Record final reviewer decision for audit trail.",
      ],
      provider: this.getMetadata(),
      generatedAt: new Date().toISOString(),
    };
  }
}
