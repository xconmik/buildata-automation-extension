import { useState } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { Fragment } from "react";

interface HistoryRecord {
  id: number;
  companyName: string;
  domain: string;
  agent: string;
  disposition: "enriched" | "skipped" | "failed" | "invalid_email" | "duplicate";
  remarks: string;
  hq: string;
  timestamp: string;
  expandedDetails?: {
    attemptedAt: string;
    processTime: string;
    dataSource: string;
    validationScore: number;
    errorCode?: string;
  };
}

const historyData: HistoryRecord[] = [
  {
    id: 1,
    companyName: "Stripe Inc",
    domain: "stripe.com",
    agent: "ZoomInfo Agent",
    disposition: "enriched",
    remarks: "Successfully enriched with complete contact data",
    hq: "San Francisco, United States",
    timestamp: "2026-01-22 14:32:15",
    expandedDetails: {
      attemptedAt: "2026-01-22 14:32:10",
      processTime: "5.2s",
      dataSource: "ZoomInfo API v3.1",
      validationScore: 98,
    },
  },
  {
    id: 2,
    companyName: "Acme Corp",
    domain: "acmecorp.io",
    agent: "Validation Agent",
    disposition: "invalid_email",
    remarks: "Email pattern blocked by Proofpoint",
    hq: "Austin, United States",
    timestamp: "2026-01-22 14:28:42",
    expandedDetails: {
      attemptedAt: "2026-01-22 14:28:38",
      processTime: "4.1s",
      dataSource: "Email Validation Service",
      validationScore: 32,
      errorCode: "ERR_SMTP_BLOCKED",
    },
  },
  {
    id: 3,
    companyName: "TechStart Solutions",
    domain: "techstart.io",
    agent: "RocketReach Agent",
    disposition: "enriched",
    remarks: "Contact details verified and enriched",
    hq: "London, United Kingdom",
    timestamp: "2026-01-22 14:15:28",
    expandedDetails: {
      attemptedAt: "2026-01-22 14:15:22",
      processTime: "6.3s",
      dataSource: "RocketReach API v2.0",
      validationScore: 95,
    },
  },
  {
    id: 4,
    companyName: "GlobalTech Inc",
    domain: "globaltech.com",
    agent: "Automation Engine",
    disposition: "skipped",
    remarks: "Max invalid email limit reached",
    hq: "New York, United States",
    timestamp: "2026-01-22 14:10:55",
    expandedDetails: {
      attemptedAt: "2026-01-22 14:10:50",
      processTime: "0.8s",
      dataSource: "Internal Rules Engine",
      validationScore: 0,
      errorCode: "LIMIT_EXCEEDED",
    },
  },
  {
    id: 5,
    companyName: "InnovateLabs",
    domain: "innovatelabs.co",
    agent: "ZoomInfo Agent",
    disposition: "failed",
    remarks: "HQ not found on ZoomInfo",
    hq: "Unknown",
    timestamp: "2026-01-22 14:05:12",
    expandedDetails: {
      attemptedAt: "2026-01-22 14:05:08",
      processTime: "4.5s",
      dataSource: "ZoomInfo API v3.1",
      validationScore: 0,
      errorCode: "NOT_FOUND",
    },
  },
  {
    id: 6,
    companyName: "DataCorp Systems",
    domain: "datacorp.com",
    agent: "RocketReach Agent",
    disposition: "duplicate",
    remarks: "Company already exists in database",
    hq: "Toronto, Canada",
    timestamp: "2026-01-22 13:58:33",
    expandedDetails: {
      attemptedAt: "2026-01-22 13:58:30",
      processTime: "0.5s",
      dataSource: "Internal Database",
      validationScore: 0,
      errorCode: "DUPLICATE_ENTRY",
    },
  },
  {
    id: 7,
    companyName: "CloudFirst Technologies",
    domain: "cloudfirst.io",
    agent: "Validation Agent",
    disposition: "enriched",
    remarks: "All validations passed successfully",
    hq: "Berlin, Germany",
    timestamp: "2026-01-22 13:45:18",
    expandedDetails: {
      attemptedAt: "2026-01-22 13:45:12",
      processTime: "6.8s",
      dataSource: "Multiple Sources",
      validationScore: 96,
    },
  },
  {
    id: 8,
    companyName: "FinTech Solutions",
    domain: "fintechsol.com",
    agent: "ZoomInfo Agent",
    disposition: "invalid_email",
    remarks: "Invalid email format detected",
    hq: "Singapore, Singapore",
    timestamp: "2026-01-22 13:32:47",
    expandedDetails: {
      attemptedAt: "2026-01-22 13:32:42",
      processTime: "5.1s",
      dataSource: "Email Validation Service",
      validationScore: 28,
      errorCode: "INVALID_FORMAT",
    },
  },
  {
    id: 9,
    companyName: "MediaVentures Group",
    domain: "mediaventures.net",
    agent: "Automation Engine",
    disposition: "skipped",
    remarks: "Domain on suppression list",
    hq: "Los Angeles, United States",
    timestamp: "2026-01-22 13:20:05",
    expandedDetails: {
      attemptedAt: "2026-01-22 13:20:00",
      processTime: "0.3s",
      dataSource: "Suppression List",
      validationScore: 0,
      errorCode: "SUPPRESSED",
    },
  },
  {
    id: 10,
    companyName: "RetailMax Corporation",
    domain: "retailmax.com",
    agent: "RocketReach Agent",
    disposition: "enriched",
    remarks: "Successfully enriched with org chart data",
    hq: "Chicago, United States",
    timestamp: "2026-01-22 13:08:22",
    expandedDetails: {
      attemptedAt: "2026-01-22 13:08:15",
      processTime: "7.2s",
      dataSource: "RocketReach API v2.0",
      validationScore: 94,
    },
  },
];

