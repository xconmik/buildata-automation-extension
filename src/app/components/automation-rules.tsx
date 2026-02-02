import { useState } from "react";
import { InfoIcon, CheckCircle2 } from "lucide-react";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

export function AutomationRules() {
  const [maxInvalidEmails, setMaxInvalidEmails] = useState("5");
  const [validationAction, setValidationAction] = useState("skip-company");
  const [proofpointChecked, setProofpointChecked] = useState(true);
  const [catchallChecked, setCatchallChecked] = useState(false);
  const [genericChecked, setGenericChecked] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  const handleChange = () => {
    setIsSaved(false);
    setTimeout(() => setIsSaved(true), 1000);
  };

  const handleReset = () => {
    setMaxInvalidEmails("5");
    setValidationAction("skip-company");
    setProofpointChecked(true);
    setCatchallChecked(false);
    setGenericChecked(false);
    handleChange();
  };

  return (
    <div className="max-w-5xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Automation Rules</h1>
        <p className="text-gray-600">
          Configure automated actions for email validation and contact enrichment workflows
        </p>
      </div>

      {/* Email Validation Rules Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-gray-900">Email Validation Rules</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">
                  Set thresholds and actions for handling invalid email addresses in your campaigns
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Max Invalid Emails */}
          <div className="space-y-2">
            <Label htmlFor="max-invalid">Max Invalid Emails Per Campaign</Label>
            <Input
              id="max-invalid"
              type="number"
              value={maxInvalidEmails}
              onChange={(e) => {
                setMaxInvalidEmails(e.target.value);
                handleChange();
              }}
              className="bg-gray-50 border-gray-200"
              min="0"
            />
            <p className="text-sm text-gray-500">
              Campaign will pause when this limit is reached
            </p>
          </div>

          {/* Action Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="validation-action">Action When Email Validation Fails</Label>
            <Select value={validationAction} onValueChange={(val) => {
              setValidationAction(val);
              handleChange();
            }}>
              <SelectTrigger id="validation-action" className="bg-gray-50 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="skip-company">Skip Company</SelectItem>
                <SelectItem value="skip-email">Skip Email</SelectItem>
                <SelectItem value="stop-campaign">Stop Campaign</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Determines what happens when validation fails
            </p>
          </div>
        </div>
      </div>

      {/* Restricted Emails Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-gray-900">Restricted Emails</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">
                  Automatically filter out problematic email types to improve deliverability
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="space-y-4">
          {/* Proofpoint Protected */}
          <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <Checkbox
              id="proofpoint"
              checked={proofpointChecked}
              onCheckedChange={(checked) => {
                setProofpointChecked(checked as boolean);
                handleChange();
              }}
            />
            <div className="flex-1 space-y-1">
              <label
                htmlFor="proofpoint"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Proofpoint Protected
              </label>
              <p className="text-sm text-gray-500">
                Emails protected by Proofpoint security gateway
              </p>
            </div>
          </div>

          {/* Catch-all Restricted */}
          <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <Checkbox
              id="catchall"
              checked={catchallChecked}
              onCheckedChange={(checked) => {
                setCatchallChecked(checked as boolean);
                handleChange();
              }}
            />
            <div className="flex-1 space-y-1">
              <label
                htmlFor="catchall"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Catch-all Restricted
              </label>
              <p className="text-sm text-gray-500">
                Domains that accept all email addresses (higher bounce risk)
              </p>
            </div>
          </div>

          {/* Generic Restricted */}
          <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <Checkbox
              id="generic"
              checked={genericChecked}
              onCheckedChange={(checked) => {
                setGenericChecked(checked as boolean);
                handleChange();
              }}
            />
            <div className="flex-1 space-y-1">
              <label
                htmlFor="generic"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Generic Restricted
              </label>
              <p className="text-sm text-gray-500">
                Generic addresses like info@, admin@, support@
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions and Auto-save */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isSaved && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>Changes saved automatically</span>
            </div>
          )}
          {!isSaved && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              <span>Saving...</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="border-gray-300 hover:bg-gray-50"
          >
            Reset Rules
          </Button>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Run Automation
          </Button>
        </div>
      </div>
    </div>
  );
}
