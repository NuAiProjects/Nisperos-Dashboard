import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { AlertCircle, CheckCircle2, TrendingUp, Clock, ArrowUpRight, FileText } from "lucide-react";
import { motion } from "framer-motion";

const data = [
  { name: 'Clause 4', nc: 4, ofi: 2 },
  { name: 'Clause 5', nc: 3, ofi: 5 },
  { name: 'Clause 6', nc: 2, ofi: 3 },
  { name: 'Clause 7', nc: 6, ofi: 4 },
  { name: 'Clause 8', nc: 8, ofi: 6 },
  { name: 'Clause 9', nc: 5, ofi: 2 },
  { name: 'Clause 10', nc: 3, ofi: 1 },
];

const trendData = [
  { month: 'Jan', nc: 12, ofi: 8 },
  { month: 'Feb', nc: 19, ofi: 12 },
  { month: 'Mar', nc: 15, ofi: 15 },
  { month: 'Apr', nc: 22, ofi: 10 },
  { month: 'May', nc: 18, ofi: 14 },
  { month: 'Jun', nc: 25, ofi: 18 },
];

const COLORS = ['#3b82f6', '#14b8a6', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-foreground">Operational Dashboard</h2>
          <p className="text-muted-foreground mt-1">Real-time overview of quality metrics and audit performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/reports">
            <Button variant="outline">Download Report</Button>
          </Link>
          <Link href="/intake">
            <Button>New Audit Finding</Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Findings</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">142</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <span className="text-emerald-500 flex items-center mr-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> +12%
                </span>
                from last month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open NCs</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <span className="text-red-500 flex items-center mr-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> +4
                </span>
                requiring attention
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting AI verification
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Resolution</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.2 Days</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <span className="text-emerald-500 flex items-center mr-1">
                  <TrendingUp className="h-3 w-3 mr-1" /> -12%
                </span>
                efficiency gain
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Findings Distribution by Clause</CardTitle>
            <CardDescription>
              Breakdown of Non-Conformities (NC) vs Opportunities for Improvement (OFI).
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}`} 
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px' 
                  }}
                />
                <Bar dataKey="nc" name="Non-Conformity" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ofi" name="OFI" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Trend Analysis</CardTitle>
            <CardDescription>
              6-month finding volume trend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorNc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOfi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px' 
                  }}
                />
                <Area type="monotone" dataKey="nc" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorNc)" />
                <Area type="monotone" dataKey="ofi" stroke="hsl(var(--chart-2))" fillOpacity={1} fill="url(#colorOfi)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Findings</CardTitle>
            <CardDescription>
              Latest audit entries and their AI classification status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { id: "AUD-2024-089", desc: "Incomplete training records for new hires in Q3.", type: "NC", status: "Verified", confidence: 98 },
                { id: "AUD-2024-090", desc: "Document control procedure needs update regarding cloud storage.", type: "OFI", status: "Pending Review", confidence: 85 },
                { id: "AUD-2024-091", desc: "Calibration certificates missing for device #4421.", type: "NC", status: "Verified", confidence: 92 },
                { id: "AUD-2024-092", desc: "Good practice observed in warehouse safety labeling.", type: "OFI", status: "Verified", confidence: 95 },
                { id: "AUD-2024-093", desc: "Management review meeting minutes delayed by 2 weeks.", type: "NC", status: "Flagged", confidence: 64 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{item.id}</span>
                      <Badge variant={item.type === 'NC' ? 'destructive' : 'secondary'} className="text-[10px] px-1 py-0 h-5">
                        {item.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 max-w-[300px]">{item.desc}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={item.status === 'Verified' ? 'default' : 'outline'} className="text-[10px]">
                      {item.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      AI Confidence: <span className={item.confidence > 90 ? "text-emerald-500 font-medium" : "text-amber-500 font-medium"}>{item.confidence}%</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>AI Model Performance</CardTitle>
            <CardDescription>
              Confusion indicators and accuracy metrics.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-6">
               <div className="space-y-2">
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-muted-foreground">Classification Accuracy</span>
                   <span className="font-bold">94.2%</span>
                 </div>
                 <div className="h-2 bg-secondary rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 w-[94.2%] rounded-full" />
                 </div>
               </div>
               
               <div className="space-y-2">
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-muted-foreground">Clause Prediction Precision</span>
                   <span className="font-bold">88.7%</span>
                 </div>
                 <div className="h-2 bg-secondary rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500 w-[88.7%] rounded-full" />
                 </div>
               </div>

               <div className="pt-4 grid grid-cols-2 gap-4">
                 <div className="p-4 bg-muted/40 rounded-lg text-center">
                   <div className="text-2xl font-bold text-foreground">1.2%</div>
                   <div className="text-xs text-muted-foreground">False Positive Rate</div>
                 </div>
                 <div className="p-4 bg-muted/40 rounded-lg text-center">
                   <div className="text-2xl font-bold text-foreground">2.8%</div>
                   <div className="text-xs text-muted-foreground">Human Correction Rate</div>
                 </div>
               </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}