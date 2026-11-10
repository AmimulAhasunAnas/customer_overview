import React, { useState } from 'react';
import { CustomerDeviceRecord } from '../types';
import { getStandaloneHtmlString } from '../excelUtils';
import { X, Download, Copy, Check, ExternalLink, Globe, FileCode2, Table } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'deploy' | 'template' | 'preview'>('deploy');

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
              <p className="text-xs text-slate-500">Host for free with zero backend, database, or server configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 flex items-center gap-4 bg-white text-xs">
          <button
            onClick={() => setActiveTab('deploy')}
            className={`py-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'deploy'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>GitHub Pages Instructions</span>
          </button>

          <button
            onClick={() => setActiveTab('template')}
            className={`py-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'template'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Excel Column Guide</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`py-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Standalone Code Preview</span>
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
                    The exported file is a 100% standalone <code className="font-mono bg-sky-100 px-1 py-0.5 rounded">index.html</code> file with SheetJS, Chart.js, and Tailwind CSS bundled via CDN. It has zero external server requirements, making it ideal for GitHub Pages, intranet portals, or USB sticks.
                  </p>
                </div>
              </div>

              <h4 className="font-semibold text-slate-900 text-sm">How to Publish to GitHub Pages in 3 Minutes</h4>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Download or Save <code className="font-mono text-sky-700">index.html</code></span>
                  </div>
                  <p className="text-slate-600 ml-7">
                    Click the <strong>Download index.html</strong> button below to save the generated file directly to your computer.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Create a new GitHub Repository</span>
                  </div>
                  <p className="text-slate-600 ml-7">
                    Go to <a href="https://github.com/new" target="_blank" rel="noreferrer" className="text-sky-600 underline">github.com/new</a> and create a public or private repository (e.g. <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">customer-oem-tracker</code>).
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">3</span>
                    <span>Upload <code className="font-mono text-sky-700">index.html</code> into the Root Directory</span>
                  </div>
                  <p className="text-slate-600 ml-7">
                    On GitHub, click <strong>Add file &gt; Upload files</strong> and drag in your <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">index.html</code> file, then click <strong>Commit changes</strong>.
                  </p>
                  <div className="mt-2 ml-7 p-2 bg-slate-900 text-slate-200 font-mono rounded text-[11px]">
                    # Or via terminal git commands:<br/>
                    git init<br/>
                    git add index.html<br/>
                    git commit -m "Deploy Customer OEM Tracker"<br/>
                    git branch -M main<br/>
                    git remote add origin https://github.com/YOUR_USERNAME/customer-oem-tracker.git<br/>
                    git push -u origin main
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">4</span>
                    <span>Enable GitHub Pages in Repository Settings</span>
                  </div>
                  <p className="text-slate-600 ml-7">
                    In your GitHub repo, go to <strong>Settings &gt; Pages</strong>. Under <strong>Build and deployment &gt; Branch</strong>, select <strong>main</strong> branch and <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">/ (root)</code> folder, then click <strong>Save</strong>.
                  </p>
                  <p className="text-slate-600 ml-7 mt-1 text-[11px] text-emerald-700 font-medium">
                    &bull; Your dashboard will be live at: <code className="bg-emerald-50 px-1 py-0.5 rounded">https://&lt;username&gt;.github.io/customer-oem-tracker/</code>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'template' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 text-sm">Recommended Excel Column Structure</h4>
              <p className="text-slate-600">
                The built-in parser is case-insensitive and tolerant of aliases. The following standard column headers are recommended:
              </p>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Column Header</th>
                      <th className="py-2.5 px-3">Accepted Synonyms</th>
                      <th className="py-2.5 px-3">Example Values</th>
                      <th className="py-2.5 px-3">Required?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-900">Customer Name</td>
                      <td className="py-2 px-3 text-slate-500">Company, Client, Organization</td>
                      <td className="py-2 px-3 text-slate-600">Apex Capital, AcroPoint Logistics</td>
                      <td className="py-2 px-3 text-emerald-600 font-sans font-bold">Yes</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-900">Industry / Sector</td>
                      <td className="py-2 px-3 text-slate-500">Industry, Sector, Vertical</td>
                      <td className="py-2 px-3 text-slate-600">Financial Services, Healthcare</td>
                      <td className="py-2 px-3 text-slate-500 font-sans">Optional</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-900">OEM Brand</td>
                      <td className="py-2 px-3 text-slate-500">OEM, Vendor, Manufacturer, Brand</td>
                      <td className="py-2 px-3 text-slate-600">Cisco, Dell, HP, Palo Alto, Lenovo</td>
                      <td className="py-2 px-3 text-emerald-600 font-sans font-bold">Yes</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-900">Device Type / Model</td>
                      <td className="py-2 px-3 text-slate-500">Device Model, Model, Product</td>
                      <td className="py-2 px-3 text-slate-600">Catalyst 9300 48P, PowerEdge R750</td>
                      <td className="py-2 px-3 text-emerald-600 font-sans font-bold">Yes</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-900">Device Serial Number / Hostname</td>
                      <td className="py-2 px-3 text-slate-500">Serial, Serial Number, Hostname, S/N</td>
                      <td className="py-2 px-3 text-slate-600">CSCO-9300-8812A, DELL-R750-NV914</td>
                      <td className="py-2 px-3 text-emerald-600 font-sans font-bold">Yes</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-900">Status</td>
                      <td className="py-2 px-3 text-slate-500">State, Lifecycle Status</td>
                      <td className="py-2 px-3 text-slate-600">Active, Maintenance, Retired</td>
                      <td className="py-2 px-3 text-slate-500 font-sans">Defaults to Active</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-900">Location</td>
                      <td className="py-2 px-3 text-slate-500">Site, Data Center, Facility</td>
                      <td className="py-2 px-3 text-slate-600">NY Equinix NY4, Ashburn DC</td>
                      <td className="py-2 px-3 text-slate-500 font-sans">Optional</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Single-File index.html ({standaloneHtml.length} bytes)</span>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] overflow-x-auto max-h-96 leading-relaxed">
                <code>{standaloneHtml}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Bundles {currentRecords.length} current customer assets into the initial fallback dataset.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied HTML' : 'Copy HTML'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors shadow-xs"
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
