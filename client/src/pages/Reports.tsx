import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileBarChart, Download, Calendar, Filter, FileText, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { toast } = useToast();

  const handleDownload = (reportName: string) => {
    toast({
      title: "Generating Report",
      description: `Preparing ${reportName} for download...`,
    });
    setTimeout(() => {
      toast({
        title: "Download Ready",
        description: `${reportName} has been saved to your device.`,
        variant: "default", // Changed from "success" to "default" as "success" is not a standard variant in shadcn toast unless customized
      });
    }, 1500);
  };

  const reports = [
    {
      title: "Monthly Audit Summary",
      desc: "Comprehensive overview of all audits conducted, findings raised, and closure rates for the selected month.",
      type: "PDF",
      freq: "Monthly",
      tags: ["Management", "Overview"]
    },
    {
      title: "Non-Conformity Trend Analysis",
      desc: "Detailed breakdown of NCs by department, clause, and severity with 6-month historical trend.",
      type: "Excel",
      freq: "On Demand",
      tags: ["Analytics", "Quality"]
    },
    {
      title: "Auditor Performance Review",
      desc: "Metrics on auditor activity, finding quality, and report turnaround time.",
      type: "PDF",
      freq: "Quarterly",
      tags: ["HR", "Internal"]
    },
    {
      title: "Supplier Quality Report",
      desc: "Aggregated findings from external provider audits and incoming inspection data.",
      type: "PDF",
      freq: "Monthly",
      tags: ["Supply Chain", "External"]
    },
    {
      title: "Management Review Input",
      desc: "Standardized input pack for ISO 9001 Clause 9.3 Management Review meetings.",
      type: "PPTX",
      freq: "Annual",
      tags: ["Executive", "ISO 9001"]
    },
    {
      title: "Corrective Action Aging",
      desc: "List of all open CAPAs grouped by aging buckets (0-30, 31-60, 60-90, 90+ days).",
      type: "Excel",
      freq: "Weekly",
      tags: ["Operations", "Tracking"]
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight">Reports & Analytics</h2>
          <p className="text-muted-foreground mt-1">Generate and export compliance documentation and insights.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Select Period
          </Button>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report, i) => (
          <Card key={i} className="flex flex-col group hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  report.type === 'PDF' ? 'bg-red-100 text-red-600' : 
                  report.type === 'Excel' ? 'bg-emerald-100 text-emerald-600' : 
                  'bg-orange-100 text-orange-600'
                }`}>
                  <FileText className="h-5 w-5" />
                </div>
                <Badge variant="secondary" className="text-xs">{report.freq}</Badge>
              </div>
              <CardTitle className="text-lg">{report.title}</CardTitle>
              <CardDescription className="line-clamp-2">{report.desc}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex flex-wrap gap-2">
                {report.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="pt-0 gap-2">
              <Button className="w-full group-hover:bg-primary/90" onClick={() => handleDownload(report.title)}>
                <Download className="mr-2 h-4 w-4" /> Export {report.type}
              </Button>
              <Button variant="ghost" size="icon" title="Share Report">
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}