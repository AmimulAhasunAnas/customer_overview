import React, { useRef, useState } from 'react';
import { CustomerDeviceRecord } from '../types';
import { parseExcelData, downloadSampleTemplate } from '../excelUtils';
import { SAMPLE_RECORDS } from '../sampleData';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, Sparkles, HelpCircle } from 'lucide-react';

interface ImportDropzoneProps {
  onRecordsLoaded: (records: CustomerDeviceRecord[], filename: string) => void;
  onResetSample: () => void;
  onOpenTemplateGuide: () => void;
}

export const ImportDropzone: React.FC<ImportDropzoneProps> = ({
  onRecordsLoaded,
  onResetSample,
  onOpenTemplateGuide,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
        onRecordsLoaded(records, file.name);
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
    <section
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative bg-white rounded-xl border transition-all duration-150 p-5 ${
        isDragging
          ? 'border-sky-500 bg-sky-50/40 ring-2 ring-sky-200'
          : 'border-slate-200 hover:border-slate-300'
      } shadow-xs`}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left info */}
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Excel &amp; CSV Customer Hardware Importer
              </h2>
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                SheetJS Client-Side
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Drag &amp; drop an Excel workbook (<code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px]">.xlsx</code>, <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px]">.xls</code>, <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px]">.csv</code>) or select from device. Zero server calls.
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

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 justify-end w-full md:w-auto">
          <button
            type="button"
            onClick={downloadSampleTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-xs"
            title="Download an Excel file with formatted headers and sample rows"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Template .XLSX</span>
          </button>

          <button
            type="button"
            onClick={onOpenTemplateGuide}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            title="View column names & requirements"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Format Guide</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onResetSample();
              setStatusMessage({
                type: 'success',
                text: `Reset to standard enterprise dataset (${SAMPLE_RECORDS.length} devices across 8 clients).`,
              });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            title="Reload realistic sample customer data"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Sample Data</span>
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
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-md transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-200" />
            <span>Browse File</span>
          </button>
        </div>
      </div>
    </section>
  );
};
