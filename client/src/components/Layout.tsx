import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Bot, 
  Settings, 
  Menu,
  BookOpen,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { label: "Intake Findings", icon: FileText, href: "/intake" },
    { label: "Clause Library", icon: BookOpen, href: "/clauses" },
    { label: "RAG Assistant", icon: Bot, href: "/assistant" },
  ];

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out flex flex-col fixed h-full z-20",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-8 w-8 rounded bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center shrink-0">
               <span className="font-heading font-bold text-white text-lg">N</span>
            </div>
            {sidebarOpen && (
              <span className="font-heading font-bold text-lg whitespace-nowrap opacity-100 transition-opacity duration-300">
                Nisperos QMO
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 py-6 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div 
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors group",
                    isActive 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  data-testid={`nav-item-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground")} />
                  {sidebarOpen && <span>{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
             <Avatar className="h-9 w-9 border border-sidebar-border">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>JD</AvatarFallback>
             </Avatar>
             {sidebarOpen && (
               <div className="flex flex-col overflow-hidden">
                 <span className="text-sm font-medium truncate">Jane Doe</span>
                 <span className="text-xs text-sidebar-foreground/60 truncate">Lead Auditor</span>
               </div>
             )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300",
        sidebarOpen ? "ml-64" : "ml-16"
      )}>
        {/* Header */}
        <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <Button 
               variant="ghost" 
               size="icon" 
               onClick={() => setSidebarOpen(!sidebarOpen)}
               className="-ml-2 text-muted-foreground hover:text-foreground"
             >
               <Menu className="h-5 w-5" />
             </Button>
             <h1 className="text-lg font-semibold text-foreground hidden md:block">
               {navItems.find((i) => i.href === location)?.label || "Intake Findings"}
             </h1>
          </div>

          <div className="flex items-center gap-3">
             <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
               <Settings className="h-4 w-4" />
               <span>Settings</span>
             </Button>
             <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
               <Bell className="h-5 w-5" />
               <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-background"></span>
             </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
           {children}
        </div>
      </main>
    </div>
  );
}
