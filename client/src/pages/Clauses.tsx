import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronRight, BookOpen, FileText, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const clauses = [
  {
    id: "4",
    title: "Context of the organization",
    subclauses: [
      { id: "4.1", title: "Understanding the organization and its context" },
      { id: "4.2", title: "Understanding the needs and expectations of interested parties" },
      { id: "4.3", title: "Determining the scope of the quality management system" },
      { id: "4.4", title: "Quality management system and its processes" }
    ]
  },
  {
    id: "5",
    title: "Leadership",
    subclauses: [
      { id: "5.1", title: "Leadership and commitment" },
      { id: "5.2", title: "Policy" },
      { id: "5.3", title: "Organizational roles, responsibilities and authorities" }
    ]
  },
  {
    id: "6",
    title: "Planning",
    subclauses: [
      { id: "6.1", title: "Actions to address risks and opportunities" },
      { id: "6.2", title: "Quality objectives and planning to achieve them" },
      { id: "6.3", title: "Planning of changes" }
    ]
  },
  {
    id: "7",
    title: "Support",
    subclauses: [
      { id: "7.1", title: "Resources" },
      { id: "7.2", title: "Competence" },
      { id: "7.3", title: "Awareness" },
      { id: "7.4", title: "Communication" },
      { id: "7.5", title: "Documented information" }
    ]
  },
  {
    id: "8",
    title: "Operation",
    subclauses: [
      { id: "8.1", title: "Operational planning and control" },
      { id: "8.2", title: "Requirements for products and services" },
      { id: "8.3", title: "Design and development of products and services" },
      { id: "8.4", title: "Control of externally provided processes, products and services" },
      { id: "8.5", title: "Production and service provision" },
      { id: "8.6", title: "Release of products and services" },
      { id: "8.7", title: "Control of nonconforming outputs" }
    ]
  },
  {
    id: "9",
    title: "Performance evaluation",
    subclauses: [
      { id: "9.1", title: "Monitoring, measurement, analysis and evaluation" },
      { id: "9.2", title: "Internal audit" },
      { id: "9.3", title: "Management review" }
    ]
  },
  {
    id: "10",
    title: "Improvement",
    subclauses: [
      { id: "10.1", title: "General" },
      { id: "10.2", title: "Nonconformity and corrective action" },
      { id: "10.3", title: "Continual improvement" }
    ]
  }
];

export default function Clauses() {
  const [selectedClause, setSelectedClause] = useState<any>(clauses[0].subclauses[0]);
  const [expandedSection, setExpandedSection] = useState<string | null>("4");

  return (
    <div className="h-[calc(100vh-8rem)] grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar Navigation */}
      <Card className="flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search clauses..." className="pl-9" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {clauses.map((section) => (
              <div key={section.id} className="space-y-1">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between font-semibold",
                    expandedSection === section.id ? "bg-muted/50" : ""
                  )}
                  onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
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
                        variant={selectedClause.id === sub.id ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start text-sm h-auto py-2 whitespace-normal text-left",
                          selectedClause.id === sub.id ? "font-medium text-primary" : "text-muted-foreground"
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

      {/* Main Content */}
      <Card className="lg:col-span-2 h-full flex flex-col overflow-hidden">
        <CardHeader className="border-b bg-muted/10 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">ISO 9001:2015</Badge>
            <Badge variant="outline">Quality Management</Badge>
          </div>
          <CardTitle className="text-2xl font-heading flex items-center gap-3">
            <span className="text-muted-foreground font-mono font-normal opacity-50">{selectedClause.id}</span>
            {selectedClause.title}
          </CardTitle>
        </CardHeader>
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-3xl space-y-8">
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Requirement
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                The organization shall determine external and internal issues that are relevant to its purpose and its strategic direction and that affect its ability to achieve the intended result(s) of its quality management system.
                <br /><br />
                The organization shall monitor and review information about these external and internal issues.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
                <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-1">Key Note</h4>
                <p className="text-sm text-blue-600 dark:text-blue-200">
                  Issues can include positive and negative factors or conditions for consideration. Understanding the external context can be facilitated by considering issues arising from legal, technological, competitive, market, cultural, social and economic environments, whether international, national, regional or local.
                </p>
              </div>

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
                    <div className="font-medium group-hover:text-primary transition-colors">QM-001 Quality Manual</div>
                    <div className="text-xs text-muted-foreground">Rev 4.0 • Updated 2 days ago</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group">
                  <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded flex items-center justify-center shrink-0">
                    DOC
                  </div>
                  <div>
                    <div className="font-medium group-hover:text-primary transition-colors">SOP-04-01 Context Analysis</div>
                    <div className="text-xs text-muted-foreground">Rev 2.1 • Updated last month</div>
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
                     <Badge variant="outline" className="text-[10px] border-red-200 text-red-700 bg-red-50">NC</Badge>
                     <span className="text-xs text-muted-foreground">2 occurrences</span>
                   </div>
                   <p className="text-sm">Failure to update SWOT analysis annually as required by procedure.</p>
                 </div>
                 <div className="p-3 bg-muted/30 rounded border border-transparent hover:border-border transition-colors">
                   <div className="flex items-center justify-between mb-1">
                     <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-700 bg-amber-50">OFI</Badge>
                     <span className="text-xs text-muted-foreground">5 occurrences</span>
                   </div>
                   <p className="text-sm">Consider including emerging technologies in external issue monitoring.</p>
                 </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}