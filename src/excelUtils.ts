import * as XLSX from 'xlsx';
import { CustomerDeviceRecord, DeviceStatus } from './types';
import { SAMPLE_RECORDS } from './sampleData';

/**
 * Returns distinct, official brand colors for networking and security OEM vendors
 */
export function getOemBrandColor(oem: string): string {
  if (!oem) return '#0284c7';
  const clean = oem.toLowerCase().replace(/[^a-z0-9]/g, '');

  // User's specific OEMs with official brand identities
  if (clean.includes('cisco')) return '#0284c7'; // Cisco Blue
  if (clean === 'f5' || clean.includes('f5')) return '#e11d48'; // F5 Ruby Red
  if (clean.includes('checkpoint') || clean.includes('chkp')) return '#d946ef'; // Check Point Magenta
  if (clean.includes('paloalto') || clean.includes('palo') || clean.includes('panw')) return '#f97316'; // Palo Alto Orange
  if (clean.includes('fortinet') || clean.includes('forti')) return '#b91c1c'; // Fortinet Crimson Red
  if (clean.includes('algosec') || clean.includes('algo')) return '#059669'; // AlgoSec Emerald Green

  // Additional enterprise brands
  if (clean.includes('dell')) return '#2563eb'; // Dell Blue
  if (clean.includes('hp') || clean.includes('hpe')) return '#0d9488'; // HP Teal
  if (clean.includes('lenovo')) return '#dc2626'; // Lenovo Red
  if (clean.includes('juniper')) return '#4f46e5'; // Juniper Indigo
  if (clean.includes('arista')) return '#7c3aed'; // Arista Violet
  if (clean.includes('vmware')) return '#16a34a'; // VMware Green
  if (clean.includes('sophos')) return '#2563eb'; // Sophos Blue
  if (clean.includes('crowdstrike')) return '#e11d48'; // Crowdstrike Red
  if (clean.includes('zscaler')) return '#0369a1'; // Zscaler Blue

  // Curated vibrant dynamic palette so no OEM ever defaults to dull gray
  const palette = [
    '#0284c7', '#e11d48', '#d946ef', '#f97316', '#b91c1c',
    '#059669', '#7c3aed', '#4f46e5', '#0d9488', '#ea580c', '#0891b2'
  ];
  let hash = 0;
  for (let i = 0; i < clean.length; i++) hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

/**
 * Normalizes headers and maps raw sheet objects into typed CustomerDeviceRecord items.
 */
export function parseExcelData(dataBuffer: ArrayBuffer | Uint8Array): {
  records: CustomerDeviceRecord[];
  errors: string[];
} {
  const errors: string[] = [];
  try {
    const workbook = XLSX.read(dataBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { records: [], errors: ['Excel file contains no sheets.'] };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: '',
      raw: false,
    });

    if (!rawRows || rawRows.length === 0) {
      return { records: [], errors: ['No data rows found in the sheet.'] };
    }

    // Helper to find a value using multiple potential header names
    const getField = (row: Record<string, unknown>, candidateKeys: string[]): string => {
      const normalizedRowKeys = Object.keys(row).map((k) => ({
        original: k,
        clean: k.toLowerCase().replace(/[^a-z0-9]/g, ''),
      }));

      for (const candidate of candidateKeys) {
        const cleanCandidate = candidate.toLowerCase().replace(/[^a-z0-9]/g, '');
        const match = normalizedRowKeys.find((nk) => nk.clean === cleanCandidate);
        if (match && row[match.original] !== undefined && row[match.original] !== null) {
          return String(row[match.original]).trim();
        }
      }
      return '';
    };

    const parsedRecords: CustomerDeviceRecord[] = [];

    rawRows.forEach((row, index) => {
      const customerName = getField(row, [
        'Customer Name',
        'Customer',
        'Company Name',
        'Company',
        'Client',
        'Client Name',
        'Account Name',
        'Account',
        'Organization',
      ]);

      const oemBrand = getField(row, [
        'OEM Brand',
        'OEM',
        'Vendor',
        'Manufacturer',
        'Brand',
        'Hardware Vendor',
        'Hardware Brand',
        'Make',
        'OEM Provider',
        'OEM Name',
      ]);

      const deviceModel = getField(row, [
        'Device Type / Model',
        'Device Model',
        'Model',
        'Device Type',
        'Hardware Model',
        'Product',
        'Equipment',
        'Appliance',
      ]);

      const serialNumber = getField(row, [
        'Device Serial Number / Hostname',
        'Device Serial Number',
        'Serial Number',
        'Serial',
        'Hostname',
        'S/N',
        'Host Name',
        'Asset Tag',
        'Serial #',
        'Serial No',
      ]);

      const rawStatus = getField(row, ['Status', 'State', 'Lifecycle Status', 'Condition', 'Device Status']);
      const industry = getField(row, ['Industry / Sector', 'Industry', 'Sector', 'Vertical', 'Category']) || 'General Enterprise';
      const location = getField(row, ['Location', 'Site', 'Data Center', 'Facility', 'Region', 'Office', 'Branch']);
      const startDate = getField(row, [
        'Start Date',
        'Deployment Start',
        'Contract Start',
        'Install Date',
        'Start Date / Deployment',
        'Start',
        'Installation Date',
        'Deployment Date',
      ]);
      const endDate = getField(row, [
        'End Date',
        'Contract End',
        'Warranty Expiration',
        'Warranty',
        'Expiry Date',
        'Warranty End',
        'End Date / Expiry',
        'End',
        'Expiration Date',
        'Renewal Date',
      ]);

      // Skip completely blank rows
      if (!customerName && !oemBrand && !deviceModel && !serialNumber) {
        return;
      }

      // Normalize status
      let status: DeviceStatus = 'Active';
      const lowerStatus = rawStatus.toLowerCase();
      if (lowerStatus.includes('maint') || lowerStatus.includes('repair') || lowerStatus.includes('service')) {
        status = 'Maintenance';
      } else if (lowerStatus.includes('retir') || lowerStatus.includes('decom') || lowerStatus.includes('inactive') || lowerStatus.includes('end')) {
        status = 'Retired';
      }

      parsedRecords.push({
        id: `rec-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
        customerName: customerName || 'Unknown Customer',
        industry: industry || 'Enterprise',
        oemBrand: oemBrand || 'Generic OEM',
        deviceModel: deviceModel || 'Standard Hardware',
        serialNumber: serialNumber || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
        status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        location: location || undefined,
        warrantyExpiry: endDate || undefined,
      });
    });

    return { records: parsedRecords, errors };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown parsing error';
    return { records: [], errors: [`Failed to parse file: ${message}`] };
  }
}

/**
 * Downloads a pre-formatted Excel template for the user.
 */
export function downloadSampleTemplate(): void {
  const templateRows = [
    {
      'Customer Name': 'Apex Capital Partners',
      'Industry / Sector': 'Financial Services',
      'OEM Brand': 'Cisco',
      'Device Type / Model': 'Catalyst 9300 48P Switch',
      'Device Serial Number / Hostname': 'CSCO-9300-8812A',
      'Status': 'Active',
      'Start Date': '2023-08-15',
      'End Date': '2027-08-15',
      'Location': 'NY-Primary DC (Equinix NY4)',
    },
    {
      'Customer Name': 'Apex Capital Partners',
      'Industry / Sector': 'Financial Services',
      'OEM Brand': 'F5',
      'Device Type / Model': 'BIG-IP i5800 ADC Appliance',
      'Device Serial Number / Hostname': 'F5-BIGIP-9901X',
      'Status': 'Active',
      'Start Date': '2023-01-20',
      'End Date': '2026-01-20',
      'Location': 'NY-Primary DC (Equinix NY4)',
    },
    {
      'Customer Name': 'AcroPoint Global Logistics',
      'Industry / Sector': 'Supply Chain & Freight',
      'OEM Brand': 'Palo Alto',
      'Device Type / Model': 'PA-3260 Next-Gen Firewall',
      'Device Serial Number / Hostname': 'PANW-3260-X0921',
      'Status': 'Active',
      'Start Date': '2022-11-30',
      'End Date': '2026-11-30',
      'Location': 'Chicago Hub (ORD-01)',
    },
    {
      'Customer Name': 'AcroPoint Global Logistics',
      'Industry / Sector': 'Supply Chain & Freight',
      'OEM Brand': 'Checkpoint',
      'Device Type / Model': 'Quantum 6200 Security Gateway',
      'Device Serial Number / Hostname': 'CHKP-6200-Z4419',
      'Status': 'Active',
      'Start Date': '2022-04-12',
      'End Date': '2026-04-12',
      'Location': 'Chicago Hub (ORD-01)',
    },
    {
      'Customer Name': 'Zenith Health Systems',
      'Industry / Sector': 'Healthcare',
      'OEM Brand': 'FortiNet',
      'Device Type / Model': 'FortiGate 200F NGFW',
      'Device Serial Number / Hostname': 'FG-200F-H8821',
      'Status': 'Maintenance',
      'Start Date': '2021-09-14',
      'End Date': '2025-09-14',
      'Location': 'Boston Clinical HQ',
    },
    {
      'Customer Name': 'Zenith Health Systems',
      'Industry / Sector': 'Healthcare',
      'OEM Brand': 'Algosec',
      'Device Type / Model': 'AlgoSec Security Management Suite',
      'Device Serial Number / Hostname': 'ALGO-SMS-V332',
      'Status': 'Active',
      'Start Date': '2023-05-18',
      'End Date': '2026-05-18',
      'Location': 'Boston Clinical HQ',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateRows);

  worksheet['!cols'] = [
    { wch: 28 }, // Customer Name
    { wch: 24 }, // Industry
    { wch: 16 }, // OEM Brand
    { wch: 32 }, // Device Model
    { wch: 30 }, // Serial Number
    { wch: 14 }, // Status
    { wch: 14 }, // Start Date
    { wch: 14 }, // End Date
    { wch: 30 }, // Location
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customer_OEM_Assets');
  XLSX.writeFile(workbook, 'customer_oem_template.xlsx');
}

/**
 * Exports current records to an Excel file.
 */
export function exportRecordsToExcel(records: CustomerDeviceRecord[], filename = 'customer_oem_inventory.xlsx'): void {
  const exportRows = records.map((r) => ({
    'Customer Name': r.customerName,
    'Industry / Sector': r.industry,
    'OEM Brand': r.oemBrand,
    'Device Type / Model': r.deviceModel,
    'Device Serial Number / Hostname': r.serialNumber,
    'Status': r.status,
    'Start Date': r.startDate || '',
    'End Date': r.endDate || '',
    'Location': r.location || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  worksheet['!cols'] = [
    { wch: 28 },
    { wch: 24 },
    { wch: 16 },
    { wch: 32 },
    { wch: 30 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Assets');
  XLSX.writeFile(workbook, filename);
}

/**
 * Returns the standalone single-file index.html string ready for GitHub Pages.
 * Includes Google Sheets live real-time sync with read permission, Excel upload,
 * Start Date, End Date, print button, and vibrant OEM brand colors.
 */
export function getStandaloneHtmlString(currentRecords?: CustomerDeviceRecord[]): string {
  const dataset = currentRecords && currentRecords.length > 0 ? currentRecords : SAMPLE_RECORDS;
  const jsonPayload = JSON.stringify(dataset, null, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Customer OEM Asset Tracker - GitHub Pages</title>
  <meta name="description" content="Client-side enterprise dashboard tracking customer hardware inventory and OEM vendor deployments with real-time Google Sheets sync.">

  <!-- Tailwind CSS via CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#f0f7ff',
              100: '#e0effe',
              500: '#0284c7',
              600: '#0369a1',
              700: '#075985',
              900: '#0c4a6e',
            }
          }
        }
      }
    }
  </script>

  <!-- SheetJS (xlsx.full.min.js) via CDN -->
  <script src="https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"></script>

  <!-- Chart.js via CDN -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>

  <style>
    /* Custom scrollbar and subtle transitions */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #f1f5f9; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    @media print {
      header, footer, #dataSourceSection, .no-print, input, select, button {
        display: none !important;
      }
      body {
        background-color: #ffffff !important;
        color: #000000 !important;
        font-size: 10pt !important;
      }
      .shadow-xs, .shadow-sm, .shadow-md, .shadow-2xs {
        box-shadow: none !important;
      }
      table {
        width: 100% !important;
        border-collapse: collapse !important;
      }
      th, td {
        padding: 5px 8px !important;
        border: 1px solid #cbd5e1 !important;
      }
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 font-sans antialiased min-h-screen flex flex-col">

  <!-- Top Navigation Header -->
  <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-base font-bold text-slate-900 tracking-tight">Customer OEM Asset Tracker</h1>
            <span class="inline-block text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Ready
            </span>
          </div>
          <p class="text-xs text-slate-500">Track client accounts, OEM vendors &amp; real-time hardware deployments</p>
        </div>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <button id="btnPrint" onclick="window.print()" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-xs" title="Print dashboard report">
          <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>

        <button id="btnDownloadTemplate" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-xs">
          <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Excel Template
        </button>

        <button id="btnExportData" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-xs">
          <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Excel
        </button>

        <button id="btnResetData" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors">
          Reset Sample
        </button>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6 w-full">

    <!-- Data Source Section: Google Sheet Live Sync & Excel Upload -->
    <section id="dataSourceSection" class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <!-- Tabs -->
      <div class="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5 gap-2">
        <div class="flex items-center gap-1.5 p-0.5 bg-slate-200/80 rounded-lg">
          <button id="tabBtnGoogle" onclick="switchTab('google')" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-white text-emerald-700 shadow-xs">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Google Sheet Live Sync
            <span class="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">Real-time</span>
          </button>
          <button id="tabBtnExcel" onclick="switchTab('excel')" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md text-slate-600 hover:text-slate-900">
            <svg class="w-3.5 h-3.5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Excel File Upload
          </button>
        </div>

        <div class="flex items-center gap-2 text-xs">
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700">
            <span class="text-[11px] text-slate-400">Current Source:</span>
            <span id="activeSourceLabel" class="font-semibold text-slate-900">Sample Dataset</span>
            <span id="lastSyncedTime" class="text-[10px] text-slate-400"></span>
          </div>
        </div>
      </div>

      <!-- Tab Content: Google Sheet Live Sync -->
      <div id="tabContentGoogle" class="p-5 space-y-3.5">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div class="flex items-start gap-3">
            <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0 border border-emerald-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 class="text-sm font-bold text-slate-900">Connect Google Sheet with Read Permission</h2>
              <p class="text-xs text-slate-500 mt-0.5">
                Paste your Google Sheet link (<span class="font-medium text-slate-700">Anyone with the link can view</span>). Live changes made in Google Sheets sync directly into your dashboard!
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <label class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-300 rounded-md cursor-pointer hover:bg-slate-100">
              <input type="checkbox" id="autoSyncCheckbox" onchange="toggleAutoSync(this.checked)" class="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5" />
              <span id="autoSyncLabel">Auto-Sync (60s)</span>
            </label>
            <button onclick="toggleGoogleModal(true)" class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100">
              How to Get Link
            </button>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch gap-2">
          <input
            type="text"
            id="googleSheetInput"
            placeholder="Paste Google Sheet URL: https://docs.google.com/spreadsheets/d/1BxiMVs.../edit?usp=sharing"
            class="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
            onkeydown="if(event.key==='Enter') connectGoogleSheet()"
          />
          <button
            id="btnConnectGoogle"
            onclick="connectGoogleSheet()"
            class="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-colors shrink-0"
          >
            <span>Connect &amp; Live Sync</span>
          </button>
        </div>

        <div id="googleSyncStatus" class="text-xs font-medium hidden"></div>
      </div>

      <!-- Tab Content: Excel Upload -->
      <div id="tabContentExcel" class="p-5 hidden">
        <div id="dropzoneContainer" class="border border-dashed border-slate-300 rounded-lg p-5 transition-all hover:border-sky-500 flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-start gap-3">
            <div class="p-2.5 bg-sky-50 text-sky-600 rounded-lg shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h2 class="text-sm font-semibold text-slate-900">Upload Excel Spreadsheet</h2>
              <p class="text-xs text-slate-500 mt-0.5">Drag and drop an Excel (.xlsx, .xls) or CSV file. 100% client-side parsing via SheetJS.</p>
              <div id="excelUploadStatus" class="mt-2 text-xs text-emerald-600 font-medium hidden"></div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <label for="excelFileInput" class="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors">
              Choose Excel File
            </label>
            <input type="file" id="excelFileInput" accept=".xlsx, .xls, .csv" class="hidden" />
          </div>
        </div>
      </div>
    </section>

    <!-- Executive Metric Cards -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <p class="text-xs font-medium text-slate-500">Total Customers</p>
        <div class="mt-2 flex items-baseline justify-between">
          <span id="metricTotalCustomers" class="text-2xl font-bold text-slate-900">0</span>
          <span class="text-xs text-slate-500">Enterprise accounts</span>
        </div>
      </div>

      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <p class="text-xs font-medium text-slate-500">Total Tracked Devices</p>
        <div class="mt-2 flex items-baseline justify-between">
          <span id="metricTotalDevices" class="text-2xl font-bold text-slate-900">0</span>
          <span class="text-xs text-slate-500">Hardware assets</span>
        </div>
      </div>

      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <p class="text-xs font-medium text-slate-500">Top OEM Provider</p>
        <div class="mt-2 flex items-baseline justify-between">
          <span id="metricTopOem" class="text-2xl font-bold text-slate-900">-</span>
          <span id="metricTopOemSub" class="text-xs text-slate-500">0% of fleet</span>
        </div>
      </div>

      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <p class="text-xs font-medium text-slate-500">Active Deployments</p>
        <div class="mt-2 flex items-baseline justify-between">
          <span id="metricActiveDeployments" class="text-2xl font-bold text-slate-900">0</span>
          <span id="metricActiveRate" class="text-xs text-emerald-600 font-medium">100% operational</span>
        </div>
      </div>
    </section>

    <!-- Visual Charts Section (Chart.js) with Vibrant OEM Brand Colors -->
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- OEM Breakdown Donut -->
      <div class="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-sm font-semibold text-slate-900">OEM Fleet Breakdown</h3>
            <p class="text-xs text-slate-500">Device distribution by manufacturer</p>
          </div>
          <span id="chartTotalBadge" class="text-xs text-slate-400 font-medium"></span>
        </div>
        <div class="relative h-64 mt-4 flex items-center justify-center">
          <canvas id="chartOemBreakdown"></canvas>
        </div>
      </div>

      <!-- Customer Distribution Bar -->
      <div class="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-sm font-semibold text-slate-900">Customer Count by OEM</h3>
            <p class="text-xs text-slate-500">Distinct corporate client accounts utilizing each OEM brand</p>
          </div>
        </div>
        <div class="relative h-64 mt-4">
          <canvas id="chartCustomerOem"></canvas>
        </div>
      </div>
    </section>

    <!-- Filter & Management Controls + Data Table -->
    <section class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="p-4 border-b border-slate-200 bg-slate-50/75 flex flex-wrap items-center justify-between gap-3">
        <!-- Search -->
        <div class="relative flex-1 min-w-[260px] max-w-md">
          <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            id="searchInput"
            placeholder="Search customer, OEM, model, serial, dates..."
            class="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
          />
          <button id="clearSearchBtn" class="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 hidden text-xs font-bold">&times;</button>
        </div>

        <!-- Filter Dropdowns -->
        <div class="flex items-center gap-2 flex-wrap">
          <select id="filterOem" class="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500">
            <option value="">All OEMs</option>
          </select>

          <select id="filterStatus" class="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500">
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Retired">Retired</option>
          </select>

          <select id="filterIndustry" class="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500">
            <option value="">All Industries</option>
          </select>

          <div class="h-5 w-px bg-slate-200 mx-1"></div>

          <span id="filteredCountText" class="text-xs text-slate-500 font-medium">0 items</span>
        </div>
      </div>

      <!-- Data Table with Start Date and End Date -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-100/75 text-slate-700 font-semibold select-none">
              <th id="thCustomer" class="py-3 px-4 cursor-pointer hover:bg-slate-200/50 transition-colors">
                <div class="flex items-center gap-1">
                  <span>Customer / Company</span>
                  <span class="sort-icon text-slate-400">↕</span>
                </div>
              </th>
              <th id="thIndustry" class="py-3 px-4 cursor-pointer hover:bg-slate-200/50 transition-colors">
                <div class="flex items-center gap-1">
                  <span>Industry</span>
                  <span class="sort-icon text-slate-400">↕</span>
                </div>
              </th>
              <th id="thOem" class="py-3 px-4 cursor-pointer hover:bg-slate-200/50 transition-colors">
                <div class="flex items-center gap-1">
                  <span>OEM Brand</span>
                  <span class="sort-icon text-slate-400">↕</span>
                </div>
              </th>
              <th id="thModel" class="py-3 px-4 cursor-pointer hover:bg-slate-200/50 transition-colors">
                <div class="flex items-center gap-1">
                  <span>Device Model</span>
                  <span class="sort-icon text-slate-400">↕</span>
                </div>
              </th>
              <th class="py-3 px-4">Serial Number / Hostname</th>
              <th id="thStatus" class="py-3 px-4 cursor-pointer hover:bg-slate-200/50 transition-colors">
                <div class="flex items-center gap-1">
                  <span>Status</span>
                  <span class="sort-icon text-slate-400">↕</span>
                </div>
              </th>
              <th id="thStartDate" class="py-3 px-4 cursor-pointer hover:bg-slate-200/50 transition-colors whitespace-nowrap">
                <div class="flex items-center gap-1">
                  <span>Start Date</span>
                  <span class="sort-icon text-slate-400">↕</span>
                </div>
              </th>
              <th id="thEndDate" class="py-3 px-4 cursor-pointer hover:bg-slate-200/50 transition-colors whitespace-nowrap">
                <div class="flex items-center gap-1">
                  <span>End Date</span>
                  <span class="sort-icon text-slate-400">↕</span>
                </div>
              </th>
              <th class="py-3 px-4 text-right">Location</th>
            </tr>
          </thead>
          <tbody id="tableBody" class="divide-y divide-slate-100 font-normal">
            <!-- Populated via JavaScript -->
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div id="emptyState" class="py-12 text-center hidden">
        <p class="text-sm font-medium text-slate-700">No matching records found</p>
        <p class="text-xs text-slate-500 mt-1">Try adjusting your search criteria or resetting filters.</p>
      </div>

      <!-- Table Pagination Footer -->
      <div class="p-3 border-t border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div class="flex items-center gap-2">
          <span>Show</span>
          <select id="pageSizeSelect" class="bg-white border border-slate-300 rounded px-2 py-1 text-xs">
            <option value="10">10</option>
            <option value="25" selected>25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span id="paginationInfo">Showing 1 to 25 of 25</span>
        </div>

        <div class="flex items-center gap-1" id="paginationButtons">
          <button id="btnPrevPage" class="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40">Previous</button>
          <button id="btnNextPage" class="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40">Next</button>
        </div>
      </div>
    </section>
  </main>

  <!-- Google Sheet Help Modal -->
  <div id="googleGuideModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs hidden">
    <div class="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-50/50">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-900">How to Connect your Google Sheet</h3>
            <p class="text-xs text-slate-500">Read Permission Setup in 3 Simple Steps</p>
          </div>
        </div>
        <button onclick="toggleGoogleModal(false)" class="text-slate-400 hover:text-slate-600 p-1">&times;</button>
      </div>

      <div class="p-6 overflow-y-auto space-y-4 text-xs text-slate-600">
        <div class="flex gap-3">
          <div class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">1</div>
          <div>
            <p class="font-semibold text-slate-900">Open your Google Sheet</p>
            <p class="text-slate-500 mt-0.5">Open the Google spreadsheet (or Excel uploaded to Drive) in your web browser.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">2</div>
          <div class="space-y-1">
            <p class="font-semibold text-slate-900">Set Permission to &quot;Anyone with the link&quot; (Viewer)</p>
            <p class="text-slate-500">Click the blue <strong class="text-slate-800">Share</strong> button at the top-right.</p>
            <div class="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px]">
              Under <strong>General access</strong>, change <em>Restricted</em> to <strong>Anyone with the link</strong>. Keep role as <strong>Viewer</strong>. Click <strong>Copy link</strong>.
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">3</div>
          <div>
            <p class="font-semibold text-slate-900">Paste Link or Save in Code</p>
            <p class="text-slate-500 mt-0.5">
              Paste the link into the dashboard input and click <strong>Connect &amp; Live Sync</strong>. The app remembers your link and syncs live updates directly in the browser!
            </p>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-200">
          <p class="font-semibold text-slate-800 text-[11px] mb-1">To hardcode default in code on GitHub Pages:</p>
          <pre class="p-2.5 bg-slate-900 text-slate-100 rounded text-[11px] font-mono overflow-x-auto">const DEFAULT_GOOGLE_SHEET_URL = "YOUR_GOOGLE_SHEET_SHARE_LINK_HERE";</pre>
        </div>
      </div>

      <div class="px-6 py-3 border-t border-slate-200 bg-slate-50 text-right">
        <button onclick="toggleGoogleModal(false)" class="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100">
          Got it
        </button>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <footer class="bg-white border-t border-slate-200 py-4 mt-8">
    <div class="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
      <p>Customer OEM Tracker &bull; Standalone Single-Page Application for GitHub Pages</p>
      <p>Supports Real-Time Google Sheets Sync + SheetJS Client-Side Upload</p>
    </div>
  </footer>

  <!-- Application Logic -->
  <script>
    // =========================================================================
    // 🔗 GOOGLE SHEET REAL-TIME CONFIGURATION
    // Paste your Google Sheet Share Link below (with "Anyone with the link can view")
    // Example: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing"
    // =========================================================================
    const DEFAULT_GOOGLE_SHEET_URL = "";

    // Embedded sample fallback dataset
    const DEFAULT_RECORDS = ${jsonPayload};

    let allRecords = JSON.parse(JSON.stringify(DEFAULT_RECORDS));
    let filteredRecords = [...allRecords];
    let sortField = 'customerName';
    let sortAsc = true;
    let currentPage = 1;
    let pageSize = 25;

    let chartOemInstance = null;
    let chartCustomerInstance = null;

    let autoSyncTimer = null;
    let autoSyncCountdown = 60;
    let isAutoSyncRunning = false;

    // Defined official brand colors for OEM manufacturers
    function getOemColor(oem) {
      if (!oem) return '#0284c7';
      const clean = oem.toLowerCase().replace(/[^a-z0-9]/g, '');

      // User's specific OEMs with official vibrant brand identities
      if (clean.includes('cisco')) return '#0284c7'; // Cisco Blue
      if (clean === 'f5' || clean.includes('f5')) return '#e11d48'; // F5 Ruby Red
      if (clean.includes('checkpoint') || clean.includes('chkp')) return '#d946ef'; // Check Point Magenta
      if (clean.includes('paloalto') || clean.includes('palo') || clean.includes('panw')) return '#f97316'; // Palo Alto Orange
      if (clean.includes('fortinet') || clean.includes('forti')) return '#b91c1c'; // Fortinet Crimson Red
      if (clean.includes('algosec') || clean.includes('algo')) return '#059669'; // AlgoSec Emerald Green

      // Additional enterprise brands
      if (clean.includes('dell')) return '#2563eb'; // Dell Blue
      if (clean.includes('hp') || clean.includes('hpe')) return '#0d9488'; // HP Teal
      if (clean.includes('lenovo')) return '#dc2626'; // Lenovo Red
      if (clean.includes('juniper')) return '#4f46e5'; // Juniper Indigo
      if (clean.includes('arista')) return '#7c3aed'; // Arista Violet
      if (clean.includes('vmware')) return '#16a34a'; // VMware Green
      if (clean.includes('sophos')) return '#2563eb'; // Sophos Blue
      if (clean.includes('crowdstrike')) return '#e11d48'; // Crowdstrike Red
      if (clean.includes('zscaler')) return '#0369a1'; // Zscaler Blue

      // Dynamic curated palette so no OEM ever defaults to dull gray
      const palette = ['#0284c7', '#e11d48', '#d946ef', '#f97316', '#b91c1c', '#059669', '#7c3aed', '#4f46e5', '#0d9488', '#ea580c'];
      let hash = 0;
      for (let i = 0; i < clean.length; i++) hash = clean.charCodeAt(i) + ((hash << 5) - hash);
      return palette[Math.abs(hash) % palette.length];
    }

    // Tab Switching
    function switchTab(tab) {
      const tabGoogle = document.getElementById('tabContentGoogle');
      const tabExcel = document.getElementById('tabContentExcel');
      const btnGoogle = document.getElementById('tabBtnGoogle');
      const btnExcel = document.getElementById('tabBtnExcel');

      if (tab === 'google') {
        tabGoogle.classList.remove('hidden');
        tabExcel.classList.add('hidden');
        btnGoogle.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-white text-emerald-700 shadow-xs';
        btnExcel.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md text-slate-600 hover:text-slate-900';
      } else {
        tabGoogle.classList.add('hidden');
        tabExcel.classList.remove('hidden');
        btnGoogle.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md text-slate-600 hover:text-slate-900';
        btnExcel.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-white text-sky-700 shadow-xs';
      }
    }

    function toggleGoogleModal(show) {
      const modal = document.getElementById('googleGuideModal');
      if (show) modal.classList.remove('hidden');
      else modal.classList.add('hidden');
    }

    // Google Sheets Fetching Logic
    async function connectGoogleSheet(silent = false) {
      const input = document.getElementById('googleSheetInput');
      const statusEl = document.getElementById('googleSyncStatus');
      const url = input.value.trim() || DEFAULT_GOOGLE_SHEET_URL;

      if (!url) {
        if (!silent) {
          statusEl.textContent = 'Please paste a valid Google Sheet URL.';
          statusEl.className = 'text-xs font-medium text-rose-600';
          statusEl.classList.remove('hidden');
        }
        return;
      }

      // Convert URL to Google Visualization API CSV stream (CORS friendly)
      let csvUrl = '';
      if (url.includes('output=csv')) {
        csvUrl = url + (url.includes('?') ? '&' : '?') + '_ts=' + Date.now();
      } else {
        const idMatch = url.match(/\\/spreadsheets\\/d\\/([a-zA-Z0-9-_]+)/);
        const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
        const sheetId = idMatch ? idMatch[1] : null;
        const gid = gidMatch ? gidMatch[1] : '0';

        if (!sheetId) {
          statusEl.textContent = 'Could not find Spreadsheet ID in URL. Check format: https://docs.google.com/spreadsheets/d/ID/edit';
          statusEl.className = 'text-xs font-medium text-rose-600';
          statusEl.classList.remove('hidden');
          return;
        }
        csvUrl = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq?tqx=out:csv&gid=' + gid + '&_ts=' + Date.now();
      }

      if (!silent) {
        statusEl.textContent = 'Connecting to Google Sheet & fetching latest changes...';
        statusEl.className = 'text-xs font-medium text-sky-600';
        statusEl.classList.remove('hidden');
      }

      try {
        const resp = await fetch(csvUrl, { cache: 'no-store' });
        if (!resp.ok) {
          throw new Error('HTTP ' + resp.status + ' (' + resp.statusText + ')');
        }

        const csvText = await resp.text();
        if (csvText.includes('<!DOCTYPE html>') || csvText.includes('<html')) {
          throw new Error('Permission denied. Please set your Google Sheet to "Anyone with the link can view".');
        }

        // Parse with SheetJS
        const workbook = XLSX.read(csvText, { type: 'string' });
        const firstSheet = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '', raw: false });

        if (!rows || rows.length === 0) {
          throw new Error('No data rows found in Google Sheet.');
        }

        const parsed = parseSheetRows(rows);
        if (parsed.length === 0) {
          throw new Error('Could not match expected columns (Customer Name, OEM Brand, etc.)');
        }

        allRecords = parsed;
        localStorage.setItem('customer_oem_google_sheet_url', url);
        currentPage = 1;
        populateFilterOptions();
        applyFilters();

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        document.getElementById('activeSourceLabel').textContent = 'Google Sheet Live';
        document.getElementById('lastSyncedTime').textContent = '(Synced ' + timeStr + ')';

        statusEl.textContent = 'Synced successfully! Loaded ' + parsed.length + ' real-time records from Google Sheet (' + timeStr + ').';
        statusEl.className = 'text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded inline-block';
        statusEl.classList.remove('hidden');
      } catch (err) {
        statusEl.textContent = 'Sync error: ' + err.message;
        statusEl.className = 'text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded inline-block';
        statusEl.classList.remove('hidden');
      }
    }

    function toggleAutoSync(enable) {
      isAutoSyncRunning = enable;
      const label = document.getElementById('autoSyncLabel');
      if (autoSyncTimer) clearInterval(autoSyncTimer);

      if (enable) {
        autoSyncCountdown = 60;
        autoSyncTimer = setInterval(() => {
          autoSyncCountdown--;
          if (autoSyncCountdown <= 0) {
            connectGoogleSheet(true);
            autoSyncCountdown = 60;
          }
          label.textContent = 'Auto-Sync (' + autoSyncCountdown + 's)';
        }, 1000);
      } else {
        label.textContent = 'Auto-Sync (60s)';
      }
    }

    // Row parser with extensive synonym matching
    function parseSheetRows(rows) {
      const parsed = [];
      rows.forEach((row, i) => {
        const getVal = (candidates) => {
          for (const k of Object.keys(row)) {
            const clean = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            for (const c of candidates) {
              if (clean === c.toLowerCase().replace(/[^a-z0-9]/g, '')) {
                return String(row[k]).trim();
              }
            }
          }
          return '';
        };

        const customer = getVal(['Customer Name', 'Customer', 'Company Name', 'Company', 'Client', 'Client Name', 'Account Name', 'Organization']);
        const oem = getVal(['OEM Brand', 'OEM', 'Vendor', 'Manufacturer', 'Brand', 'Hardware Vendor', 'Make', 'OEM Provider', 'OEM Name']);
        const model = getVal(['Device Type / Model', 'Device Model', 'Model', 'Device Type', 'Hardware Model', 'Product', 'Equipment']);
        const serial = getVal(['Device Serial Number / Hostname', 'Serial Number', 'Serial', 'Hostname', 'S/N', 'Asset Tag', 'Serial #']);
        const rawStatus = getVal(['Status', 'State', 'Lifecycle Status', 'Condition']);
        const startDate = getVal(['Start Date', 'Deployment Start', 'Contract Start', 'Install Date', 'Start Date / Deployment', 'Start']);
        const endDate = getVal(['End Date', 'Contract End', 'Warranty Expiration', 'Warranty', 'Expiry Date', 'Warranty End', 'End Date / Expiry', 'End']);
        const industry = getVal(['Industry / Sector', 'Industry', 'Sector', 'Vertical']) || 'Enterprise';
        const location = getVal(['Location', 'Site', 'Data Center', 'Facility', 'Region']);

        if (!customer && !oem && !serial && !model) return;

        let status = 'Active';
        const st = rawStatus.toLowerCase();
        if (st.includes('maint') || st.includes('repair')) status = 'Maintenance';
        else if (st.includes('retir') || st.includes('decom') || st.includes('inactive')) status = 'Retired';

        parsed.push({
          id: 'rec-' + i + '-' + Math.random().toString(36).substr(2, 4),
          customerName: customer || 'Unknown Client',
          industry: industry,
          oemBrand: oem || 'Generic OEM',
          deviceModel: model || 'Appliance',
          serialNumber: serial || 'SN-' + (100000 + i),
          status: status,
          startDate: startDate || '',
          endDate: endDate || '',
          location: location || ''
        });
      });
      return parsed;
    }

    // Initialize Dashboard
    function init() {
      setupEventListeners();

      // Check for saved Google Sheet URL or default
      const savedGoogleUrl = localStorage.getItem('customer_oem_google_sheet_url') || DEFAULT_GOOGLE_SHEET_URL;
      if (savedGoogleUrl) {
        document.getElementById('googleSheetInput').value = savedGoogleUrl;
        connectGoogleSheet(true);
      } else {
        populateFilterOptions();
        applyFilters();
      }
    }

    function setupEventListeners() {
      // Local file upload
      const fileInput = document.getElementById('excelFileInput');
      const dropzone = document.getElementById('dropzoneContainer');

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) processExcelFile(e.target.files[0]);
      });

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('border-sky-500', 'bg-sky-50/40');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('border-sky-500', 'bg-sky-50/40');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-sky-500', 'bg-sky-50/40');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          processExcelFile(e.dataTransfer.files[0]);
        }
      });

      // Search & Filters
      const searchInput = document.getElementById('searchInput');
      const clearSearchBtn = document.getElementById('clearSearchBtn');

      searchInput.addEventListener('input', () => {
        if (searchInput.value.trim().length > 0) clearSearchBtn.classList.remove('hidden');
        else clearSearchBtn.classList.add('hidden');
        applyFilters();
      });

      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.classList.add('hidden');
        applyFilters();
      });

      document.getElementById('filterOem').addEventListener('change', applyFilters);
      document.getElementById('filterStatus').addEventListener('change', applyFilters);
      document.getElementById('filterIndustry').addEventListener('change', applyFilters);

      // Sorting
      document.getElementById('thCustomer').addEventListener('click', () => toggleSort('customerName'));
      document.getElementById('thIndustry').addEventListener('click', () => toggleSort('industry'));
      document.getElementById('thOem').addEventListener('click', () => toggleSort('oemBrand'));
      document.getElementById('thModel').addEventListener('click', () => toggleSort('deviceModel'));
      document.getElementById('thStatus').addEventListener('click', () => toggleSort('status'));
      document.getElementById('thStartDate').addEventListener('click', () => toggleSort('startDate'));
      document.getElementById('thEndDate').addEventListener('click', () => toggleSort('endDate'));

      // Pagination
      document.getElementById('pageSizeSelect').addEventListener('change', (e) => {
        pageSize = parseInt(e.target.value, 10);
        currentPage = 1;
        renderTable();
      });

      document.getElementById('btnPrevPage').addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          renderTable();
        }
      });

      document.getElementById('btnNextPage').addEventListener('click', () => {
        const totalPages = Math.ceil(filteredRecords.length / pageSize);
        if (currentPage < totalPages) {
          currentPage++;
          renderTable();
        }
      });

      // Template & Export
      document.getElementById('btnDownloadTemplate').addEventListener('click', downloadTemplateFile);
      document.getElementById('btnExportData').addEventListener('click', exportCurrentData);
      document.getElementById('btnResetData').addEventListener('click', () => {
        allRecords = JSON.parse(JSON.stringify(DEFAULT_RECORDS));
        document.getElementById('activeSourceLabel').textContent = 'Sample Dataset';
        document.getElementById('lastSyncedTime').textContent = '';
        populateFilterOptions();
        applyFilters();
      });
    }

    function processExcelFile(file) {
      const reader = new FileReader();
      const statusEl = document.getElementById('excelUploadStatus');

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '', raw: false });

          if (!rows || rows.length === 0) {
            alert('No records found in spreadsheet.');
            return;
          }

          const parsed = parseSheetRows(rows);
          if (parsed.length > 0) {
            allRecords = parsed;
            currentPage = 1;
            populateFilterOptions();
            applyFilters();

            document.getElementById('activeSourceLabel').textContent = file.name;
            document.getElementById('lastSyncedTime').textContent = '(' + parsed.length + ' items)';

            statusEl.textContent = 'Successfully loaded ' + parsed.length + ' records from "' + file.name + '"';
            statusEl.classList.remove('hidden');
          } else {
            alert('Could not match expected columns in the spreadsheet.');
          }
        } catch (err) {
          alert('Error parsing Excel: ' + err.message);
        }
      };

      reader.readAsArrayBuffer(file);
    }

    function populateFilterOptions() {
      const oemSelect = document.getElementById('filterOem');
      const indSelect = document.getElementById('filterIndustry');

      const oems = Array.from(new Set(allRecords.map(r => r.oemBrand).filter(Boolean))).sort();
      const industries = Array.from(new Set(allRecords.map(r => r.industry).filter(Boolean))).sort();

      oemSelect.innerHTML = '<option value="">All OEMs</option>' + oems.map(o => '<option value="' + o + '">' + o + '</option>').join('');
      indSelect.innerHTML = '<option value="">All Industries</option>' + industries.map(i => '<option value="' + i + '">' + i + '</option>').join('');
    }

    function applyFilters() {
      const q = document.getElementById('searchInput').value.toLowerCase().trim();
      const oemVal = document.getElementById('filterOem').value;
      const statusVal = document.getElementById('filterStatus').value;
      const indVal = document.getElementById('filterIndustry').value;

      filteredRecords = allRecords.filter(r => {
        if (oemVal && r.oemBrand !== oemVal) return false;
        if (statusVal && r.status !== statusVal) return false;
        if (indVal && r.industry !== indVal) return false;
        if (q) {
          const match = (r.customerName || '').toLowerCase().includes(q) ||
                        (r.oemBrand || '').toLowerCase().includes(q) ||
                        (r.deviceModel || '').toLowerCase().includes(q) ||
                        (r.serialNumber || '').toLowerCase().includes(q) ||
                        (r.startDate || '').toLowerCase().includes(q) ||
                        (r.endDate || '').toLowerCase().includes(q) ||
                        (r.industry || '').toLowerCase().includes(q) ||
                        (r.location || '').toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      });

      sortRecords();
      currentPage = 1;
      updateMetrics();
      updateCharts();
      renderTable();
    }

    function toggleSort(field) {
      if (sortField === field) sortAsc = !sortAsc;
      else {
        sortField = field;
        sortAsc = true;
      }
      sortRecords();
      renderTable();
    }

    function sortRecords() {
      filteredRecords.sort((a, b) => {
        const valA = (a[sortField] || '').toLowerCase();
        const valB = (b[sortField] || '').toLowerCase();
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
    }

    function updateMetrics() {
      const uniqueCustomers = new Set(filteredRecords.map(r => r.customerName)).size;
      const totalDevices = filteredRecords.length;
      const activeDevices = filteredRecords.filter(r => r.status === 'Active').length;

      const oemCounts = {};
      filteredRecords.forEach(r => {
        oemCounts[r.oemBrand] = (oemCounts[r.oemBrand] || 0) + 1;
      });

      let topOem = '-';
      let topOemCount = 0;
      for (const [oem, count] of Object.entries(oemCounts)) {
        if (count > topOemCount) {
          topOem = oem;
          topOemCount = count;
        }
      }

      const topOemPct = totalDevices > 0 ? Math.round((topOemCount / totalDevices) * 100) : 0;
      const activePct = totalDevices > 0 ? Math.round((activeDevices / totalDevices) * 100) : 0;

      document.getElementById('metricTotalCustomers').textContent = uniqueCustomers;
      document.getElementById('metricTotalDevices').textContent = totalDevices;
      document.getElementById('metricTopOem').textContent = topOem;
      document.getElementById('metricTopOemSub').textContent = topOemPct + '% of fleet';
      document.getElementById('metricActiveDeployments').textContent = activeDevices;
      document.getElementById('metricActiveRate').textContent = activePct + '% operational';

      document.getElementById('filteredCountText').textContent = filteredRecords.length + ' of ' + allRecords.length + ' items';
      document.getElementById('chartTotalBadge').textContent = totalDevices + ' assets';
    }

    // Chart.js rendering with fixed vibrant brand colors
    function updateCharts() {
      const oemCounts = {};
      const customerByOem = {};

      filteredRecords.forEach(r => {
        const oem = r.oemBrand || 'Unknown';
        oemCounts[oem] = (oemCounts[oem] || 0) + 1;
        if (!customerByOem[oem]) customerByOem[oem] = new Set();
        customerByOem[oem].add(r.customerName);
      });

      const oemLabels = Object.keys(oemCounts).sort((a, b) => oemCounts[b] - oemCounts[a]);
      const oemDeviceData = oemLabels.map(l => oemCounts[l]);
      const customerCountsData = oemLabels.map(l => customerByOem[l] ? customerByOem[l].size : 0);

      // Apply distinct brand color to each OEM label
      const backgroundColors = oemLabels.map(l => getOemColor(l));

      if (chartOemInstance) chartOemInstance.destroy();
      if (chartCustomerInstance) chartCustomerInstance.destroy();

      // Donut Chart
      const ctxOem = document.getElementById('chartOemBreakdown').getContext('2d');
      chartOemInstance = new Chart(ctxOem, {
        type: 'doughnut',
        data: {
          labels: oemLabels,
          datasets: [{
            data: oemDeviceData,
            backgroundColor: backgroundColors,
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { boxWidth: 12, font: { size: 11 } }
            }
          },
          cutout: '65%'
        }
      });

      // Bar Chart: Each bar has its OEM brand color
      const ctxCustomer = document.getElementById('chartCustomerOem').getContext('2d');
      chartCustomerInstance = new Chart(ctxCustomer, {
        type: 'bar',
        data: {
          labels: oemLabels,
          datasets: [{
            label: 'Unique Client Accounts',
            data: customerCountsData,
            backgroundColor: backgroundColors,
            borderRadius: 4,
            barPercentage: 0.6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, font: { size: 11 } },
              grid: { color: '#f1f5f9' }
            },
            x: {
              ticks: { font: { size: 11, weight: 'bold' } },
              grid: { display: false }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => ' ' + context.raw + ' client accounts deploy this OEM'
              }
            }
          }
        }
      });
    }

    function renderTable() {
      const tbody = document.getElementById('tableBody');
      const emptyState = document.getElementById('emptyState');

      if (filteredRecords.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        document.getElementById('paginationInfo').textContent = 'Showing 0 of 0';
        document.getElementById('btnPrevPage').disabled = true;
        document.getElementById('btnNextPage').disabled = true;
        return;
      }

      emptyState.classList.add('hidden');

      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, filteredRecords.length);
      const pageData = filteredRecords.slice(startIndex, endIndex);

      let html = '';
      pageData.forEach(r => {
        const oemColor = getOemColor(r.oemBrand);
        let statusBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>';
        if (r.status === 'Maintenance') {
          statusBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">Maintenance</span>';
        } else if (r.status === 'Retired') {
          statusBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">Retired</span>';
        }

        html += '<tr class="hover:bg-slate-50 transition-colors">' +
          '<td class="py-3 px-4 font-semibold text-slate-900">' + (r.customerName || '—') + '</td>' +
          '<td class="py-3 px-4 text-slate-600">' + (r.industry || 'Enterprise') + '</td>' +
          '<td class="py-3 px-4">' +
            '<span class="inline-flex items-center gap-1.5 font-semibold" style="color:' + oemColor + '">' +
              '<span class="w-2 h-2 rounded-full shrink-0" style="background-color:' + oemColor + '"></span>' +
              (r.oemBrand || 'Generic') +
            '</span>' +
          '</td>' +
          '<td class="py-3 px-4 text-slate-800">' + (r.deviceModel || 'Appliance') + '</td>' +
          '<td class="py-3 px-4 font-mono text-slate-500 text-[11px]">' + (r.serialNumber || '—') + '</td>' +
          '<td class="py-3 px-4">' + statusBadge + '</td>' +
          '<td class="py-3 px-4 font-mono text-slate-600 text-[11px] whitespace-nowrap">' + (r.startDate || '—') + '</td>' +
          '<td class="py-3 px-4 font-mono text-slate-600 text-[11px] whitespace-nowrap">' + (r.endDate || '—') + '</td>' +
          '<td class="py-3 px-4 text-right text-slate-500 text-[11px]">' + (r.location || '—') + '</td>' +
        '</tr>';
      });

      tbody.innerHTML = html;

      document.getElementById('paginationInfo').textContent = 'Showing ' + (startIndex + 1) + ' to ' + endIndex + ' of ' + filteredRecords.length;
      document.getElementById('btnPrevPage').disabled = currentPage <= 1;
      document.getElementById('btnNextPage').disabled = endIndex >= filteredRecords.length;
    }

    function downloadTemplateFile() {
      const ws = XLSX.utils.json_to_sheet([
        { 'Customer Name': 'Apex Capital Partners', 'Industry / Sector': 'Financial Services', 'OEM Brand': 'Cisco', 'Device Type / Model': 'Catalyst 9300 48P', 'Device Serial Number / Hostname': 'CSCO-9300-8812A', 'Status': 'Active', 'Start Date': '2023-08-15', 'End Date': '2027-08-15', 'Location': 'NY-Equinix NY4' },
        { 'Customer Name': 'Apex Capital Partners', 'Industry / Sector': 'Financial Services', 'OEM Brand': 'F5', 'Device Type / Model': 'BIG-IP i5800 ADC', 'Device Serial Number / Hostname': 'F5-BIGIP-9901X', 'Status': 'Active', 'Start Date': '2023-01-20', 'End Date': '2026-01-20', 'Location': 'NY-Equinix NY4' },
        { 'Customer Name': 'AcroPoint Logistics', 'Industry / Sector': 'Supply Chain', 'OEM Brand': 'Palo Alto', 'Device Type / Model': 'PA-3260 NGFW', 'Device Serial Number / Hostname': 'PANW-3260-X0921', 'Status': 'Active', 'Start Date': '2022-11-30', 'End Date': '2026-11-30', 'Location': 'Chicago Hub' },
        { 'Customer Name': 'Zenith Health Systems', 'Industry / Sector': 'Healthcare', 'OEM Brand': 'FortiNet', 'Device Type / Model': 'FortiGate 200F', 'Device Serial Number / Hostname': 'FG-200F-H8821', 'Status': 'Active', 'Start Date': '2021-09-14', 'End Date': '2025-09-14', 'Location': 'Boston Clinical HQ' },
        { 'Customer Name': 'Zenith Health Systems', 'Industry / Sector': 'Healthcare', 'OEM Brand': 'Algosec', 'Device Type / Model': 'AlgoSec Firewall Analyzer', 'Device Serial Number / Hostname': 'ALGO-SMS-V332', 'Status': 'Active', 'Start Date': '2023-05-18', 'End Date': '2026-05-18', 'Location': 'Boston Clinical HQ' }
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Customer_OEM_Assets');
      XLSX.writeFile(wb, 'customer_oem_template.xlsx');
    }

    function exportCurrentData() {
      const ws = XLSX.utils.json_to_sheet(filteredRecords.map(r => ({
        'Customer Name': r.customerName,
        'Industry / Sector': r.industry,
        'OEM Brand': r.oemBrand,
        'Device Type / Model': r.deviceModel,
        'Device Serial Number / Hostname': r.serialNumber,
        'Status': r.status,
        'Start Date': r.startDate || '',
        'End Date': r.endDate || '',
        'Location': r.location || ''
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
      XLSX.writeFile(wb, 'customer_oem_inventory.xlsx');
    }

    window.addEventListener('DOMContentLoaded', init);
  </script>
</body>
</html>
`;
}
