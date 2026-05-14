import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  UploadCloud, 
  LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/brand-logo";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { role, logout } = useAuth();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["HR", "Manager", "Hiring Manager"] },
    { href: "/jobs", label: "Jobs (Manager)", icon: Briefcase, roles: ["HR", "Manager", "Hiring Manager"] },
    { href: "/candidates", label: "Candidates (Hiring Mgr)", icon: Users, roles: ["HR", "Hiring Manager", "Manager"] },
    { href: "/hr", label: "HR Portal", icon: UploadCloud, roles: ["HR"] },
  ];

  const visibleItems = navItems.filter(item => !role || item.roles.includes(role));

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
        <div className="p-5 border-b border-sidebar-border">
          <AppLogo size="sm" inverted />
          <div className="mt-2 text-xs text-sidebar-foreground/60 uppercase tracking-wider font-medium">
            {role || ""}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className="block">
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            onClick={logout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
