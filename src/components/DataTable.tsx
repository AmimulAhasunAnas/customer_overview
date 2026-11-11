import React, { useState, useMemo } from 'react';
import { CustomerDeviceRecord, SortField, SortDirection } from '../types';
import {
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Printer,
} from 'lucide-react';
import { exportRecordsToExcel, getOemBrandColor } from '../excelUtils';

interface DataTableProps {
  records: CustomerDeviceRecord[];
  onAddDevice: () => void;
  onEditDevice: (record: CustomerDeviceRecord) => void;
  onDeleteDevice: (id: string) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  records,
  onAddDevice,
  onEditDevice,
  onDeleteDevice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [oemFilter, setOemFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  const [sortField, setSortField] = useState<SortField>('customerName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Extract unique filter options
  const uniqueOems = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.oemBrand).filter(Boolean))).sort();
  }, [records]);

  const uniqueIndustries = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.industry).filter(Boolean))).sort();
  }, [records]);

  // Handle column sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const filtered = records.filter((r) => {
      if (oemFilter && r.oemBrand !== oemFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (industryFilter && r.industry !== industryFilter) return false;

      if (q) {
        const inCustomer = r.customerName.toLowerCase().includes(q);
        const inOem = r.oemBrand.toLowerCase().includes(q);
        const inSerial = r.serialNumber.toLowerCase().includes(q);
        const inModel = r.deviceModel.toLowerCase().includes(q);
        const inIndustry = r.industry.toLowerCase().includes(q);
        const inLocation = (r.location || '').toLowerCase().includes(q);
        if (!inCustomer && !inOem && !inSerial && !inModel && !inIndustry && !inLocation) {
          return false;
        }
      }
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      const valA = (a[sortField] || '').toLowerCase();
      const valB = (b[sortField] || '').toLowerCase();
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [records, searchQuery, oemFilter, statusFilter, industryFilter, sortField, sortDirection]);

  // Pagination slice
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredRecords.length);
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Active
          </span>
        );
      case 'Maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Maintenance
          </span>
        );
      case 'Retired':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Retired
          </span>
        );
      default:
        return <span className="text-xs text-slate-600">{status}</span>;
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-sky-600" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-sky-600" />
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search customer, OEM, model, serial number..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* OEM Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            <select
              value={oemFilter}
              onChange={(e) => {
                setOemFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">All OEMs ({records.length})</option>
              {uniqueOems.map((oem) => {
                const count = records.filter((r) => r.oemBrand === oem).length;
                return (
                  <option key={oem} value={oem}>
                    {oem} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Retired">Retired</option>
          </select>

          {/* Industry Filter */}
          <select
            value={industryFilter}
            onChange={(e) => {
              setIndustryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">All Industries</option>
            {uniqueIndustries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>

          <div className="h-5 w-px bg-slate-200 mx-1"></div>

          {/* Action buttons */}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-xs"
            title="Print hardware inventory report"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print</span>
          </button>

          <button
            onClick={() => exportRecordsToExcel(filteredRecords)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-xs"
            title="Export filtered table to Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export ({filteredRecords.length})</span>
          </button>

          <button
            onClick={onAddDevice}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Device</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/75 text-slate-700 font-semibold select-none">
              <th
                onClick={() => handleSort('customerName')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/50 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Customer / Company</span>
                  {getSortIcon('customerName')}
                </div>
              </th>

              <th
                onClick={() => handleSort('industry')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/50 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Industry</span>
                  {getSortIcon('industry')}
                </div>
              </th>

              <th
                onClick={() => handleSort('oemBrand')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/50 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>OEM Brand</span>
                  {getSortIcon('oemBrand')}
                </div>
              </th>

              <th
                onClick={() => handleSort('deviceModel')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/50 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Device Model</span>
                  {getSortIcon('deviceModel')}
                </div>
              </th>

              <th
                onClick={() => handleSort('serialNumber')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/50 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Serial Number / Hostname</span>
                  {getSortIcon('serialNumber')}
                </div>
              </th>

              <th
                onClick={() => handleSort('status')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/50 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  {getSortIcon('status')}
                </div>
              </th>

              <th
                onClick={() => handleSort('startDate')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/50 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>Start Date</span>
                  {getSortIcon('startDate')}
                </div>
              </th>

              <th
                onClick={() => handleSort('endDate')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/50 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>End Date</span>
                  {getSortIcon('endDate')}
                </div>
              </th>

              <th className="py-3 px-4 text-right print:hidden">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <p className="text-sm font-medium text-slate-700">No matching assets found</p>
                  <p className="text-xs text-slate-400 mt-1">Try relaxing filters or search terms.</p>
                </td>
              </tr>
            ) : (
              paginatedRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                  {/* Customer */}
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900">{r.customerName}</span>
                  </td>

                  {/* Industry */}
                  <td className="py-3 px-4 text-slate-600">
                    <span>{r.industry}</span>
                  </td>

                  {/* OEM Brand */}
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: getOemBrandColor(r.oemBrand) }}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getOemBrandColor(r.oemBrand) }}></span>
                      {r.oemBrand}
                    </span>
                  </td>

                  {/* Device Model */}
                  <td className="py-3 px-4 text-slate-800">
                    <span className="font-medium">{r.deviceModel}</span>
                  </td>

                  {/* Serial Number */}
                  <td className="py-3 px-4">
                    <code className="text-[11px] font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/70">
                      {r.serialNumber}
                    </code>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">{getStatusBadge(r.status)}</td>

                  {/* Start Date */}
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                    {r.startDate || '—'}
                  </td>

                  {/* End Date */}
                  <td className="py-3 px-4 text-slate-700 font-mono text-[11px] whitespace-nowrap font-medium">
                    {r.endDate || '—'}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right print:hidden">
                    <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={() => onEditDevice(r)}
                        className="p-1 rounded text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                        title="Edit record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove device ${r.serialNumber} (${r.customerName})?`)) {
                            onDeleteDevice(r.id);
                          }
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white border border-slate-300 rounded px-2 py-1 text-xs"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>
            Showing {filteredRecords.length > 0 ? startIndex + 1 : 0} to {endIndex} of{' '}
            {filteredRecords.length} records
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={validCurrentPage <= 1}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>
          <span className="px-2 py-1 font-medium text-slate-700">
            {validCurrentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={validCurrentPage >= totalPages}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
