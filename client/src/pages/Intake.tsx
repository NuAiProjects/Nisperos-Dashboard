import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  UploadCloud, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  ChevronRight,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Intake() {
  const [findingText, setFindingText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simulate AI delay
    setTimeout(() => {
      setAnalysisResult({
        classification: "Non-Conformity (NC)",
        confidence: 96,
        clause: "8.5.2 Identification and Traceability",
        reasoning: "The finding mentions missing calibration tags which directly violates traceability requirements.",
        similarCases: 2
      });
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold">New Audit Finding</h2>
          <p className="text-muted-foreground">Enter audit observations for AI classification and processing.</p>
        </div>
        <Button variant="ghost" className="text-muted-foreground">Cancel</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Intake Form */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Finding Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Audit ID</Label>
                  <Input placeholder="AUD-2024-XXX" />
                </div>
                <div className="space-y-2">
                  <Label>Date of Observation</Label>
                  <Input type="date" />
                </div>
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
                <Label>Evidence</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:bg-muted/30 transition-colors cursor-pointer">
                  <UploadCloud className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground">Images, PDF, or Docx (Max 10MB)</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between border-t bg-muted/10 p-4">
              <Button variant="outline" onClick={() => setFindingText("During the site tour of the warehouse, it was observed that three measuring devices (calipers) did not have valid calibration stickers. The operator stated they were 'for reference only' but they were found on the active production line being used for final inspection.")}>
                Load Sample Text
              </Button>
              <Button 
                onClick={handleAnalyze} 
                disabled={!findingText || isAnalyzing}
                className="bg-primary hover:bg-primary/90"
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" /> Analyze with AI
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* AI Sidebar Panel */}
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
                      AI Assistant
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Enter finding text and click "Analyze" to get instant classification suggestions, clause mapping, and similar historical cases.
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {/* Classification Result */}
                <Card className="border-l-4 border-l-red-500 overflow-hidden">
                  <div className="bg-red-500/10 p-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-red-700 dark:text-red-400">Suggested Classification</span>
                    <Badge variant="outline" className="bg-background/50 border-red-200 text-red-700">96% Confidence</Badge>
                  </div>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <h3 className="font-bold text-lg">Non-Conformity (NC)</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">
                      Based on keywords "missing calibration", "production line", and "final inspection".
                    </p>
                    
                    <Separator className="my-3" />
                    
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Suggested Clause</span>
                      <div className="flex items-start gap-2 p-2 bg-muted rounded text-sm">
                        <FileText className="h-4 w-4 mt-0.5 text-primary" />
                        <div>
                          <span className="font-medium text-primary">8.5.2</span>
                          <p className="text-muted-foreground">Identification and Traceability</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/20 p-2 flex gap-2">
                    <Button size="sm" className="w-full bg-red-600 hover:bg-red-700 text-white">Confirm NC</Button>
                    <Button size="sm" variant="outline" className="w-full">Override</Button>
                  </CardFooter>
                </Card>

                {/* Similar Cases */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Similar Historical Findings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-xs p-2 hover:bg-muted rounded cursor-pointer border border-transparent hover:border-border transition-colors">
                      <div className="font-medium text-foreground">AUD-2023-112</div>
                      <div className="text-muted-foreground line-clamp-2">Missing calibration status on heat treatment oven...</div>
                    </div>
                    <Separator />
                     <div className="text-xs p-2 hover:bg-muted rounded cursor-pointer border border-transparent hover:border-border transition-colors">
                      <div className="font-medium text-foreground">AUD-2022-045</div>
                      <div className="text-muted-foreground line-clamp-2">Scale #4 used for shipping weight verification expired...</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="pt-4">
             <Button className="w-full" size="lg" disabled={!analysisResult}>
               Submit Finding
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}