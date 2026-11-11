import React, { useState, useMemo } from 'react';
import { CustomerDeviceRecord } from './types';
import { SAMPLE_RECORDS } from './sampleData';
import { MetricCards } from './components/MetricCards';
import { ChartsSection } from './components/ChartsSection';
import { ImportDropzone } from './components/ImportDropzone';
import { DataTable } from './components/DataTable';
import { CustomerGroupedView } from './components/CustomerGroupedView';
import { AddDeviceModal } from './components/AddDeviceModal';
import { GitHubPagesModal } from './components/GitHubPagesModal';
import { GoogleSheetGuideModal } from './components/GoogleSheetGuideModal';
import { downloadSampleTemplate } from './excelUtils';
import {
  Server,
  Layers,
  Table,
  Plus,
  Globe,
  FileSpreadsheet,
  Printer,
  Radio,
} from 'lucide-react';

export default function App() {
  const [records, setRecords] = useState<CustomerDeviceRecord[]>(SAMPLE_RECORDS);
  const [activeTab, setActiveTab] = useState<'table' | 'customerCards'>('table');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CustomerDeviceRecord | null>(null);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isGoogleGuideModalOpen, setIsGoogleGuideModalOpen] = useState(false);

  // Data Source Tracking
  const [activeDataSource, setActiveDataSource] = useState<{
    type: 'googleSheet' | 'excel' | 'sample';
    name: string;
    lastSynced?: Date;
    recordCount: number;
  }>({
    type: 'sample',
    name: 'Sample Enterprise Dataset',
    recordCount: SAMPLE_RECORDS.length,
  });

  const existingCustomers = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.customerName))).sort();
  }, [records]);

  const existingOems = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.oemBrand))).sort();
  }, [records]);

  // Handlers
  const handleRecordsLoaded = (newRecords: CustomerDeviceRecord[], sourceName: string, isLiveGoogleSheet = false) => {
    setRecords(newRecords);
    setActiveDataSource({
      type: isLiveGoogleSheet ? 'googleSheet' : 'excel',
      name: sourceName,
      lastSynced: new Date(),
      recordCount: newRecords.length,
    });
  };

  const handleResetSample = () => {
    setRecords(SAMPLE_RECORDS);
    setActiveDataSource({
      type: 'sample',
      name: 'Sample Enterprise Dataset',
      recordCount: SAMPLE_RECORDS.length,
    });
  };

  const handleSaveDevice = (savedRecord: CustomerDeviceRecord) => {
    setRecords((prev) => {
      const index = prev.findIndex((r) => r.id === savedRecord.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = savedRecord;
        return next;
      }
      return [savedRecord, ...prev];
    });
  };

  const handleDeleteDevice = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleEditDevice = (record: CustomerDeviceRecord) => {
    setEditingRecord(record);
    setIsAddModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">Customer OEM Asset Tracker</h1>
                <span className="inline-block text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Real-time Sync
                </span>
              </div>
              <p className="text-xs text-slate-500">Track client accounts &amp; OEM vendor hardware deployments</p>
            </div>
          </div>

          {/* Navigation & Action Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
              <button
                onClick={() => setActiveTab('table')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Inventory Table</span>
              </button>

              <button
                onClick={() => setActiveTab('customerCards')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'customerCards'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Customer Matrix</span>
              </button>
            </div>

            <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>

            {/* Google Sheet Guide */}
            <button
              onClick={() => setIsGoogleGuideModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors shadow-2xs"
              title="Learn how to connect Google Sheets with Read permission"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Sheet Sync</span>
            </button>

            {/* Template Download */}
            <button
              onClick={downloadSampleTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-2xs"
              title="Download formatted Excel template (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Download</span> Template
            </button>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-2xs"
              title="Print full dashboard report"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>

            {/* GitHub Pages Modal trigger */}
            <button
              onClick={() => setIsGitHubModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-800 bg-sky-50 border border-sky-200 rounded-md hover:bg-sky-100 transition-colors shadow-2xs"
              title="Download standalone index.html & see GitHub Pages instructions"
            >
              <Globe className="w-3.5 h-3.5 text-sky-600" />
              <span>GitHub Pages</span>
            </button>

            {/* Add Asset Button */}
            <button
              onClick={() => {
                setEditingRecord(null);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Device</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6 w-full">
        {/* Dropzone & Import Section with Google Sheet Live Sync & Excel Upload */}
        <ImportDropzone
          onRecordsLoaded={handleRecordsLoaded}
          onResetSample={handleResetSample}
          onOpenTemplateGuide={() => setIsGitHubModalOpen(true)}
          onOpenGoogleGuide={() => setIsGoogleGuideModalOpen(true)}
          activeDataSource={activeDataSource}
        />

        {/* Executive Metric Cards */}
        <MetricCards records={records} />

        {/* Visual Charts Section (Chart.js) with Fixed Vibrant OEM Colors */}
        <ChartsSection records={records} />

        {/* Dynamic Main View: Tabular Inventory vs Customer Grouped Cards */}
        {activeTab === 'table' ? (
          <DataTable
            records={records}
            onAddDevice={() => {
              setEditingRecord(null);
              setIsAddModalOpen(true);
            }}
            onEditDevice={handleEditDevice}
            onDeleteDevice={handleDeleteDevice}
          />
        ) : (
          <CustomerGroupedView
            records={records}
            onEditDevice={handleEditDevice}
            onDeleteDevice={handleDeleteDevice}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>
            Customer OEM Asset Tracker &bull; Client-Side Static Architecture with Google Sheet Live Sync &amp; Excel Upload
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsGoogleGuideModalOpen(true)}
              className="text-emerald-700 hover:text-emerald-800 underline"
            >
              Google Sheet Guide
            </button>
            <button
              onClick={() => setIsGitHubModalOpen(true)}
              className="text-sky-600 hover:text-sky-800 underline"
            >
              Export Standalone index.html
            </button>
            <button
              onClick={downloadSampleTemplate}
              className="text-slate-600 hover:text-slate-800 underline"
            >
              Excel Template (.xlsx)
            </button>
          </div>
        </div>
      </footer>

      {/* Add / Edit Device Modal */}
      <AddDeviceModal
        isOpen={isAddModalOpen}
        editingRecord={editingRecord}
        existingCustomers={existingCustomers}
        existingOems={existingOems}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSaveDevice}
      />

      {/* GitHub Pages & Standalone Export Modal */}
      <GitHubPagesModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        currentRecords={records}
      />

      {/* Google Sheet Live Sync Guide Modal */}
      <GoogleSheetGuideModal
        isOpen={isGoogleGuideModalOpen}
        onClose={() => setIsGoogleGuideModalOpen(false)}
        onApplyUrl={(url) => {
          localStorage.setItem('customer_oem_google_sheet_url', url);
        }}
      />
    </div>
  );
}
