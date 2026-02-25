import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Sparkles, AlertTriangle, FileText, CheckCircle } from "lucide-react";
import type { AnalyzeFindingResponse, Classification } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { analyzeFinding, createFinding, reviewFinding } from "@/lib/model-api";

function classificationLabel(value: Classification): string {
  return value === "NC" ? "Non-Conformity (NC)" : "Opportunity for Improvement (OFI)";
}

export default function Intake() {
  const [auditId, setAuditId] = useState("");
  const [eventTag, setEventTag] = useState("");
  const [observedAt, setObservedAt] = useState("");
  const [findingText, setFindingText] = useState("");
  const [evidenceRefInput, setEvidenceRefInput] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalyzeFindingResponse | null>(null);
  const [manualClassification, setManualClassification] = useState<Classification | null>(
    null,
  );
  const [manualClauseId, setManualClauseId] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const evidenceRefs = useMemo(
    () =>
      evidenceRefInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [evidenceRefInput],
  );

  const effectiveClassification = manualClassification ?? analysisResult?.classification;
  const effectiveClauseId = manualClauseId || analysisResult?.suggestedClause.clauseId;
  const effectiveClauseTitle =
    analysisResult?.topClauseSuggestions.find((item) => item.clauseId === effectiveClauseId)
      ?.title ?? analysisResult?.suggestedClause.title;

  const hasOverride =
    !!analysisResult &&
    ((manualClassification !== null &&
      manualClassification !== analysisResult.classification) ||
      (manualClauseId.length > 0 &&
        manualClauseId !== analysisResult.suggestedClause.clauseId));

  const resetStatus = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleAnalyze = async () => {
    if (!findingText.trim()) return;

    resetStatus();
    setIsAnalyzing(true);
    setManualClassification(null);
    setManualClauseId("");

    try {
      const result = await analyzeFinding({
        auditId: auditId || undefined,
        eventTag: eventTag || undefined,
        observedAt: observedAt || undefined,
        findingText,
        evidenceRefs,
      });
      setAnalysisResult(result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to analyze finding.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOverride = () => {
    if (!analysisResult) return;

    const flipped: Classification = analysisResult.classification === "NC" ? "OFI" : "NC";
    const alternativeClause = analysisResult.topClauseSuggestions[1];

    setManualClassification(flipped);
    if (alternativeClause) {
      setManualClauseId(alternativeClause.clauseId);
    }
  };

  const handleSubmit = async () => {
    if (!analysisResult) return;

    resetStatus();
    setIsSubmitting(true);
    try {
      const created = await createFinding({
        auditId: auditId || undefined,
        eventTag: eventTag || undefined,
        observedAt: observedAt || undefined,
        findingText,
        evidenceRefs,
        analysis: analysisResult,
      });

      if (hasOverride && effectiveClassification && effectiveClauseId) {
        await reviewFinding(created.id, {
          classification: effectiveClassification,
          clauseId: effectiveClauseId,
          reviewerNotes: "Manual override from intake review panel.",
        });
      }

      setSuccessMessage(`Finding submitted successfully. ID: ${created.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to submit finding.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold">New Audit Finding</h2>
          <p className="text-muted-foreground">
            Enter observations and run analysis through the model service API.
          </p>
        </div>
        <Button
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => {
            setAuditId("");
            setEventTag("");
            setObservedAt("");
            setFindingText("");
            setEvidenceRefInput("");
            setAnalysisResult(null);
            setManualClassification(null);
            setManualClauseId("");
            resetStatus();
          }}
        >
          Clear
        </Button>
      </div>

      {errorMessage && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-sm text-red-700">{errorMessage}</CardContent>
        </Card>
      )}
      {successMessage && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-6 text-sm text-emerald-700 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>{successMessage}</span>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Finding Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Audit ID</Label>
                  <Input
                    placeholder="AUD-2026-001"
                    value={auditId}
                    onChange={(e) => setAuditId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Observation</Label>
                  <Input
                    type="date"
                    value={observedAt}
                    onChange={(e) => setObservedAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Audit/Event Tag</Label>
                <Input
                  placeholder="Warehouse Process Audit"
                  value={eventTag}
                  onChange={(e) => setEventTag(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Finding Description</Label>
                <Textarea
                  className="min-h-[150px] font-sans"
                  placeholder="Describe the observation in detail..."
                  value={findingText}
                  onChange={(e) => setFindingText(e.target.value)}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {findingText.length} characters
                </p>
              </div>

              <div className="space-y-2">
                <Label>Evidence References (comma-separated)</Label>
                <Input
                  placeholder="IMG_001.jpg, CAPA-2026-04.pdf"
                  value={evidenceRefInput}
                  onChange={(e) => setEvidenceRefInput(e.target.value)}
                />
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <UploadCloud className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-foreground">Upload UI placeholder</p>
                  <p className="text-xs text-muted-foreground">
                    File upload backend can be added later without changing model contract.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between border-t bg-muted/10 p-4">
              <Button
                variant="outline"
                onClick={() =>
                  setFindingText(
                    "During the site tour of the warehouse, three measuring devices did not have valid calibration stickers and were still used for final inspection.",
                  )
                }
              >
                Load Sample Text
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={!findingText.trim() || isAnalyzing}
                className="bg-primary hover:bg-primary/90"
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze via API
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {!analysisResult ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="bg-muted/30 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Model Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    No analysis yet. The page is wired to `/api/model/analyze-finding`; currently
                    backed by mock provider until a real model is connected.
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <Card className="border-l-4 border-l-red-500 overflow-hidden">
                  <div className="bg-red-500/10 p-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-red-700 dark:text-red-400">
                      Suggested Classification
                    </span>
                    <Badge variant="outline" className="bg-background/50 border-red-200 text-red-700">
                      {Math.round(analysisResult.confidence * 100)}% Confidence
                    </Badge>
                  </div>
                  <CardContent className="pt-4">
                    {effectiveClassification && (
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <h3 className="font-bold text-lg">
                          {classificationLabel(effectiveClassification)}
                        </h3>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mb-4">
                      {analysisResult.rationale}
                    </p>

                    <Separator className="my-3" />

                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Suggested Clause
                      </span>
                      <div className="flex items-start gap-2 p-2 bg-muted rounded text-sm">
                        <FileText className="h-4 w-4 mt-0.5 text-primary" />
                        <div>
                          <span className="font-medium text-primary">{effectiveClauseId}</span>
                          <p className="text-muted-foreground">{effectiveClauseTitle}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Top Clause Suggestions
                      </span>
                      {analysisResult.topClauseSuggestions.map((item) => (
                        <div
                          key={item.clauseId}
                          className="flex items-center justify-between text-xs border rounded p-2"
                        >
                          <span>
                            {item.clauseId} {item.title}
                          </span>
                          <Badge variant="outline">
                            {Math.round(item.probability * 100)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/20 p-2 flex gap-2">
                    <Button
                      size="sm"
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => {
                        setManualClassification(analysisResult.classification);
                        setManualClauseId(analysisResult.suggestedClause.clauseId);
                      }}
                    >
                      Confirm
                    </Button>
                    <Button size="sm" variant="outline" className="w-full" onClick={handleOverride}>
                      Override
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Similar Historical Findings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analysisResult.similarFindings.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No similar findings available.</p>
                    ) : (
                      analysisResult.similarFindings.map((similar) => (
                        <div
                          key={similar.id}
                          className="text-xs p-2 hover:bg-muted rounded border border-transparent"
                        >
                          <div className="font-medium text-foreground">{similar.id}</div>
                          <div className="text-muted-foreground line-clamp-2">{similar.excerpt}</div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-4">
            <Button
              className="w-full"
              size="lg"
              disabled={!analysisResult || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Submitting..." : "Submit Finding"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
