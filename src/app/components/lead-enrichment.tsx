import { useState } from "react";
import { Plus, Filter, RotateCw, FileText, Search } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

const enrichmentData = [
  {
    id: 1,
    companyName: "Stripe Inc",
    domain: "stripe.com",
    zoomInfoStatus: "success",
    rocketReachStatus: "success",
    emailPattern: "{first}@stripe.com",
    lastUpdated: "2 hours ago",
  },
  {
    id: 2,
    companyName: "Figma",
    domain: "figma.com",
    zoomInfoStatus: "success",
    rocketReachStatus: "pending",
    emailPattern: "{first}.{last}@figma.com",
    lastUpdated: "3 hours ago",
  },
  {
    id: 3,
    companyName: "Acme Corporation",
    domain: "acme-corp.com",
    zoomInfoStatus: "failed",
    rocketReachStatus: "failed",
    emailPattern: "—",
    lastUpdated: "5 hours ago",
  },
  {
    id: 4,
    companyName: "TechStart Solutions",
    domain: "techstart.io",
    zoomInfoStatus: "processing",
    rocketReachStatus: "success",
    emailPattern: "{first}{last}@techstart.io",
    lastUpdated: "1 hour ago",
  },
  {
    id: 5,
    companyName: "Salesforce",
    domain: "salesforce.com",
    zoomInfoStatus: "success",
    rocketReachStatus: "success",
    emailPattern: "{first}.{last}@salesforce.com",
    lastUpdated: "30 min ago",
  },
  {
    id: 6,
    companyName: "HubSpot",
    domain: "hubspot.com",
    zoomInfoStatus: "success",
    rocketReachStatus: "processing",
    emailPattern: "{first}@hubspot.com",
    lastUpdated: "1 hour ago",
  },
  {
    id: 7,
    companyName: "Shopify",
    domain: "shopify.com",
    zoomInfoStatus: "pending",
    rocketReachStatus: "pending",
    emailPattern: "—",
    lastUpdated: "10 min ago",
  },
  {
    id: 8,
    companyName: "Notion Labs",
    domain: "notion.so",
    zoomInfoStatus: "success",
    rocketReachStatus: "success",
    emailPattern: "{first}@notion.so",
    lastUpdated: "4 hours ago",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "success":
      return "bg-green-100 text-green-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "pending":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusLabel = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export function LeadEnrichment() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="max-w-7xl">
      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Lead Enrichment</h1>
          <p className="text-gray-600">
            Manage and run enrichment automations across data sources
          </p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Enrichment
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by company or domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-50 border-gray-200"
            />
          </div>

          {/* Status Filter */}
          <div className="w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source Filter */}
          <div className="w-48">
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="zoominfo">ZoomInfo</SelectItem>
                <SelectItem value="rocketreach">RocketReach</SelectItem>
                <SelectItem value="buildata">Buildata</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Company Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  ZoomInfo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  RocketReach
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Email Pattern
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {enrichmentData.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {row.companyName}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {row.domain}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        row.zoomInfoStatus
                      )}`}
                    >
                      {getStatusLabel(row.zoomInfoStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        row.rocketReachStatus
                      )}`}
                    >
                      {getStatusLabel(row.rocketReachStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                      {row.emailPattern}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row.lastUpdated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <RotateCw className="w-4 h-4 mr-2" />
                          Run Enrichment
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RotateCw className="w-4 h-4 mr-2" />
                          Retry Failed
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="w-4 h-4 mr-2" />
                          View Logs
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium">1-8</span> of{" "}
            <span className="font-medium">248</span> results
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
