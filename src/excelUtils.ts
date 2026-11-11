import * as XLSX from 'xlsx';
import { CustomerDeviceRecord, DeviceStatus } from './types';
import { SAMPLE_RECORDS } from './sampleData';

/**
 * Returns distinct, official brand colors for networking and security OEM vendors
 */
export function getOemBrandColor(oem: string): string {
  if (!oem) return '#64748b';
  const clean = oem.toLowerCase().replace(/[^a-z0-9]/g, '');

  // User's specific OEMs
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

  const palette = ['#0284c7', '#e11d48', '#d946ef', '#f97316', '#b91c1c', '#059669', '#7c3aed', '#4f46e5', '#0d9488'];
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
        'Account Name',
        'Organization',
      ]);

      const oemBrand = getField(row, [
        'OEM Brand',
        'OEM',
        'Vendor',
        'Manufacturer',
        'Brand',
        'Hardware Vendor',
      ]);

      const deviceModel = getField(row, [
        'Device Type / Model',
        'Device Model',
        'Model',
        'Device Type',
        'Hardware Model',
        'Product',
        'Equipment',
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
      ]);

      const rawStatus = getField(row, ['Status', 'State', 'Lifecycle Status', 'Condition']);
      const industry = getField(row, ['Industry / Sector', 'Industry', 'Sector', 'Vertical', 'Category']) || 'General Enterprise';
      const location = getField(row, ['Location', 'Site', 'Data Center', 'Facility', 'Region']);
      const startDate = getField(row, ['Start Date', 'Deployment Start', 'Contract Start', 'Install Date', 'Start Date / Deployment', 'Start']);
      const endDate = getField(row, ['End Date', 'Contract End', 'Warranty Expiration', 'Warranty', 'Expiry Date', 'Warranty End', 'End Date / Expiry', 'End']);

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
        oemBrand: oemBrand || 'Generic / Other',
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
      'OEM Brand': 'Palo Alto',
      'Device Type / Model': 'PA-3260 Next-Gen Firewall',
      'Device Serial Number / Hostname': 'PANW-3260-X0921',
      'Status': 'Active',
      'Start Date': '2022-11-30',
      'End Date': '2026-11-30',
      'Location': 'NY-Primary DC (Equinix NY4)',
    },
    {
      'Customer Name': 'AcroPoint Global Logistics',
      'Industry / Sector': 'Supply Chain & Freight',
      'OEM Brand': 'Dell',
      'Device Type / Model': 'PowerEdge R750 2U Server',
      'Device Serial Number / Hostname': 'DELL-R750-NV914',
      'Status': 'Active',
      'Start Date': '2023-02-10',
      'End Date': '2028-02-10',
      'Location': 'Chicago Hub (ORD-01)',
    },
    {
      'Customer Name': 'AcroPoint Global Logistics',
      'Industry / Sector': 'Supply Chain & Freight',
      'OEM Brand': 'Lenovo',
      'Device Type / Model': 'ThinkSystem SR650 V2',
      'Device Serial Number / Hostname': 'LNV-SR650-M1044',
      'Status': 'Maintenance',
      'Start Date': '2021-12-18',
      'End Date': '2025-12-18',
      'Location': 'Dallas Distribution (DFW-04)',
    },
    {
      'Customer Name': 'Zenith Health Systems',
      'Industry / Sector': 'Healthcare',
      'OEM Brand': 'HP',
      'Device Type / Model': 'ProLiant DL380 Gen10 Server',
      'Device Serial Number / Hostname': 'HPE-DL380-K7712',
      'Status': 'Retired',
      'Start Date': '2019-05-10',
      'End Date': '2024-05-10',
      'Location': 'Boston Clinical HQ',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateRows);

  // Set nice column widths
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
  worksheet['!cols'] = [
    { wch: 28 },
    { wch: 24 },
    { wch: 16 },
    { wch: 32 },
    { wch: 30 },
    { wch: 14 },
    { wch: 30 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Assets');
  XLSX.writeFile(workbook, filename);
}

/**
 * Returns the standalone single-file index.html string ready for GitHub Pages.
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
  <meta name="description" content="Client-side enterprise dashboard tracking customer hardware inventory and OEM vendor deployments.">

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
      header, footer, #dropzoneContainer, .no-print, input, select {
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
  <header class="bg-white border-b border-slate-200 sticky top-0 z-30">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-sm">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
        <div>
          <h1 class="text-lg font-bold text-slate-900 tracking-tight">Customer OEM Asset Tracker</h1>
          <p class="text-xs text-slate-500">Enterprise Hardware Deployment & Multi-Vendor Analytics</p>
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

    <!-- Upload Hero Dropzone -->
    <section class="bg-white rounded-xl border border-dashed border-slate-300 p-6 transition-all hover:border-sky-500" id="dropzoneContainer">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-start gap-4">
          <div class="p-3 bg-sky-50 text-sky-600 rounded-lg shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <h2 class="text-sm font-semibold text-slate-900">Upload Customer OEM Spreadsheet</h2>
            <p class="text-xs text-slate-500 mt-0.5">Drag and drop an Excel (.xlsx, .xls) or CSV file here. 100% client-side parsing via SheetJS — no data leaves your browser.</p>
            <div id="fileUploadStatus" class="mt-2 text-xs text-emerald-600 font-medium hidden"></div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <label for="excelFileInput" class="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Choose Excel File
          </label>
          <input type="file" id="excelFileInput" accept=".xlsx, .xls, .csv" class="hidden" />
        </div>
      </div>
    </section>

    <!-- Executive Metric Cards -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <p class="text-xs font-medium text-slate-500">Total Customers</p>
        <div class="mt-2 flex items-baseline justify-between">
          <span id="metricTotalCustomers" class="text-2xl font-bold text-slate-900">0</span>
          <span id="metricCustomerSub" class="text-xs text-slate-500">Enterprise accounts</span>
        </div>
      </div>

      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <p class="text-xs font-medium text-slate-500">Total Tracked Devices</p>
        <div class="mt-2 flex items-baseline justify-between">
          <span id="metricTotalDevices" class="text-2xl font-bold text-slate-900">0</span>
          <span id="metricDevicesSub" class="text-xs text-slate-500">Hardware assets</span>
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

    <!-- Charts Section -->
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- OEM Breakdown Chart -->
      <div class="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-sm font-semibold text-slate-900">OEM Fleet Share</h3>
            <p class="text-xs text-slate-500">Device volume grouped by manufacturer</p>
          </div>
        </div>
        <div class="relative h-64 mt-4 flex items-center justify-center">
          <canvas id="chartOemBreakdown"></canvas>
        </div>
      </div>

      <!-- Customer Distribution by OEM Chart -->
      <div class="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-sm font-semibold text-slate-900">Customer Count by OEM</h3>
            <p class="text-xs text-slate-500">Number of distinct client accounts utilizing each OEM</p>
          </div>
        </div>
        <div class="relative h-64 mt-4">
          <canvas id="chartCustomerOem"></canvas>
        </div>
      </div>
    </section>

    <!-- Filter & Management Controls -->
    <section class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
        <!-- Search -->
        <div class="relative flex-1 min-w-[260px] max-w-md">
          <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            id="searchInput"
            placeholder="Search by customer, OEM, model, serial..."
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

      <!-- Data Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-100/75 text-slate-600 font-medium select-none">
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

  <!-- Footer -->
  <footer class="bg-white border-t border-slate-200 py-4 mt-8">
    <div class="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
      <p>Customer OEM Tracker &bull; Standalone Single-Page Application for GitHub Pages</p>
      <p>Powered by SheetJS, Tailwind CSS &amp; Chart.js</p>
    </div>
  </footer>

  <!-- Application Logic -->
  <script>
    // Embedded sample records (fallback dataset)
    const DEFAULT_RECORDS = ${jsonPayload};

    let allRecords = JSON.parse(JSON.stringify(DEFAULT_RECORDS));
    let filteredRecords = [...allRecords];
    let sortField = 'customerName';
    let sortAsc = true;
    let currentPage = 1;
    let pageSize = 25;

    let chartOemInstance = null;
    let chartCustomerInstance = null;

    function getOemColor(oem) {
      if (!oem) return '#64748b';
      const clean = oem.toLowerCase().replace(/[^a-z0-9]/g, '');

      // User's specific OEMs with distinct brand identities
      if (clean.includes('cisco')) return '#0284c7'; // Cisco Blue
      if (clean === 'f5' || clean.includes('f5')) return '#e11d48'; // F5 Ruby Red
      if (clean.includes('checkpoint') || clean.includes('chkp')) return '#d946ef'; // Check Point Magenta
      if (clean.includes('paloalto') || clean.includes('palo') || clean.includes('panw')) return '#f97316'; // Palo Alto Orange
      if (clean.includes('fortinet') || clean.includes('forti')) return '#b91c1c'; // Fortinet Crimson Red
      if (clean.includes('algosec') || clean.includes('algo')) return '#059669'; // AlgoSec Emerald Green

      // Additional enterprise brands
      if (clean.includes('dell')) return '#2563eb';
      if (clean.includes('hp') || clean.includes('hpe')) return '#0d9488';
      if (clean.includes('lenovo')) return '#dc2626';
      if (clean.includes('juniper')) return '#4f46e5';
      if (clean.includes('arista')) return '#7c3aed';
      if (clean.includes('vmware')) return '#16a34a';

      // Curated dynamic palette so no OEM ever defaults to dull gray
      const palette = ['#0284c7', '#e11d48', '#d946ef', '#f97316', '#b91c1c', '#059669', '#7c3aed', '#4f46e5', '#0d9488'];
      let hash = 0;
      for (let i = 0; i < clean.length; i++) hash = clean.charCodeAt(i) + ((hash << 5) - hash);
      return palette[Math.abs(hash) % palette.length];
    }

    // Initialize Dashboard
    function init() {
      setupEventListeners();
      populateFilterOptions();
      applyFilters();
    }

    function setupEventListeners() {
      // File upload dropzone
      const fileInput = document.getElementById('excelFileInput');
      const dropzone = document.getElementById('dropzoneContainer');

      fileInput.addEventListener('change', handleFileSelect);

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('border-sky-500', 'bg-sky-50/30');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('border-sky-500', 'bg-sky-50/30');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-sky-500', 'bg-sky-50/30');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          processExcelFile(e.dataTransfer.files[0]);
        }
      });

      // Search & Filters
      const searchInput = document.getElementById('searchInput');
      const clearSearchBtn = document.getElementById('clearSearchBtn');
      searchInput.addEventListener('input', () => {
        if (searchInput.value.trim().length > 0) {
          clearSearchBtn.classList.remove('hidden');
        } else {
          clearSearchBtn.classList.add('hidden');
        }
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

      // Actions
      document.getElementById('btnDownloadTemplate').addEventListener('click', downloadTemplateFile);
      document.getElementById('btnExportData').addEventListener('click', exportCurrentData);
      document.getElementById('btnResetData').addEventListener('click', () => {
        allRecords = JSON.parse(JSON.stringify(DEFAULT_RECORDS));
        populateFilterOptions();
        applyFilters();
        const statusEl = document.getElementById('fileUploadStatus');
        statusEl.textContent = 'Reset to sample enterprise dataset (' + allRecords.length + ' devices).';
        statusEl.classList.remove('hidden');
      });
    }

    function handleFileSelect(e) {
      if (e.target.files && e.target.files.length > 0) {
        processExcelFile(e.target.files[0]);
      }
    }

    function processExcelFile(file) {
      const reader = new FileReader();
      const statusEl = document.getElementById('fileUploadStatus');

      reader.onload = function(e) {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '', raw: false });

          if (!rows || rows.length === 0) {
            alert('No records found in uploaded file.');
            return;
          }

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

            const customer = getVal(['Customer Name', 'Customer', 'Company Name', 'Company', 'Client']);
            const oem = getVal(['OEM Brand', 'OEM', 'Vendor', 'Manufacturer']);
            const model = getVal(['Device Type / Model', 'Device Model', 'Model', 'Device Type']);
            const serial = getVal(['Device Serial Number / Hostname', 'Serial Number', 'Serial', 'Hostname']);
            const rawStatus = getVal(['Status', 'State']);
            const industry = getVal(['Industry / Sector', 'Industry', 'Sector']) || 'Enterprise';
            const location = getVal(['Location', 'Site', 'Data Center']);

            if (!customer && !oem && !serial) return;

            let status = 'Active';
            if (rawStatus.toLowerCase().includes('maint')) status = 'Maintenance';
            if (rawStatus.toLowerCase().includes('retir') || rawStatus.toLowerCase().includes('decom')) status = 'Retired';

            parsed.push({
              id: 'file-' + i + '-' + Math.random().toString(36).substr(2, 4),
              customerName: customer || 'Unknown Client',
              industry: industry,
              oemBrand: oem || 'Other OEM',
              deviceModel: model || 'Standard Appliance',
              serialNumber: serial || 'SN-' + (100000 + i),
              status: status,
              location: location || ''
            });
          });

          if (parsed.length > 0) {
            allRecords = parsed;
            currentPage = 1;
            populateFilterOptions();
            applyFilters();
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

      const oems = Array.from(new Set(allRecords.map(r => r.oemBrand))).sort();
      const industries = Array.from(new Set(allRecords.map(r => r.industry))).sort();

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
          const match = r.customerName.toLowerCase().includes(q) ||
                        r.oemBrand.toLowerCase().includes(q) ||
                        r.deviceModel.toLowerCase().includes(q) ||
                        r.serialNumber.toLowerCase().includes(q) ||
                        r.industry.toLowerCase().includes(q);
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
      if (sortField === field) {
        sortAsc = !sortAsc;
      } else {
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

      // OEM Counts
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
      document.getElementById('metricTopOemSub').textContent = topOemPct + '% of current fleet (' + topOemCount + ')';
      document.getElementById('metricActiveDeployments').textContent = activeDevices;
      document.getElementById('metricActiveRate').textContent = activePct + '% operational rate';

      document.getElementById('filteredCountText').textContent = filteredRecords.length + ' of ' + allRecords.length + ' items';
    }

    function updateCharts() {
      const oemCounts = {};
      const customerByOem = {};

      filteredRecords.forEach(r => {
        oemCounts[r.oemBrand] = (oemCounts[r.oemBrand] || 0) + 1;
        if (!customerByOem[r.oemBrand]) {
          customerByOem[r.oemBrand] = new Set();
        }
        customerByOem[r.oemBrand].add(r.customerName);
      });

      const oemLabels = Object.keys(oemCounts).sort((a, b) => oemCounts[b] - oemCounts[a]);
      const oemDeviceData = oemLabels.map(l => oemCounts[l]);
      const customerCountsData = oemLabels.map(l => customerByOem[l] ? customerByOem[l].size : 0);
      const backgroundColors = oemLabels.map(l => getOemColor(l));

      // Destroy previous instances if any
      if (chartOemInstance) chartOemInstance.destroy();
      if (chartCustomerInstance) chartCustomerInstance.destroy();

      // OEM Doughnut Chart
      const ctxOem = document.getElementById('chartOemBreakdown').getContext('2d');
      chartOemInstance = new Chart(ctxOem, {
        type: 'doughnut',
        data: {
          labels: oemLabels,
          datasets: [{
            data: oemDeviceData,
            backgroundColor: backgroundColors,
            borderWidth: 2,
            borderColor: '#ffffff'
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

      // Customer Distribution Bar Chart
      const ctxCustomer = document.getElementById('chartCustomerOem').getContext('2d');
      chartCustomerInstance = new Chart(ctxCustomer, {
        type: 'bar',
        data: {
          labels: oemLabels,
          datasets: [{
            label: 'Unique Customers Using OEM',
            data: customerCountsData,
            backgroundColor: backgroundColors,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, font: { size: 10 } }
            },
            x: {
              ticks: { font: { size: 11 } }
            }
          },
          plugins: {
            legend: { display: false }
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
        let statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
        if (r.status === 'Maintenance') statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
        if (r.status === 'Retired') statusColor = 'text-slate-600 bg-slate-100 border-slate-200';

        html += '<tr class="hover:bg-slate-50/80 transition-colors">' +
          '<td class="py-3 px-4 font-semibold text-slate-900">' + escapeHtml(r.customerName) + '</td>' +
          '<td class="py-3 px-4 text-slate-600">' + escapeHtml(r.industry) + '</td>' +
          '<td class="py-3 px-4 font-medium" style="color: ' + getOemColor(r.oemBrand) + '">' + escapeHtml(r.oemBrand) + '</td>' +
          '<td class="py-3 px-4 text-slate-800">' + escapeHtml(r.deviceModel) + '</td>' +
          '<td class="py-3 px-4 font-mono text-slate-500 text-[11px]">' + escapeHtml(r.serialNumber) + '</td>' +
          '<td class="py-3 px-4">' +
            '<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ' + statusColor + '">' +
              r.status +
            '</span>' +
          '</td>' +
          '<td class="py-3 px-4 font-mono text-slate-600 text-[11px] whitespace-nowrap">' + escapeHtml(r.startDate || '—') + '</td>' +
          '<td class="py-3 px-4 font-mono text-slate-600 text-[11px] whitespace-nowrap">' + escapeHtml(r.endDate || '—') + '</td>' +
          '<td class="py-3 px-4 text-right text-slate-500 text-[11px]">' + escapeHtml(r.location || '—') + '</td>' +
        '</tr>';
      });

      tbody.innerHTML = html;

      // Update Pagination state
      document.getElementById('paginationInfo').textContent = 'Showing ' + (startIndex + 1) + ' to ' + endIndex + ' of ' + filteredRecords.length;
      document.getElementById('btnPrevPage').disabled = currentPage <= 1;
      document.getElementById('btnNextPage').disabled = endIndex >= filteredRecords.length;
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function downloadTemplateFile() {
      const template = [
        {
          'Customer Name': 'Apex Capital Partners',
          'Industry / Sector': 'Financial Services',
          'OEM Brand': 'Cisco',
          'Device Type / Model': 'Catalyst 9300 48P Switch',
          'Device Serial Number / Hostname': 'CSCO-9300-8812A',
          'Status': 'Active',
          'Location': 'NY DataCenter 4'
        },
        {
          'Customer Name': 'Apex Capital Partners',
          'Industry / Sector': 'Financial Services',
          'OEM Brand': 'Palo Alto',
          'Device Type / Model': 'PA-3260 Next-Gen Firewall',
          'Device Serial Number / Hostname': 'PANW-3260-X0921',
          'Status': 'Active',
          'Location': 'NY DataCenter 4'
        },
        {
          'Customer Name': 'AcroPoint Logistics',
          'Industry / Sector': 'Supply Chain',
          'OEM Brand': 'Dell',
          'Device Type / Model': 'PowerEdge R750 Server',
          'Device Serial Number / Hostname': 'DELL-R750-NV914',
          'Status': 'Active',
          'Location': 'Chicago Hub'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(template);
      ws['!cols'] = [{ wch: 26 }, { wch: 22 }, { wch: 16 }, { wch: 28 }, { wch: 28 }, { wch: 14 }, { wch: 22 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, 'customer_oem_template.xlsx');
    }

    function exportCurrentData() {
      const exportList = filteredRecords.map(r => ({
        'Customer Name': r.customerName,
        'Industry / Sector': r.industry,
        'OEM Brand': r.oemBrand,
        'Device Type / Model': r.deviceModel,
        'Device Serial Number / Hostname': r.serialNumber,
        'Status': r.status,
        'Location': r.location || ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportList);
      ws['!cols'] = [{ wch: 26 }, { wch: 22 }, { wch: 16 }, { wch: 28 }, { wch: 28 }, { wch: 14 }, { wch: 22 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
      XLSX.writeFile(wb, 'customer_oem_export.xlsx');
    }

    // Launch
    window.addEventListener('DOMContentLoaded', init);
  </script>
</body>
</html>`;
}
