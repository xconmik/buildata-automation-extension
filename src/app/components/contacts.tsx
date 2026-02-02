import { useState } from "react";
import { Search, Download, Edit, Eye, Mail } from "lucide-react";
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

const contactsData = [
  {
    id: 1,
    name: "Sarah Chen",
    company: "Stripe Inc",
    domain: "stripe.com",
    email: "sarah@stripe.com",
    phone: "+1 (555) 123-4567",
    employees: "7,000+",
    revenue: "$7.4B",
    source: "ZoomInfo",
  },
  {
    id: 2,
    name: "Michael Rodriguez",
    company: "Figma",
    domain: "figma.com",
    email: "michael.rodriguez@figma.com",
    phone: "+1 (555) 234-5678",
    employees: "800+",
    revenue: "$400M",
    source: "RocketReach",
  },
  {
    id: 3,
    name: "Emily Watson",
    company: "Salesforce",
    domain: "salesforce.com",
    email: "emily.watson@salesforce.com",
    phone: "+1 (555) 345-6789",
    employees: "73,000+",
    revenue: "$31.4B",
    source: "ZoomInfo",
  },
  {
    id: 4,
    name: "David Park",
    company: "HubSpot",
    domain: "hubspot.com",
    email: "dpark@hubspot.com",
    phone: "+1 (555) 456-7890",
    employees: "7,000+",
    revenue: "$1.7B",
    source: "Buildata",
  },
  {
    id: 5,
    name: "Jennifer Lopez",
    company: "Shopify",
    domain: "shopify.com",
    email: "jennifer@shopify.com",
    phone: "+1 (555) 567-8901",
    employees: "10,000+",
    revenue: "$5.6B",
    source: "RocketReach",
  },
  {
    id: 6,
    name: "Robert Kim",
    company: "Notion Labs",
    domain: "notion.so",
    email: "robert@notion.so",
    phone: "+1 (555) 678-9012",
    employees: "300+",
    revenue: "$200M",
    source: "ZoomInfo",
  },
  {
    id: 7,
    name: "Amanda Taylor",
    company: "Slack",
    domain: "slack.com",
    email: "amanda.taylor@slack.com",
    phone: "+1 (555) 789-0123",
    employees: "2,500+",
    revenue: "$1.5B",
    source: "Buildata",
  },
  {
    id: 8,
    name: "James Wilson",
    company: "Zoom",
    domain: "zoom.us",
    email: "jwilson@zoom.us",
    phone: "+1 (555) 890-1234",
    employees: "7,400+",
    revenue: "$4.4B",
    source: "RocketReach",
  },
];

export function Contacts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  return (
    <div className="max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Contacts</h1>
        <p className="text-gray-600">
          Central CRM-style contact list with enriched data
        </p>
      </div>

      {/* Top Controls */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[280px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search contacts by name, company, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-50 border-gray-200"
            />
          </div>

          {/* Company Filter */}
          <div className="w-48">
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue placeholder="Company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="figma">Figma</SelectItem>
                <SelectItem value="salesforce">Salesforce</SelectItem>
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

          {/* Export Button */}
          <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Employees
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contactsData.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-xs font-semibold text-indigo-700">
                          {contact.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {contact.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contact.company}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {contact.domain}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {contact.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {contact.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {contact.employees}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {contact.revenue}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {contact.source}
                    </span>
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
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Contact
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" />
                          Add to Campaign
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
            <span className="font-medium">1,247</span> contacts
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
