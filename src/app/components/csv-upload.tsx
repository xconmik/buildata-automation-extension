import { useState, useCallback } from "react";
import { Upload, FileText, Check, X, AlertCircle, InfoIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
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

interface CSVData {
  headers: string[];
  rows: string[][];
}

interface FieldMapping {
  [key: string]: string;
}

const fieldOptions = [
  "Company Name",
  "Domain",
  "Website",
  "Email",
  "First Name",
  "Last Name",
  "Phone Number",
  "Job Title",
  "Industry",
  "Ignore Column",
];

export function CSVUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [csvData, setCSVData] = useState<CSVData | null>(null);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping>({});
  const [skipMissingDomain, setSkipMissingDomain] = useState(true);
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [normalizeCompany, setNormalizeCompany] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Auto-detect field mappings based on header names
  const autoDetectMapping = (headers: string[]): FieldMapping => {
    const mappings: FieldMapping = {};
    headers.forEach((header) => {
      const lowerHeader = header.toLowerCase().trim();
      if (lowerHeader.includes("company") || lowerHeader.includes("organization")) {
        mappings[header] = "Company Name";
      } else if (lowerHeader.includes("domain") || lowerHeader === "website") {
        mappings[header] = "Domain";
      } else if (lowerHeader.includes("email") || lowerHeader.includes("e-mail")) {
        mappings[header] = "Email";
      } else if (lowerHeader.includes("first") && lowerHeader.includes("name")) {
        mappings[header] = "First Name";
      } else if (lowerHeader.includes("last") && lowerHeader.includes("name")) {
        mappings[header] = "Last Name";
      } else if (lowerHeader.includes("phone") || lowerHeader.includes("tel")) {
        mappings[header] = "Phone Number";
      } else if (lowerHeader.includes("title") || lowerHeader.includes("position")) {
        mappings[header] = "Job Title";
      } else if (lowerHeader.includes("industry") || lowerHeader.includes("sector")) {
        mappings[header] = "Industry";
      } else {
        mappings[header] = "Ignore Column";
      }
    });
    return mappings;
  };

  const parseCSV = (content: string): CSVData => {
    const lines = content.split("\n").filter(line => line.trim());
    const headers = lines[0].split(",").map(h => h.trim());
    const rows = lines.slice(1, 11).map(line => 
      line.split(",").map(cell => cell.trim())
    );
    return { headers, rows };
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setUploadState("error");
      setErrorMessage("Please upload a .csv file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadState("error");
      setErrorMessage("File size must be less than 10MB");
      return;
    }

    setFileName(file.name);
    setUploadState("uploading");
    setUploadProgress(0);
    setErrorMessage("");

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    // Read file
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseCSV(content);
      setCSVData(parsed);
      const detectedMappings = autoDetectMapping(parsed.headers);
      setFieldMappings(detectedMappings);
      
      setTimeout(() => {
        setUploadState("success");
      }, 1000);
    };
    reader.readAsText(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const hasDomainMapping = Object.values(fieldMappings).includes("Domain");

  return (
    <div className="max-w-6xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Upload CSV</h1>
        <p className="text-gray-600">
          Import and enrich company or contact data
        </p>
      </div>

      {/* File Upload Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6 shadow-sm">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-12 text-center transition-all
            ${isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 bg-gray-50"}
            ${uploadState === "error" ? "border-red-400 bg-red-50" : ""}
            ${uploadState === "success" ? "border-green-400 bg-green-50" : ""}
            ${uploadState === "idle" ? "hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer" : ""}
          `}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploadState === "uploading" || uploadState === "success"}
          />

          {/* Idle State */}
          {uploadState === "idle" && (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="font-medium text-gray-900 mb-2">
                Drag & drop your CSV file here
              </p>
              <p className="text-sm text-gray-500 mb-4">or click to browse</p>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <span className="px-3 py-1 bg-white rounded-full border border-gray-200">
                  .csv only
                </span>
                <span>Max file size: 10MB</span>
              </div>
            </>
          )}

          {/* Uploading State */}
          {uploadState === "uploading" && (
            <>
              <FileText className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <p className="font-medium text-gray-900 mb-2">{fileName}</p>
              <div className="max-w-md mx-auto">
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">Uploading... {uploadProgress}%</p>
              </div>
            </>
          )}

          {/* Success State */}
          {uploadState === "success" && (
            <>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-medium text-gray-900 mb-2">{fileName}</p>
              <p className="text-sm text-green-600">Upload successful</p>
              <button
                onClick={() => {
                  setUploadState("idle");
                  setCSVData(null);
                  setFieldMappings({});
                }}
                className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Upload a different file
              </button>
            </>
          )}

          {/* Error State */}
          {uploadState === "error" && (
            <>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <p className="font-medium text-gray-900 mb-2">Upload failed</p>
              <p className="text-sm text-red-600 mb-4">{errorMessage}</p>
              <button
                onClick={() => setUploadState("idle")}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Try again
              </button>
            </>
          )}
        </div>
      </div>

      {/* CSV Preview Table */}
      {csvData && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-gray-900 mb-4">Data Preview</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {csvData.headers.map((header, idx) => (
                    <th
                      key={idx}
                      className="px-4 py-3 text-left font-medium text-gray-900 sticky top-0 bg-gray-50"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-gray-100 hover:bg-gray-50">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-3 text-gray-700">
                        {cell || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Showing first {csvData.rows.length} rows of your data
          </p>
        </div>
      )}

      {/* Field Mapping */}
      {csvData && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-gray-900">Field Mapping</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">
                    Map your CSV columns to our system fields. Domain is required for enrichment.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {csvData.headers.map((header, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-700 truncate bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    {header}
                  </div>
                </div>
                <div className="flex-1">
                  <Select
                    value={fieldMappings[header]}
                    onValueChange={(value) => {
                      setFieldMappings(prev => ({ ...prev, [header]: value }));
                    }}
                  >
                    <SelectTrigger className="bg-gray-50 border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                          {option === "Domain" && (
                            <span className="ml-2 text-xs text-red-600">*</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          {!hasDomainMapping && (
            <div className="flex items-start gap-2 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">Domain field required</p>
                <p className="text-sm text-amber-700 mt-1">
                  Please map at least one column to "Domain" to enable data enrichment
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import Settings */}
      {csvData && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-gray-900 mb-6">Import Settings</h2>

          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <Checkbox
                id="skip-missing"
                checked={skipMissingDomain}
                onCheckedChange={(checked) => setSkipMissingDomain(checked as boolean)}
              />
              <div className="flex-1 space-y-1">
                <label
                  htmlFor="skip-missing"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Skip rows with missing domain
                </label>
                <p className="text-sm text-gray-500">
                  Rows without a domain value will be excluded from import
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <Checkbox
                id="remove-duplicates"
                checked={removeDuplicates}
                onCheckedChange={(checked) => setRemoveDuplicates(checked as boolean)}
              />
              <div className="flex-1 space-y-1">
                <label
                  htmlFor="remove-duplicates"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Remove duplicate domains
                </label>
                <p className="text-sm text-gray-500">
                  Only keep the first occurrence of each domain
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <Checkbox
                id="trim-whitespace"
                checked={trimWhitespace}
                onCheckedChange={(checked) => setTrimWhitespace(checked as boolean)}
              />
              <div className="flex-1 space-y-1">
                <label
                  htmlFor="trim-whitespace"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Trim whitespace
                </label>
                <p className="text-sm text-gray-500">
                  Remove extra spaces from the beginning and end of values
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <Checkbox
                id="normalize-company"
                checked={normalizeCompany}
                onCheckedChange={(checked) => setNormalizeCompany(checked as boolean)}
              />
              <div className="flex-1 space-y-1">
                <label
                  htmlFor="normalize-company"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Normalize company names
                </label>
                <p className="text-sm text-gray-500">
                  Standardize company suffixes (Inc., LLC, Ltd., etc.)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions Footer */}
      {csvData && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <p className="text-sm text-gray-600">
              You can review automation rules before running
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => {
                  setUploadState("idle");
                  setCSVData(null);
                  setFieldMappings({});
                }}
                className="border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                disabled={!hasDomainMapping}
                className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Automation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
