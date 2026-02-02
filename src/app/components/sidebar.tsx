import { 
  LayoutDashboard, 
  Upload, 
  Sparkles, 
  Workflow, 
  Users, 
  FolderKanban, 
  Settings,
  Clock
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ElementType;
  id: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { label: "Upload CSV", icon: Upload, id: "upload-csv" },
  { label: "Lead Enrichment", icon: Sparkles, id: "lead-enrichment" },
  { label: "Automation Rules", icon: Workflow, id: "automation-rules" },
  { label: "Contacts", icon: Users, id: "contacts" },
  { label: "Campaigns", icon: FolderKanban, id: "campaigns" },
  { label: "History", icon: Clock, id: "history" },
  { label: "Settings", icon: Settings, id: "settings" },
];

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="font-semibold text-gray-900">LeadFlow</h1>
        <p className="text-sm text-gray-500 mt-1">Contact Enrichment</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                ${isActive 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-indigo-700">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">John Doe</p>
            <p className="text-xs text-gray-500 truncate">john@company.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}