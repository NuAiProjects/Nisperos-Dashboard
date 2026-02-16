import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Bot, 
  Send, 
  Sparkles, 
  BookOpen, 
  ThumbsUp, 
  ThumbsDown, 
  Copy,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: { title: string; clause: string }[];
};

export default function Assistant() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am your AI Auditor Assistant. I have access to the full ISO 9001:2015 library and your internal quality manual. How can I help you today?'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!query.trim()) return;

    const newMsg: Message = { id: Date.now().toString(), role: 'user', content: query };
    setMessages(prev => [...prev, newMsg]);
    setQuery("");
    setIsTyping(true);

    // Simulate RAG response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "According to ISO 9001:2015, organizations must determine the necessary competence of person(s) doing work under its control that affects the performance and effectiveness of the quality management system. Specifically, you need to retain documented information as evidence of competence.",
        citations: [
          { title: "Competence", clause: "7.2" },
          { title: "Documented Information", clause: "7.5" }
        ]
      }]);
      setIsTyping(false);
    }, 2000);
  };

  return (
    <div className="h-[calc(100vh-8rem)] grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Chat Area */}
      <div className="lg:col-span-3 flex flex-col h-full rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-sm">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">RAG Assistant</h3>
              <p className="text-xs text-muted-foreground">Powered by Claude 3.5 Sonnet & Nisperos Clause Library</p>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4 space-y-6">
          <div className="flex flex-col gap-6 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex gap-4 w-full max-w-2xl",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <Avatar className={cn(
                  "h-8 w-8",
                  msg.role === 'assistant' ? "bg-indigo-100 text-indigo-700 border-indigo-200" : "bg-slate-100 text-slate-700"
                )}>
                  {msg.role === 'assistant' ? (
                    <Bot className="h-5 w-5 p-0.5" />
                  ) : (
                    <AvatarFallback>JD</AvatarFallback>
                  )}
                </Avatar>

                <div className={cn(
                  "flex flex-col gap-2",
                  msg.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm shadow-sm",
                    msg.role === 'user' 
                      ? "bg-primary text-primary-foreground rounded-br-none" 
                      : "bg-muted/50 border rounded-bl-none"
                  )}>
                    {msg.content}
                  </div>
                  
                  {msg.citations && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {msg.citations.map((cite, i) => (
                        <Badge key={i} variant="outline" className="bg-background hover:bg-accent cursor-pointer gap-1 pl-1 pr-2 py-1 text-xs">
                           <div className="bg-indigo-100 text-indigo-700 px-1.5 rounded text-[10px] font-bold">
                             {cite.clause}
                           </div>
                           {cite.title}
                           <ExternalLink className="h-3 w-3 ml-1 opacity-50" />
                        </Badge>
                      ))}
                    </div>
                  )}

                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-green-600">
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-600">
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-4 max-w-2xl">
                <Avatar className="h-8 w-8 bg-indigo-100 text-indigo-700 border-indigo-200">
                  <Bot className="h-5 w-5 p-0.5" />
                </Avatar>
                <div className="bg-muted/50 border rounded-2xl rounded-bl-none p-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-background">
          <div className="max-w-3xl mx-auto relative">
             <Input 
               className="pr-24 pl-4 h-12 rounded-full shadow-sm border-muted-foreground/20 focus-visible:ring-indigo-500"
               placeholder="Ask about ISO clauses, specific findings, or procedures..." 
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
             />
             <div className="absolute right-1 top-1 flex items-center gap-1">
               <Button size="icon" variant="ghost" className="rounded-full text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
               </Button>
               <Button 
                 size="icon" 
                 className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white h-10 w-10 shadow-sm"
                 onClick={handleSend}
               >
                  <Send className="h-4 w-4" />
               </Button>
             </div>
          </div>
          <p className="text-center text-[10px] text-muted-foreground mt-3">
            AI can make mistakes. Verify critical compliance information against the official standard.
          </p>
        </div>
      </div>

      {/* Sidebar Suggestions */}
      <div className="hidden lg:flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Suggested Questions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {[
              "What is the difference between NC and OFI?",
              "Summarize the requirements for Clause 9.3",
              "How should we document non-conforming outputs?",
              "Draft a corrective action plan template"
            ].map((q, i) => (
              <Button 
                key={i} 
                variant="outline" 
                className="justify-start text-xs h-auto py-3 whitespace-normal text-left"
                onClick={() => {
                  setQuery(q);
                  // Optional: auto send
                }}
              >
                <Sparkles className="h-3 w-3 mr-2 shrink-0 text-indigo-500" />
                {q}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="flex-1 bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-950/20 dark:to-background border-indigo-100 dark:border-indigo-900/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-600" />
              Clause Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-1 text-indigo-900 dark:text-indigo-300">ISO 9001:2015 Structure</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono font-bold">4.0</span> Context
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono font-bold">5.0</span> Leadership
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono font-bold">6.0</span> Planning
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono font-bold">7.0</span> Support
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono font-bold">8.0</span> Operation
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}