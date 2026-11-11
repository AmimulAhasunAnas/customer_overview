import React, { useRef, useState, useEffect } from 'react';
import { CustomerDeviceRecord } from '../types';
import { parseExcelData, downloadSampleTemplate } from '../excelUtils';
import { SAMPLE_RECORDS } from '../sampleData';
import { fetchGoogleSheetData, extractGoogleSheetId, DEFAULT_GOOGLE_SHEET_URL } from '../googleSheetService';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  HelpCircle,
  Link2,
  Radio,
  Clock,
  ExternalLink,
  ChevronRight,
  Database,
} from 'lucide-react';

interface ImportDropzoneProps {
  onRecordsLoaded: (records: CustomerDeviceRecord[], sourceName: string, isLiveGoogleSheet?: boolean) => void;
  onResetSample: () => void;
  onOpenTemplateGuide: () => void;
  onOpenGoogleGuide: () => void;
  activeDataSource: {
    type: 'googleSheet' | 'excel' | 'sample';
    name: string;
    lastSynced?: Date;
    recordCount: number;
  };
}

export const ImportDropzone: React.FC<ImportDropzoneProps> = ({
  onRecordsLoaded,
  onResetSample,
  onOpenTemplateGuide,
  onOpenGoogleGuide,
  activeDataSource,
}) => {
  const [activeTab, setActiveTab] = useState<'googleSheet' | 'excelUpload'>('googleSheet');

  // Google Sheet state
  const [googleSheetUrl, setGoogleSheetUrl] = useState(() => {
    return localStorage.getItem('customer_oem_google_sheet_url') || DEFAULT_GOOGLE_SHEET_URL || '';
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [autoSyncCountdown, setAutoSyncCountdown] = useState(60);

  // File dropzone state
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-connect to Google Sheet if DEFAULT_GOOGLE_SHEET_URL or saved in localStorage
  useEffect(() => {
    const savedUrl = localStorage.getItem('customer_oem_google_sheet_url') || DEFAULT_GOOGLE_SHEET_URL;
    if (savedUrl && savedUrl.trim().length > 0) {
      handleSyncGoogleSheet(savedUrl.trim(), true);
    }
  }, []);

  // Auto-sync timer effect (every 60s when enabled)
  useEffect(() => {
    if (!autoSyncEnabled || !googleSheetUrl.trim()) return;

    const interval = setInterval(() => {
      setAutoSyncCountdown((prev) => {
        if (prev <= 1) {
          handleSyncGoogleSheet(googleSheetUrl.trim(), false);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoSyncEnabled, googleSheetUrl]);

  const handleSyncGoogleSheet = async (urlToSync?: string, isInitial = false) => {
    const targetUrl = urlToSync || googleSheetUrl;
    if (!targetUrl.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please paste your Google Sheet link first.',
      });
      return;
    }

    setIsSyncing(true);
    setStatusMessage(null);

    const result = await fetchGoogleSheetData(targetUrl);
    setIsSyncing(false);

    if (result.error) {
      setStatusMessage({
        type: 'error',
        text: result.error,
      });
    } else {
      localStorage.setItem('customer_oem_google_sheet_url', targetUrl.trim());
      setStatusMessage({
        type: 'success',
        text: `Live Sync Success: Loaded ${result.records.length} records in real-time from Google Sheet.`,
      });
      onRecordsLoaded(result.records, `Google Sheet (${result.sourceSheetId ? result.sourceSheetId.substring(0, 10) + '...' : 'Live'})`, true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) return;
      const buffer = e.target.result as ArrayBuffer;
      const { records, errors } = parseExcelData(buffer);

      if (errors.length > 0 && records.length === 0) {
        setStatusMessage({
          type: 'error',
          text: errors.join(', '),
        });
      } else if (records.length === 0) {
        setStatusMessage({
          type: 'error',
          text: 'No matching customer/OEM rows found. Check your columns against the template.',
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: `Loaded ${records.length} records from "${file.name}"`,
        });
        onRecordsLoaded(records, file.name, false);
      }
    };

    reader.onerror = () => {
      setStatusMessage({
        type: 'error',
        text: 'Failed to read file. Please ensure it is a valid .xlsx or .csv file.',
      });
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Tab selection bar: Google Sheet Live Sync vs Excel Upload */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 gap-2">
        <div className="flex items-center gap-1.5 p-0.5 bg-slate-200/70 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('googleSheet')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'googleSheet'
                ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${activeTab === 'googleSheet' ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
            <span>Google Sheet Live Sync</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
              Real-time
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('excelUpload')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'excelUpload'
                ? 'bg-white text-sky-700 shadow-xs ring-1 ring-sky-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 text-sky-600" />
            <span>Excel File Upload</span>
          </button>
        </div>

        {/* Current Active Source Pill */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
            <Database className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] font-medium text-slate-500">Source:</span>
            <span className="font-semibold text-slate-900 max-w-[180px] truncate">{activeDataSource.name}</span>
            {activeDataSource.lastSynced && (
              <span className="text-[10px] text-slate-400">
                ({activeDataSource.lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              onResetSample();
              setStatusMessage({
                type: 'success',
                text: `Reset to sample enterprise dataset (${SAMPLE_RECORDS.length} devices across 8 clients).`,
              });
            }}
            className="text-[11px] font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-200/60 transition-colors"
            title="Reload built-in demo dataset"
          >
            Reset Sample
          </button>
        </div>
      </div>

      {/* Tab 1: Google Sheet Live Sync */}
      {activeTab === 'googleSheet' && (
        <div className="p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Connect Live Google Sheet with Read Permission
                  </h3>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    No API Key Required
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paste your Google Sheet share link (<code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px]">Anyone with the link can view</code>). Real-time updates reflect automatically on GitHub Pages!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {/* Auto Refresh Toggle */}
              <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-300 rounded-md cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={autoSyncEnabled}
                  onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Auto-Sync {autoSyncEnabled ? `(${autoSyncCountdown}s)` : '(Every 60s)'}
                </span>
              </label>

              {/* Guide Button */}
              <button
                type="button"
                onClick={onOpenGoogleGuide}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors shadow-2xs"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>How to Get Link</span>
              </button>
            </div>
          </div>

          {/* URL Input Form */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="relative flex-1">
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={googleSheetUrl}
                onChange={(e) => setGoogleSheetUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSyncGoogleSheet();
                }}
                placeholder="Paste Google Sheet URL: https://docs.google.com/spreadsheets/d/1BxiMVs.../edit?usp=sharing"
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-mono"
              />
            </div>

            <button
              type="button"
              onClick={() => handleSyncGoogleSheet()}
              disabled={isSyncing || !googleSheetUrl.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 rounded-lg transition-colors shadow-xs shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Connecting...' : 'Connect & Live Sync'}</span>
            </button>
          </div>

          {/* Status feedback */}
          {statusMessage && (
            <div
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Excel / CSV File Upload */}
      {activeTab === 'excelUpload' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`p-6 transition-all duration-150 ${
            isDragging ? 'bg-sky-50/50 ring-2 ring-sky-300' : 'bg-white'
          }`}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Upload Customer OEM Spreadsheet
                  </h3>
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    SheetJS Client-Side
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Drag and drop an Excel (<code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px]">.xlsx</code>, <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px]">.xls</code>) or CSV file. Parses Start Date, End Date, Customer, and OEM fields directly in your browser.
                </p>

                {statusMessage && (
                  <div
                    className={`mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md ${
                      statusMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {statusMessage.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span>{statusMessage.text}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-2xs"
                title="Download formatted Excel template (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                <span>Excel Template</span>
              </button>

              <button
                type="button"
                onClick={onOpenTemplateGuide}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Format Guide</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-lg transition-colors shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-200" />
                <span>Choose Excel File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
