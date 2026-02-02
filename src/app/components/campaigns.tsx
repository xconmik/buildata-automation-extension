import { Plus, Play, Pause, BarChart3, Users, Calendar } from "lucide-react";
import { Button } from "@/app/components/ui/button";

const campaignsData = [
  {
    id: 1,
    name: "Q1 2026 Outreach",
    status: "active",
    totalContacts: 1247,
    createdDate: "Jan 15, 2026",
    completionRate: 68,
  },
  {
    id: 2,
    name: "Enterprise Lead Gen",
    status: "active",
    totalContacts: 892,
    createdDate: "Jan 10, 2026",
    completionRate: 45,
  },
  {
    id: 3,
    name: "Tech Startup Outreach",
    status: "paused",
    totalContacts: 2134,
    createdDate: "Jan 8, 2026",
    completionRate: 32,
  },
  {
    id: 4,
    name: "SaaS Company Research",
    status: "active",
    totalContacts: 567,
    createdDate: "Jan 5, 2026",
    completionRate: 89,
  },
  {
    id: 5,
    name: "Fortune 500 Contacts",
    status: "completed",
    totalContacts: 1500,
    createdDate: "Dec 20, 2025",
    completionRate: 100,
  },
  {
    id: 6,
    name: "Healthcare Providers",
    status: "active",
    totalContacts: 743,
    createdDate: "Jan 12, 2026",
    completionRate: 56,
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "paused":
      return "bg-yellow-100 text-yellow-800";
    case "completed":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusLabel = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export function Campaigns() {
  return (
    <div className="max-w-7xl">
      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Campaigns</h1>
          <p className="text-gray-600">
            Manage outreach and data enrichment workflows
          </p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Campaign Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaignsData.map((campaign) => (
          <div
            key={campaign.id}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            {/* Campaign Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {campaign.name}
                </h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    campaign.status
                  )}`}
                >
                  {getStatusLabel(campaign.status)}
                </span>
              </div>
            </div>

            {/* Campaign Stats */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-2 text-gray-400" />
                <span>{campaign.totalContacts.toLocaleString()} contacts</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                <span>Created {campaign.createdDate}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Completion</span>
                <span className="font-medium text-gray-900">
                  {campaign.completionRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${campaign.completionRate}%` }}
                ></div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-200">
              {campaign.status === "active" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-gray-300 hover:bg-gray-50"
                >
                  <Pause className="w-3.5 h-3.5 mr-1.5" />
                  Pause
                </Button>
              ) : campaign.status === "paused" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-gray-300 hover:bg-gray-50"
                >
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  Resume
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-gray-300 hover:bg-gray-50"
              >
                <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                View Results
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State for Create Campaign */}
      <div className="mt-6 bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer">
        <div className="max-w-sm mx-auto">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">
            Create your next campaign
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Set up a new outreach workflow or data enrichment campaign
          </p>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}
