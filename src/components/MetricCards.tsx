import React from 'react';
import { CustomerDeviceRecord } from '../types';
import { Users, Server, Award, Activity } from 'lucide-react';

interface MetricCardsProps {
  records: CustomerDeviceRecord[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({ records }) => {
  const uniqueCustomers = new Set(records.map((r) => r.customerName.trim())).size;
  const totalDevices = records.length;
  const activeDevices = records.filter((r) => r.status === 'Active').length;
  const maintenanceDevices = records.filter((r) => r.status === 'Maintenance').length;
  const retiredDevices = records.filter((r) => r.status === 'Retired').length;

  // OEM distribution
  const oemCounts: Record<string, number> = {};
  records.forEach((r) => {
    oemCounts[r.oemBrand] = (oemCounts[r.oemBrand] || 0) + 1;
  });

  let topOem = 'None';
  let topOemCount = 0;
  Object.entries(oemCounts).forEach(([oem, count]) => {
    if (count > topOemCount) {
      topOem = oem;
      topOemCount = count;
    }
  });

  const topOemPct = totalDevices > 0 ? Math.round((topOemCount / totalDevices) * 100) : 0;
  const activePct = totalDevices > 0 ? Math.round((activeDevices / totalDevices) * 100) : 0;
  const avgDevicesPerCustomer = uniqueCustomers > 0 ? (totalDevices / uniqueCustomers).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Customers */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-shadow hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Customers</span>
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold tracking-tight text-slate-900">{uniqueCustomers}</span>
          <span className="text-xs text-slate-500">{avgDevicesPerCustomer} dev / client</span>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          Distinct corporate accounts tracked
        </div>
      </div>

      {/* Total Devices */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-shadow hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Devices</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Server className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold tracking-tight text-slate-900">{totalDevices}</span>
          <span className="text-xs text-slate-500">
            {maintenanceDevices} in service
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          Across servers, switches & firewalls
        </div>
      </div>

      {/* Top OEM Provider */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-shadow hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Top OEM Provider</span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold tracking-tight text-slate-900 truncate max-w-[170px]" title={topOem}>
            {topOem}
          </span>
          <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
            {topOemPct}% share
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          {topOemCount} active customer units
        </div>
      </div>

      {/* Active Deployments */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-shadow hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Deployments</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold tracking-tight text-slate-900">{activeDevices}</span>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            {activePct}% operational
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          {retiredDevices} retired / decommissioned
        </div>
      </div>
    </div>
  );
};
