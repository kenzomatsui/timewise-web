import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  User,
  Clock,
  BarChart3,
  MessageSquare,
  LogOut,
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { signOut } = useClerk();
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/tasks", icon: CheckSquare, label: "Tasks" },
    { path: "/agenda", icon: Calendar, label: "Agenda" },
    { path: "/appointments", icon: Clock, label: "Appointments" },
    { path: "/reports", icon: BarChart3, label: "Reports" },
    { path: "/assistant", icon: MessageSquare, label: "Assistant" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r border-border bg-card">
        <div className="flex h-16 items-center justify-center border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">TimeWise</h1>
        </div>
        <nav className="flex flex-col gap-2 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
          <Button
            variant="ghost"
            className="mt-auto w-full justify-start text-destructive hover:text-destructive"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
