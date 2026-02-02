import { TrendingUp, Users, CheckCircle2, XCircle, Play } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const metricsData = [
  {
    title: "Total Leads Imported",
    value: "12,543",
    change: "+12.5%",
    trend: "up",
    icon: Users,
  },
  {
    title: "Enriched Leads",
    value: "10,892",
    change: "+8.3%",
    trend: "up",
    icon: CheckCircle2,
  },
  {
    title: "Failed Enrichments",
    value: "342",
    change: "-5.2%",
    trend: "down",
    icon: XCircle,
  },
  {
    title: "Active Campaigns",
    value: "18",
    change: "+3",
    trend: "up",
    icon: Play,
  },
];

const enrichmentTimeData = [
  { date: "Jan 15", count: 320 },
  { date: "Jan 16", count: 450 },
  { date: "Jan 17", count: 380 },
  { date: "Jan 18", count: 520 },
  { date: "Jan 19", count: 490 },
  { date: "Jan 20", count: 610 },
  { date: "Jan 21", count: 580 },
];

const successFailData = [
  { source: "ZoomInfo", success: 4200, failed: 180 },
  { source: "RocketReach", success: 3800, failed: 220 },
  { source: "Buildata", success: 2900, failed: 150 },
];

const recentActivity = [
  { domain: "stripe.com", status: "Success", source: "ZoomInfo", timestamp: "2 min ago" },
  { domain: "figma.com", status: "Success", source: "RocketReach", timestamp: "5 min ago" },
  { domain: "acme-corp.com", status: "Failed", source: "ZoomInfo", timestamp: "8 min ago" },
  { domain: "techstart.io", status: "Success", source: "Buildata", timestamp: "12 min ago" },
  { domain: "salesforce.com", status: "Success", source: "ZoomInfo", timestamp: "15 min ago" },
  { domain: "hubspot.com", status: "Success", source: "RocketReach", timestamp: "18 min ago" },
  { domain: "startup-xyz.com", status: "Failed", source: "ZoomInfo", timestamp: "22 min ago" },
  { domain: "shopify.com", status: "Success", source: "Buildata", timestamp: "25 min ago" },
];

export function Dashboard() {
  return (
    <div className="max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Monitor your lead enrichment performance and activity
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metricsData.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.title}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <span
                  className={`text-sm font-medium ${
                    metric.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {metric.change}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">{metric.title}</p>
              <p className="font-semibold text-gray-900">{metric.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Line Chart - Enrichments Over Time */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h2 className="text-gray-900">Enrichments Over Time</h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={enrichmentTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickLine={{ stroke: "#e5e7eb" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: "#6366f1", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - Success vs Failed */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-gray-900 mb-6">Success vs Failed Lookups</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={successFailData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="source"
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickLine={{ stroke: "#e5e7eb" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="success" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="failed" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-gray-900">Recent Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentActivity.map((activity, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {activity.domain}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        activity.status === "Success"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {activity.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {activity.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {activity.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
