import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, AlertCircle, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const findings = [
  { id: "AUD-001", text: "Fire extinguisher in zone B expired last month.", aiClass: "NC", confidence: 98, clause: "7.1.3", status: "Pending" },
  { id: "AUD-002", text: "Operator manual was not available at the workstation.", aiClass: "NC", confidence: 92, clause: "7.5.3", status: "Pending" },
  { id: "AUD-003", text: "Consider adding a digital log for visitor entry to improve tracking.", aiClass: "OFI", confidence: 88, clause: "8.1", status: "Pending" },
  { id: "AUD-004", text: "Calibration sticker on micrometer is faded but legible.", aiClass: "OFI", confidence: 65, clause: "7.1.5", status: "Low Confidence" },
  { id: "AUD-005", text: "Emergency exit blocked by pallets during shift change.", aiClass: "NC", confidence: 99, clause: "6.1", status: "Pending" },
];

export default function Review() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold">Review Queue</h2>
          <p className="text-muted-foreground">Validate AI-classified findings before they are finalized.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input placeholder="Search findings..." className="pl-9 bg-background" />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="p-0">
          {/* Custom Header if needed, otherwise empty or minimal */}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead className="min-w-[300px]">Finding Description</TableHead>
                <TableHead className="w-[120px]">Suggested Type</TableHead>
                <TableHead className="w-[100px]">Confidence</TableHead>
                <TableHead className="w-[100px]">Clause</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {findings.map((f) => (
                <TableRow key={f.id} className="group">
                  <TableCell className="font-medium">{f.id}</TableCell>
                  <TableCell className="max-w-md truncate" title={f.text}>
                    {f.text}
                    {f.confidence < 70 && (
                       <div className="flex items-center gap-1 text-amber-600 text-xs mt-1">
                         <AlertCircle className="h-3 w-3" /> Low confidence - please verify carefully
                       </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={f.aiClass === 'NC' ? "border-red-200 bg-red-50 text-red-700" : "border-blue-200 bg-blue-50 text-blue-700"}>
                      {f.aiClass}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${f.confidence > 90 ? 'bg-emerald-500' : f.confidence > 70 ? 'bg-amber-500' : 'bg-red-500'}`} 
                          style={{ width: `${f.confidence}%` }} 
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{f.confidence}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">{f.clause}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="flex justify-center pt-4">
        <Button variant="outline" className="w-full max-w-xs">Load More</Button>
      </div>
    </div>
  );
}