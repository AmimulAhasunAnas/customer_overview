import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, ShieldCheck, RefreshCw, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

interface GoogleSheetGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyUrl?: (url: string) => void;
}

export const GoogleSheetGuideModal: React.FC<GoogleSheetGuideModalProps> = ({
  isOpen,
  onClose,
  onApplyUrl,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [testUrl, setTestUrl] = useState('');

  if (!isOpen) return null;

  const sampleUrl = 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit?usp=sharing';

  const codeSnippet = `// In index.html or src/googleSheetService.ts:
const DEFAULT_GOOGLE_SHEET_URL = "YOUR_COPIED_GOOGLE_SHEET_LINK_HERE";`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleConnect = () => {
    if (testUrl.trim() && onApplyUrl) {
      onApplyUrl(testUrl.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Google Sheets Real-Time Sync Guide</h3>
              <p className="text-xs text-slate-500">How to connect your live Google Sheet with Read Permission</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600">
          {/* Quick Connect Input */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <label className="block text-xs font-semibold text-slate-800">
              Paste your Google Sheet link to connect now:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs.../edit?usp=sharing"
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleConnect}
                disabled={!testUrl.trim()}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-md transition-colors shadow-xs shrink-0"
              >
                Connect &amp; Sync
              </button>
            </div>
          </div>

          {/* 3 Steps Guide */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500">
              3 Steps to set up Read Permission in Google Sheets:
            </h4>

            {/* Step 1 */}
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-xs">
                1
              </div>
              <div>
                <p className="font-semibold text-slate-900">Open your Google Sheet</p>
                <p className="text-slate-500 mt-0.5">
                  Open the Google Spreadsheet (or Excel file uploaded to Google Drive) in your browser.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-xs">
                2
              </div>
              <div className="space-y-1.5">
                <p className="font-semibold text-slate-900">Set General Access to &quot;Anyone with the link&quot; (Viewer)</p>
                <p className="text-slate-500">
                  Click the blue <strong className="text-slate-800">Share</strong> button in the top-right corner.
                </p>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-900 text-[11px] leading-relaxed">
                  Under <strong>General access</strong>, switch from <strong>Restricted</strong> to <strong>Anyone with the link</strong>.
                  Keep the permission role as <strong>Viewer</strong> (read-only). Click <strong>Copy link</strong>.
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-xs">
                3
              </div>
              <div>
                <p className="font-semibold text-slate-900">Real-Time Client-Side Fetching</p>
                <p className="text-slate-500 mt-0.5">
                  The dashboard directly queries Google&apos;s live CSV export engine (<code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">/gviz/tq?tqx=out:csv</code>). Zero backend server or API key required! Changes made in Google Sheets update on the dashboard upon clicking <strong>Sync Now</strong> or with <strong>Auto-Refresh</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* How to configure in code for GitHub Pages */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs">
                How to set as default in code for GitHub Pages:
              </h4>
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-700"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy Snippet'}</span>
              </button>
            </div>
            <p className="text-slate-500 text-[11px]">
              In your <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">index.html</code> (or <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">src/googleSheetService.ts</code>), find the constant at the top of the script:
            </p>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] overflow-x-auto">
              <code>{codeSnippet}</code>
            </pre>
            <p className="text-slate-500 text-[11px]">
              When visitors open your GitHub Pages site, it will automatically connect to your Google Sheet and show real-time live data!
            </p>
          </div>

          {/* Expected Header Columns */}
          <div className="pt-2 border-t border-slate-200">
            <h4 className="font-bold text-slate-900 text-xs mb-2">Supported Column Headers:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="font-semibold text-slate-800 block">Customer Name</span>
                <span className="text-slate-500 text-[10px]">Company Name, Client</span>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="font-semibold text-slate-800 block">OEM Brand</span>
                <span className="text-slate-500 text-[10px]">OEM, Vendor, Manufacturer</span>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="font-semibold text-slate-800 block">Device Model</span>
                <span className="text-slate-500 text-[10px]">Device Type / Model</span>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="font-semibold text-slate-800 block">Serial Number</span>
                <span className="text-slate-500 text-[10px]">Hostname, S/N, Asset Tag</span>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="font-semibold text-slate-800 block">Start Date</span>
                <span className="text-slate-500 text-[10px]">Contract Start, Install Date</span>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="font-semibold text-slate-800 block">End Date</span>
                <span className="text-slate-500 text-[10px]">Warranty Expiry, Contract End</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            100% Client-Side. Your sheet data stays in the browser.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
