import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Upload,
  FileText,
  BarChart3,
} from "lucide-react";

import DashboardPage from "@/pages/DashboardPage";
import UploadPage from "@/pages/UploadPage";
import RubricConfigPage from "@/pages/RubricConfigPage";
import CandidateDetailPage from "@/pages/CandidateDetailPage";

const navLinks = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/rubrics", label: "Rubrics", icon: FileText },
];

function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 z-40 h-screen w-64 border-r border-border bg-card flex flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight text-foreground">
            ScreenAI
          </h1>
          <p className="text-xs text-muted-foreground">Recruitment Screening</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`
            }
          >
            <link.icon className="w-4 h-4" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Capstone Design © 2026
        </p>
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <main className="flex-1 ml-64">
            <div className="p-6 lg:p-8 max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/rubrics" element={<RubricConfigPage />} />
                <Route
                  path="/candidates/:id"
                  element={<CandidateDetailPage />}
                />
              </Routes>
            </div>
          </main>
        </div>
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </BrowserRouter>
  );
}