const dispositionConfig = {
  enriched: {
    label: "Enriched",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  skipped: {
    label: "Skipped",
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
  failed: {
    label: "Failed",
    color: "bg-red-100 text-red-800 border-red-200",
  },
  invalid_email: {
    label: "Invalid Email",
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  duplicate: {
    label: "Duplicate",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
};

const agentConfig = {
  "ZoomInfo Agent": "bg-blue-100 text-blue-800 border-blue-200",
  "RocketReach Agent": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Validation Agent": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Automation Engine": "bg-violet-100 text-violet-800 border-violet-200",
};

export function History() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dispositionFilter, setDispositionFilter] = useState("all");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const filteredData = historyData.filter((record) => {
    const matchesSearch =
      searchQuery === "" ||
      record.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.domain.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDisposition =
      dispositionFilter === "all" || record.disposition === dispositionFilter;

    return matchesSearch && matchesDisposition;
  });

  const toggleRow = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">History / Activity Logs</h1>
        <p className="text-gray-600">
          Complete record of company enrichment and automation decisions.
        </p>
      </div>

      {/* Top Controls */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[280px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by company name or domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-50 border-gray-200"
            />
          </div>

          {/* Disposition Filter */}
          <div className="w-52">
            <Select
              value={dispositionFilter}
              onValueChange={setDispositionFilter}
            >
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue placeholder="Filter by Disposition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dispositions</SelectItem>
                <SelectItem value="enriched">✅ Enriched</SelectItem>
                <SelectItem value="skipped">⏭ Skipped</SelectItem>
                <SelectItem value="failed">❌ Failed</SelectItem>
                <SelectItem value="invalid_email">⚠ Invalid Email</SelectItem>
                <SelectItem value="duplicate">💤 Duplicate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            <span className="font-medium">{filteredData.length}</span> records
            found
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-8">
                  {/* Expand icon column */}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Company Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Disposition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Remarks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  HQ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((record) => {
                const isExpanded = expandedRow === record.id;
                const dispositionStyle =
                  dispositionConfig[record.disposition];
                const agentStyle =
                  agentConfig[
                    record.agent as keyof typeof agentConfig
                  ] || "bg-gray-100 text-gray-800 border-gray-200";

                return (
                  <Fragment key={record.id}>
                    {/* Main Row */}
                    <tr
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggleRow(record.id)}
                    >
                      {/* Expand Icon */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </td>

                      {/* Company Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {record.companyName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {record.domain}
                          </div>
                        </div>
                      </td>

                      {/* Agent */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`${agentStyle} border text-xs font-medium`}
                        >
                          {record.agent}
                        </Badge>
                      </td>

                      {/* Disposition */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`${dispositionStyle.color} border text-xs font-medium`}
                        >
                          {dispositionStyle.label}
                        </Badge>
                      </td>

                      {/* Remarks */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {record.remarks}
                        </div>
                      </td>

                      {/* HQ */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{record.hq}</div>
                      </td>

                      {/* Timestamp */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-500">
                          {record.timestamp}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Details Row */}
                    {isExpanded && record.expandedDetails && (
                      <tr className="bg-indigo-50/30">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="bg-white rounded-lg border border-indigo-100 p-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">
                              Execution Details
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">
                                  Attempted At
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {record.expandedDetails.attemptedAt}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">
                                  Process Time
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {record.expandedDetails.processTime}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">
                                  Data Source
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {record.expandedDetails.dataSource}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">
                                  Validation Score
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {record.expandedDetails.validationScore}%
                                </div>
                              </div>
                            </div>
                            {record.expandedDetails.errorCode && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="text-xs text-gray-500 mb-1">
                                  Error Code
                                </div>
                                <div className="text-sm font-mono text-red-700 bg-red-50 px-2 py-1 rounded inline-block">
                                  {record.expandedDetails.errorCode}
                                </div>
                              </div>
                            )}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="text-xs text-gray-500 mb-1">
                                Full Remarks
                              </div>
                              <div className="text-sm text-gray-900">
                                {record.remarks}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium">1-{filteredData.length}</span>{" "}
            of <span className="font-medium">{filteredData.length}</span>{" "}
            records
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Immutable Notice */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-700 text-xs">ℹ</span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">
              Audit Trail - Read Only
            </h4>
            <p className="text-sm text-blue-700">
              This history log is immutable and timestamped. All records are
              permanent and cannot be modified to ensure data integrity and
              compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}