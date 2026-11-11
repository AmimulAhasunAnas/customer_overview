import React, { useState } from 'react';
import { CustomerDeviceRecord } from '../types';
import { getStandaloneHtmlString } from '../excelUtils';
import { X, Download, Copy, Check, ExternalLink, Globe, FileCode2, Table, Radio, FileSpreadsheet } from 'lucide-react';

interface GitHubPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRecords: CustomerDeviceRecord[];
}

export const GitHubPagesModal: React.FC<GitHubPagesModalProps> = ({
  isOpen,
  onClose,
  currentRecords,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [activeTab, setActiveTab] = useState<'deploy' | 'googlesheet' | 'template' | 'preview'>('deploy');

  if (!isOpen) return null;

  const standaloneHtml = getStandaloneHtmlString(currentRecords);

  const handleDownload = () => {
    const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'index.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(standaloneHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const codeSnippet = `const DEFAULT_GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit?usp=sharing";`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">GitHub Pages &amp; Standalone Single-File Export</h3>
              <p className="text-xs text-slate-500">Host for free with real-time Google Sheets sync or local Excel upload</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 flex items-center gap-4 bg-white text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('deploy')}
            className={`py-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'deploy'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>GitHub Pages Steps</span>
          </button>

          <button
            onClick={() => setActiveTab('googlesheet')}
            className={`py-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'googlesheet'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google Sheet Real-Time Setup</span>
          </button>

          <button
            onClick={() => setActiveTab('template')}
            className={`py-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'template'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Column Headers</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`py-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'preview'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Code Preview</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-600">
          {activeTab === 'deploy' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-sky-50 rounded-lg border border-sky-200 text-sky-900 flex items-start gap-3">
                <Globe className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs">Complete Single-File Architecture</p>
                  <p className="text-[11px] text-sky-800 mt-0.5">
                    The exported file is a 100% standalone <code className="font-mono bg-sky-100 px-1 py-0.5 rounded">index.html</code> with SheetJS, Chart.js, and Tailwind CSS bundled via CDN. It has zero external server or build requirements, making it ready to drop straight into your GitHub repository!
                  </p>
                </div>
              </div>

              <h4 className="font-semibold text-slate-900 text-sm">How to Publish to GitHub Pages</h4>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Download or Copy <code className="font-mono text-sky-700">index.html</code></span>
                  </div>
                  <p className="text-slate-600 ml-7">
                    Click the <strong>Download index.html</strong> button below.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Paste or Upload into Your GitHub Repo</span>
                  </div>
                  <p className="text-slate-600 ml-7">
                    In your repo (e.g. <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">customer_overview</code>), open or upload <code className="font-mono text-slate-900 font-semibold">index.html</code> at the root of the branch, then commit changes.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">3</span>
                    <span>Enable GitHub Pages</span>
                  </div>
                  <p className="text-slate-600 ml-7">
                    In your GitHub repo, go to <strong>Settings &gt; Pages</strong>. Under <strong>Build and deployment &gt; Branch</strong>, select <strong>main</strong> branch and <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">/ (root)</code> folder, then click <strong>Save</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'googlesheet' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 flex items-start gap-3">
                <Radio className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs">Real-Time Google Sheets Sync with Read Permission</p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    You do NOT need API keys or Google Cloud console setup. By setting your Google Sheet to &quot;Anyone with the link can view&quot;, the dashboard reads real-time updates directly in the browser!
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-900 block mb-1">Step 1: Set Google Sheet Permissions</span>
                  <p className="text-slate-600 text-[11px]">
                    In Google Sheets, click the blue <strong>Share</strong> button. Under <strong>General access</strong>, switch from <em>Restricted</em> to <strong>Anyone with the link</strong>. Keep role as <strong>Viewer</strong>. Click <strong>Copy link</strong>.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900">Step 2: Hardcode in index.html (Optional)</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(codeSnippet);
                        setCopiedSnippet(true);
                        setTimeout(() => setCopiedSnippet(false), 2000);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600"
                    >
                      {copiedSnippet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSnippet ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-slate-600 text-[11px] mb-2">
                    Near the top of <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-slate-800">index.html</code>, replace the constant:
                  </p>
                  <pre className="p-2.5 bg-slate-900 text-slate-100 rounded text-[11px] font-mono overflow-x-auto">
                    <code>{codeSnippet}</code>
                  </pre>
                  <p className="text-slate-500 text-[10px] mt-1.5">
                    Or simply paste the link into the dashboard input on your live website — it remembers it automatically!
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'template' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 text-sm">Recognized Column Headers</h4>
              <p className="text-slate-600">
                The parser automatically handles case variations and common abbreviations:
              </p>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Standard Column</th>
                      <th className="py-2.5 px-3">Accepted Synonyms</th>
                      <th className="py-2.5 px-3">Example Values</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-900">Customer Name</td>
                      <td className="py-2 px-3 text-slate-500">Company, Client, Account Name</td>
                      <td className="py-2 px-3 text-slate-600">Apex Capital Partners</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-900">OEM Brand</td>
                      <td className="py-2 px-3 text-slate-500">OEM, Vendor, Manufacturer, Make</td>
                      <td className="py-2 px-3 text-slate-600">Cisco, F5, Checkpoint, Palo Alto, Fortinet, Algosec</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-900">Device Model</td>
                      <td className="py-2 px-3 text-slate-500">Device Type / Model, Model, Product</td>
                      <td className="py-2 px-3 text-slate-600">Catalyst 9300 48P, PA-3260</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-900">Serial Number</td>
                      <td className="py-2 px-3 text-slate-500">Hostname, S/N, Asset Tag</td>
                      <td className="py-2 px-3 text-slate-600">CSCO-9300-8812A</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-900">Status</td>
                      <td className="py-2 px-3 text-slate-500">State, Lifecycle Status</td>
                      <td className="py-2 px-3 text-slate-600">Active, Maintenance, Retired</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-900">AMC Start Date</td>
                      <td className="py-2 px-3 text-slate-500">Start Date, AMC Start, Deployment Start</td>
                      <td className="py-2 px-3 text-emerald-700 font-semibold">01-Jul-24, 01-Oct-25</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-900">AMC End Date</td>
                      <td className="py-2 px-3 text-slate-500">End Date, AMC End, Warranty Expiry</td>
                      <td className="py-2 px-3 text-emerald-700 font-semibold">30-Sep-27, 31-Dec-26</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-800 text-xs">Generated index.html (Ready to Deploy)</p>
                <span className="text-[11px] text-slate-400 font-mono">{(standaloneHtml.length / 1024).toFixed(1)} KB</span>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] h-64 overflow-y-auto overflow-x-auto">
                <code>{standaloneHtml.substring(0, 3000)}...</code>
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Export includes Google Sheets Live Sync, Excel Upload, and {currentRecords.length} records.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-md transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download index.html</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
