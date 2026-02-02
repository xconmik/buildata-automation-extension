import { Sidebar } from "@/app/components/sidebar";
import { Header } from "@/app/components/header";
import { Dashboard } from "@/app/components/dashboard";
import { AutomationRules } from "@/app/components/automation-rules";
import { CSVUpload } from "@/app/components/csv-upload";
import { LeadEnrichment } from "@/app/components/lead-enrichment";
import { Contacts } from "@/app/components/contacts";
import { Campaigns } from "@/app/components/campaigns";
import { Settings } from "@/app/components/settings";
import { History } from "@/app/components/history";
import { useState } from "react";

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>("dashboard");

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {currentPage === "dashboard" && <Dashboard />}
          {currentPage === "upload-csv" && <CSVUpload />}
          {currentPage === "lead-enrichment" && <LeadEnrichment />}
          {currentPage === "automation-rules" && <AutomationRules />}
          {currentPage === "contacts" && <Contacts />}
          {currentPage === "campaigns" && <Campaigns />}
          {currentPage === "history" && <History />}
          {currentPage === "settings" && <Settings />}
        </main>
      </div>
    </div>
  );
}