import React, { useState } from 'react';
import { CustomerDeviceRecord } from '../types';
import { Building2, ChevronDown, ChevronRight, Server, ShieldCheck, Tag } from 'lucide-react';

interface CustomerGroupedViewProps {
  records: CustomerDeviceRecord[];
  onEditDevice: (record: CustomerDeviceRecord) => void;
  onDeleteDevice: (id: string) => void;
}

interface CustomerGroup {
  customerName: string;
  industry: string;
  devices: CustomerDeviceRecord[];
  oemCounts: Record<string, number>;
  activeCount: number;
}

export const CustomerGroupedView: React.FC<CustomerGroupedViewProps> = ({
  records,
  onEditDevice,
  onDeleteDevice,
}) => {
  const [expandedCustomers, setExpandedCustomers] = useState<Record<string, boolean>>({});
  const [customerSearch, setCustomerSearch] = useState('');

  // Group records by customerName
  const grouped: CustomerGroup[] = React.useMemo(() => {
    const map = new Map<string, CustomerGroup>();

    records.forEach((r) => {
      const name = r.customerName.trim();
      if (!map.has(name)) {
        map.set(name, {
          customerName: name,
          industry: r.industry || 'General Enterprise',
          devices: [],
          oemCounts: {},
          activeCount: 0,
        });
      }
      const group = map.get(name)!;
      group.devices.push(r);
      group.oemCounts[r.oemBrand] = (group.oemCounts[r.oemBrand] || 0) + 1;
      if (r.status === 'Active') group.activeCount++;
    });

    return Array.from(map.values()).sort((a, b) => b.devices.length - a.devices.length);
  }, [records]);

  const toggleExpand = (name: string) => {
    setExpandedCustomers((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const filteredGroups = grouped.filter((g) => {
    if (!customerSearch) return true;
    const q = customerSearch.toLowerCase();
    const matchesName = g.customerName.toLowerCase().includes(q);
    const matchesIndustry = g.industry.toLowerCase().includes(q);
    const matchesOem = Object.keys(g.oemCounts).some((oem) => oem.toLowerCase().includes(q));
    return matchesName || matchesIndustry || matchesOem;
  });

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Customer Portfolio &amp; OEM Breakdown</h3>
          <p className="text-xs text-slate-500">
            {grouped.length} corporate accounts &bull; Grouped hardware footprints
          </p>
        </div>

        <input
          type="text"
          value={customerSearch}
          onChange={(e) => setCustomerSearch(e.target.value)}
          placeholder="Filter customers or OEM brands..."
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 w-full sm:w-64"
        />
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 gap-3">
        {filteredGroups.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
            <p className="text-sm font-medium">No customers found</p>
            <p className="text-xs text-slate-400 mt-1">Adjust search query.</p>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const isExpanded = !!expandedCustomers[group.customerName];
            const oemList = Object.entries(group.oemCounts);

            return (
              <div
                key={group.customerName}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(group.customerName)}
                  className="p-4 cursor-pointer hover:bg-slate-50/70 transition-colors flex flex-wrap items-center justify-between gap-3 select-none"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                      <Building2 className="w-4 h-4 text-slate-500" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-900">{group.customerName}</h4>
                        <span className="text-xs text-slate-500">&bull; {group.industry}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>{group.devices.length} hardware assets</span>
                        <span>&bull;</span>
                        <span className="text-emerald-600 font-medium">{group.activeCount} active</span>
                      </div>
                    </div>
                  </div>

                  {/* OEM Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {oemList.map(([oem, count]) => (
                      <span
                        key={oem}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-md border border-slate-200"
                      >
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span className="font-semibold text-slate-900">{oem}</span>
                        <span className="text-slate-400">({count})</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Expanded Device List */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/40 p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-medium">
                            <th className="pb-2">OEM Brand</th>
                            <th className="pb-2">Device Model</th>
                            <th className="pb-2">Serial Number / Hostname</th>
                            <th className="pb-2">Status</th>
                            <th className="pb-2">Deployment Location</th>
                            <th className="pb-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {group.devices.map((device) => (
                            <tr key={device.id} className="hover:bg-white/80">
                              <td className="py-2.5 font-semibold text-slate-900">{device.oemBrand}</td>
                              <td className="py-2.5 text-slate-800 font-medium">{device.deviceModel}</td>
                              <td className="py-2.5 font-mono text-slate-500 text-[11px]">{device.serialNumber}</td>
                              <td className="py-2.5">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                                    device.status === 'Active'
                                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                      : device.status === 'Maintenance'
                                      ? 'text-amber-700 bg-amber-50 border-amber-200'
                                      : 'text-slate-600 bg-slate-100 border-slate-200'
                                  }`}
                                >
                                  {device.status}
                                </span>
                              </td>
                              <td className="py-2.5 text-slate-500 text-[11px]">{device.location || '—'}</td>
                              <td className="py-2.5 text-right">
                                <button
                                  onClick={() => onEditDevice(device)}
                                  className="text-xs text-sky-600 hover:text-sky-800 mr-2"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => onDeleteDevice(device.id)}
                                  className="text-xs text-rose-500 hover:text-rose-700"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
