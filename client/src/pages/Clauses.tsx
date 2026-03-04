import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AnalyzeFindingResponse, ClauseItem, ClauseSection } from "@shared/schema";
import { Search, ChevronRight, BookOpen, FileText, ChevronDown, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { analyzeFinding, getClauseLibrary } from "@/lib/model-api";

function classificationLabel(classification: AnalyzeFindingResponse["classification"]): string {
  return classification === "NC" ? "Non-Conformity (NC)" : "Opportunity for Improvement (OFI)";
}

function findClauseByIdOrPrefix(
  sections: ClauseSection[],
  clauseId: string,
): { sectionId: string; clause: ClauseItem } | null {
  for (const section of sections) {
    const exact = section.subclauses.find((subclause) => subclause.id === clauseId);
    if (exact) {
      return { sectionId: section.id, clause: exact };
    }
  }

  const parts = clauseId.split(".");
  while (parts.length > 1) {
    parts.pop();
    const prefix = parts.join(".");
    for (const section of sections) {
      const candidate = section.subclauses.find((subclause) => subclause.id === prefix);
      if (candidate) {
        return { sectionId: section.id, clause: candidate };
      }
    }
  }

  return null;
}

export default function Clauses() {
  const [search, setSearch] = useState("");
  const [selectedClause, setSelectedClause] = useState<ClauseItem | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [findingDraft, setFindingDraft] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalyzeFindingResponse | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [classifyError, setClassifyError] = useState<string | null>(null);

  const clauseQuery = useQuery({
    queryKey: ["clauses-library"],
    queryFn: getClauseLibrary,
  });

  const sections = clauseQuery.data?.sections ?? [];
  const standard = clauseQuery.data?.standard ?? "ISO 9001:2015";

  useEffect(() => {
    if (!sections.length) return;
    if (!selectedClause) {
      setSelectedClause(sections[0].subclauses[0] ?? null);
    }
    if (!expandedSection) {
      setExpandedSection(sections[0].id);
    }
  }, [sections, selectedClause, expandedSection]);

  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections;

    const normalized = search.toLowerCase();
    return sections
      .map((section) => {
        const sectionMatches =
          `${section.id} ${section.title}`.toLowerCase().includes(normalized);
        const filteredSubclauses = section.subclauses.filter((sub) =>
          `${sub.id} ${sub.title}`.toLowerCase().includes(normalized),
        );

        if (sectionMatches) {
          return section;
        }

        return {
          ...section,
          subclauses: filteredSubclauses,
        };
      })
      .filter((section) => section.subclauses.length > 0) as ClauseSection[];
  }, [sections, search]);

  const handleClassifyFinding = async () => {
    const findingText = findingDraft.trim();
    if (!findingText) return;

    setIsClassifying(true);
    setClassifyError(null);

    try {
      const response = await analyzeFinding({
        findingText,
        evidenceRefs: [],
      });
      setAnalysisResult(response);

      const match = findClauseByIdOrPrefix(sections, response.suggestedClause.clauseId);
      if (match) {
        setSelectedClause(match.clause);
        setExpandedSection(match.sectionId);
      }
    } catch (error) {
      setClassifyError(error instanceof Error ? error.message : "Failed to classify finding.");
      setAnalysisResult(null);
    } finally {
      setIsClassifying(false);
    }
  };

  if (clauseQuery.isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading clause library...</div>
      </div>
    );
  }

  if (clauseQuery.isError) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-sm text-red-600">Failed to load clause library.</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clauses..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredSections.map((section) => (
              <div key={section.id} className="space-y-1">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between font-semibold",
                    expandedSection === section.id ? "bg-muted/50" : "",
                  )}
                  onClick={() =>
                    setExpandedSection(expandedSection === section.id ? null : section.id)
                  }
                >
                  <span className="truncate">
                    {section.id}. {section.title}
                  </span>
                  {expandedSection === section.id ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </Button>

                {expandedSection === section.id && (
                  <div className="ml-4 border-l pl-2 space-y-1 animate-in slide-in-from-left-2 duration-200">
                    {section.subclauses.map((sub) => (
                      <Button
                        key={sub.id}
                        variant={selectedClause?.id === sub.id ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start text-sm h-auto py-2 whitespace-normal text-left",
                          selectedClause?.id === sub.id
                            ? "font-medium text-primary"
                            : "text-muted-foreground",
                        )}
                        onClick={() => setSelectedClause(sub)}
                      >
                        <span className="mr-2 font-mono text-xs">{sub.id}</span>
                        {sub.title}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <Card className="lg:col-span-2 h-full flex flex-col overflow-hidden">
        <CardHeader className="border-b bg-muted/10 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {standard}
            </Badge>
            <Badge variant="outline">Quality Management</Badge>
          </div>
          <CardTitle className="text-2xl font-heading flex items-center gap-3">
            <span className="text-muted-foreground font-mono font-normal opacity-50">
              {selectedClause?.id ?? "-"}
            </span>
            {selectedClause?.title ?? "Select a clause"}
          </CardTitle>
        </CardHeader>
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-3xl space-y-8">
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Clause Classifier
              </h3>
              <div className="rounded-xl border p-4 bg-muted/20 not-prose space-y-3">
                <Textarea
                  className="min-h-28"
                  placeholder="Paste an audit finding, then run the BERT classifier to map it to the closest clause."
                  value={findingDraft}
                  onChange={(e) => setFindingDraft(e.target.value)}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={handleClassifyFinding}
                    disabled={!findingDraft.trim() || isClassifying}
                    className="gap-2"
                  >
                    <Sparkles className={cn("h-4 w-4", isClassifying ? "animate-spin" : "")} />
                    {isClassifying ? "Classifying..." : "Classify Finding"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setFindingDraft("");
                      setAnalysisResult(null);
                      setClassifyError(null);
                    }}
                  >
                    Clear
                  </Button>
                </div>

                {classifyError && (
                  <p className="text-sm text-red-600">{classifyError}</p>
                )}

                {analysisResult && (
                  <div className="space-y-3 text-sm">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary">
                        {classificationLabel(analysisResult.classification)}
                      </Badge>
                      <Badge variant="outline">
                        Confidence: {Math.round(analysisResult.confidence * 100)}%
                      </Badge>
                      <Badge variant="outline">{analysisResult.provider.name}</Badge>
                    </div>
                    <p className="text-muted-foreground">{analysisResult.rationale}</p>
                    <div className="space-y-2">
                      {analysisResult.topClauseSuggestions.slice(0, 3).map((suggestion) => (
                        <button
                          key={suggestion.clauseId}
                          type="button"
                          className="w-full text-left border rounded-md px-3 py-2 hover:bg-background transition-colors"
                          onClick={() => {
                            const match = findClauseByIdOrPrefix(sections, suggestion.clauseId);
                            if (match) {
                              setSelectedClause(match.clause);
                              setExpandedSection(match.sectionId);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-medium">
                              {suggestion.clauseId} {suggestion.title}
                            </span>
                            <Badge variant="outline">
                              {Math.round(suggestion.probability * 100)}%
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Requirement
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Clause <strong>{selectedClause?.id ?? "-"}</strong> ({selectedClause?.title ?? "N/A"})
                is loaded from the backend clause library API. Detailed clause bodies can be connected
                next by extending `/api/clauses` payload without changing this view contract.
              </p>

              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 mt-8">
                <FileText className="h-5 w-5 text-primary" />
                Related Internal Documents
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group">
                  <div className="h-10 w-10 bg-red-100 text-red-600 rounded flex items-center justify-center shrink-0">
                    PDF
                  </div>
                  <div>
                    <div className="font-medium group-hover:text-primary transition-colors">
                      QM-001 Quality Manual
                    </div>
                    <div className="text-xs text-muted-foreground">Rev 4.0 - Updated 2 days ago</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group">
                  <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded flex items-center justify-center shrink-0">
                    DOC
                  </div>
                  <div>
                    <div className="font-medium group-hover:text-primary transition-colors">
                      SOP-04-01 Context Analysis
                    </div>
                    <div className="text-xs text-muted-foreground">Rev 2.1 - Updated last month</div>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 mt-8">
                <Search className="h-5 w-5 text-primary" />
                Common Audit Findings
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-muted/30 rounded border border-transparent hover:border-border transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-[10px] border-red-200 text-red-700 bg-red-50">
                      NC
                    </Badge>
                    <span className="text-xs text-muted-foreground">2 occurrences</span>
                  </div>
                  <p className="text-sm">
                    Missing records or inconsistent execution related to the selected clause.
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded border border-transparent hover:border-border transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <Badge
                      variant="outline"
                      className="text-[10px] border-amber-200 text-amber-700 bg-amber-50"
                    >
                      OFI
                    </Badge>
                    <span className="text-xs text-muted-foreground">5 occurrences</span>
                  </div>
                  <p className="text-sm">
                    Process controls are present but could be tightened for stronger consistency.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
