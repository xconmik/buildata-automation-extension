import { useState } from "react";
import { Building2, Clock, Shield, Key, Plug } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";

export function Settings() {
  const [companyName, setCompanyName] = useState("Acme Corporation");
  const [timezone, setTimezone] = useState("america-los-angeles");
  const [searchDelay, setSearchDelay] = useState("2000");
  const [retryAttempts, setRetryAttempts] = useState("3");
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [zoomInfoConnected, setZoomInfoConnected] = useState(true);
  const [rocketReachConnected, setRocketReachConnected] = useState(true);
  const [buildataConnected, setBuildataConnected] = useState(false);

  return (
    <div className="max-w-5xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Manage your account, automation, and integration preferences
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="mb-6 bg-white border border-gray-200 p-1">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Account Settings */}
        <TabsContent value="account">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h2 className="text-gray-900">Account Settings</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-gray-50 border-gray-200"
                />
                <p className="text-sm text-gray-500">
                  This will be displayed in your account dashboard
                </p>
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="timezone" className="bg-gray-50 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="america-new-york">
                      America/New York (EST)
                    </SelectItem>
                    <SelectItem value="america-chicago">
                      America/Chicago (CST)
                    </SelectItem>
                    <SelectItem value="america-denver">
                      America/Denver (MST)
                    </SelectItem>
                    <SelectItem value="america-los-angeles">
                      America/Los Angeles (PST)
                    </SelectItem>
                    <SelectItem value="europe-london">
                      Europe/London (GMT)
                    </SelectItem>
                    <SelectItem value="europe-paris">
                      Europe/Paris (CET)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Used for scheduling and timestamps
                </p>
              </div>

              {/* User Roles Section */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-4">User Roles</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        john@company.com
                      </p>
                      <p className="text-xs text-gray-500">Admin</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full font-medium">
                      Owner
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        sarah@company.com
                      </p>
                      <p className="text-xs text-gray-500">Member</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
                <Button variant="outline" className="mt-4 w-full border-gray-300">
                  Invite Team Member
                </Button>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Save Changes
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Automation Settings */}
        <TabsContent value="automation">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h2 className="text-gray-900">Automation Settings</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Google Search Delay */}
              <div className="space-y-2">
                <Label htmlFor="search-delay">Google Search Delay (ms)</Label>
                <Input
                  id="search-delay"
                  type="number"
                  value={searchDelay}
                  onChange={(e) => setSearchDelay(e.target.value)}
                  className="bg-gray-50 border-gray-200"
                  min="1000"
                  max="10000"
                  step="500"
                />
                <p className="text-sm text-gray-500">
                  Delay between automated Google searches (1000-10000ms)
                </p>
              </div>

              {/* Retry Attempts */}
              <div className="space-y-2">
                <Label htmlFor="retry-attempts">Retry Attempts</Label>
                <Select value={retryAttempts} onValueChange={setRetryAttempts}>
                  <SelectTrigger id="retry-attempts" className="bg-gray-50 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 attempt</SelectItem>
                    <SelectItem value="2">2 attempts</SelectItem>
                    <SelectItem value="3">3 attempts</SelectItem>
                    <SelectItem value="5">5 attempts</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Number of times to retry failed enrichment requests
                </p>
              </div>

              {/* Proxy Toggle */}
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 space-y-1">
                  <label
                    htmlFor="proxy-toggle"
                    className="text-sm font-medium text-gray-900 cursor-pointer"
                  >
                    Enable Proxy Rotation
                  </label>
                  <p className="text-sm text-gray-500">
                    Use rotating proxies to avoid rate limiting
                  </p>
                </div>
                <Switch
                  id="proxy-toggle"
                  checked={proxyEnabled}
                  onCheckedChange={setProxyEnabled}
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Save Changes
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Plug className="w-5 h-5 text-indigo-600" />
                <h2 className="text-gray-900">Integrations</h2>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* ZoomInfo */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">ZoomInfo</h3>
                    <p className="text-sm text-gray-500">
                      B2B contact and company data
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      zoomInfoConnected
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {zoomInfoConnected ? "Connected" : "Not Connected"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoomInfoConnected(!zoomInfoConnected)}
                  >
                    {zoomInfoConnected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              </div>

              {/* RocketReach */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">RocketReach</h3>
                    <p className="text-sm text-gray-500">
                      Email and contact enrichment
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      rocketReachConnected
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {rocketReachConnected ? "Connected" : "Not Connected"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRocketReachConnected(!rocketReachConnected)}
                  >
                    {rocketReachConnected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              </div>

              {/* Buildata */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Buildata</h3>
                    <p className="text-sm text-gray-500">
                      Company intelligence platform
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      buildataConnected
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {buildataConnected ? "Connected" : "Not Connected"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBuildataConnected(!buildataConnected)}
                  >
                    {buildataConnected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h2 className="text-gray-900">Security</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* API Keys */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-gray-600" />
                  <h3 className="font-medium text-gray-900">API Keys</h3>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      Production API Key
                    </span>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                      Active
                    </span>
                  </div>
                  <code className="text-xs bg-white px-3 py-2 rounded border border-gray-200 block text-gray-700 font-mono">
                    sk_prod_••••••••••••••••••••••••1a2b
                  </code>
                  <p className="text-xs text-gray-500 mt-2">
                    Last used 2 hours ago
                  </p>
                </div>
                <Button variant="outline" className="w-full border-gray-300">
                  Generate New API Key
                </Button>
              </div>

              {/* Session Management */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <h3 className="font-medium text-gray-900">Active Sessions</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Current Session
                      </p>
                      <p className="text-xs text-gray-500">
                        MacBook Pro • San Francisco, CA
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                      Active now
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Chrome on Windows
                      </p>
                      <p className="text-xs text-gray-500">
                        Last active 3 days ago
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Revoke
                    </Button>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-50"
                >
                  Sign Out All Other Sessions
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
