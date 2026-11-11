import React, { useEffect, useRef, useState } from 'react';
import { CustomerDeviceRecord } from '../types';
import { Chart, registerables } from 'chart.js';
import { PieChart, BarChart3, Layers } from 'lucide-react';

Chart.register(...registerables);

interface ChartsSectionProps {
  records: CustomerDeviceRecord[];
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({ records }) => {
  const oemDonutCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const customerBarCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const oemChartInstance = useRef<Chart | null>(null);
  const customerChartInstance = useRef<Chart | null>(null);

  const [activeSecondaryView, setActiveSecondaryView] = useState<'customerCount' | 'lifecycle'>('customerCount');

  // Defined professional OEM brand color palette specifically matching user OEMs
  const getOemColor = (oem: string): string => {
    if (!oem) return '#64748b';
    const clean = oem.toLowerCase().replace(/[^a-z0-9]/g, '');

    // User's specific OEMs with official brand identities
    if (clean.includes('cisco')) return '#0284c7'; // Cisco Blue
    if (clean === 'f5' || clean.includes('f5networks') || clean.includes('f5')) return '#e11d48'; // F5 Ruby Red
    if (clean.includes('checkpoint') || clean.includes('chkp')) return '#d946ef'; // Check Point Magenta
    if (clean.includes('paloalto') || clean.includes('palo') || clean.includes('panw')) return '#f97316'; // Palo Alto Orange
    if (clean.includes('fortinet') || clean.includes('forti')) return '#b91c1c'; // Fortinet Crimson Red
    if (clean.includes('algosec') || clean.includes('algo')) return '#059669'; // AlgoSec Green / Teal

    // Additional enterprise hardware & security OEMs
    if (clean.includes('dell')) return '#2563eb'; // Dell Blue
    if (clean.includes('hp') || clean.includes('hpe')) return '#0d9488'; // HP Teal
    if (clean.includes('lenovo')) return '#dc2626'; // Lenovo Red
    if (clean.includes('juniper')) return '#4f46e5'; // Juniper Indigo
    if (clean.includes('arista')) return '#7c3aed'; // Arista Violet
    if (clean.includes('vmware')) return '#16a34a'; // VMware Green
    if (clean.includes('sophos')) return '#2563eb'; // Sophos Blue
    if (clean.includes('crowdstrike')) return '#e11d48'; // Crowdstrike Red
    if (clean.includes('zscaler')) return '#0369a1'; // Zscaler Blue

    // Curated dynamic palette fallback so no OEM is ever dull gray
    const curatedPalette = [
      '#0284c7', '#e11d48', '#d946ef', '#f97316', '#b91c1c',
      '#059669', '#7c3aed', '#4f46e5', '#0d9488', '#ea580c'
    ];
    let hash = 0;
    for (let i = 0; i < clean.length; i++) hash = clean.charCodeAt(i) + ((hash << 5) - hash);
    return curatedPalette[Math.abs(hash) % curatedPalette.length];
  };

  useEffect(() => {
    // OEM Breakdown Data
    const oemCounts: Record<string, number> = {};
    const customerByOem: Record<string, Set<string>> = {};

    records.forEach((r) => {
      const oem = r.oemBrand || 'Unknown';
      oemCounts[oem] = (oemCounts[oem] || 0) + 1;

      if (!customerByOem[oem]) {
        customerByOem[oem] = new Set();
      }
      customerByOem[oem].add(r.customerName.trim());
    });

    const sortedOems = Object.keys(oemCounts).sort((a, b) => oemCounts[b] - oemCounts[a]);
    const donutLabels = sortedOems;
    const donutData = sortedOems.map((o) => oemCounts[o]);
    const donutColors = sortedOems.map((o) => getOemColor(o));

    // Destroy existing donut chart
    if (oemChartInstance.current) {
      oemChartInstance.current.destroy();
    }

    if (oemDonutCanvasRef.current && donutLabels.length > 0) {
      const ctx = oemDonutCanvasRef.current.getContext('2d');
      if (ctx) {
        oemChartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: donutLabels,
            datasets: [
              {
                data: donutData,
                backgroundColor: donutColors,
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 6,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  boxWidth: 12,
                  boxHeight: 12,
                  font: { size: 11, family: 'Inter, system-ui, sans-serif' },
                  color: '#475569',
                  padding: 12,
                },
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const total = records.length;
                    const value = Number(context.raw) || 0;
                    const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                    return ` ${context.label}: ${value} devices (${pct}%)`;
                  },
                },
              },
            },
            cutout: '68%',
          },
        });
      }
    }

    // Secondary Chart Data
    if (customerChartInstance.current) {
      customerChartInstance.current.destroy();
    }

    if (customerBarCanvasRef.current) {
      const ctx = customerBarCanvasRef.current.getContext('2d');
      if (ctx) {
        if (activeSecondaryView === 'customerCount') {
          const barLabels = sortedOems;
          const barData = sortedOems.map((o) => (customerByOem[o] ? customerByOem[o].size : 0));
          const barColors = sortedOems.map((o) => getOemColor(o));

          customerChartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: barLabels,
              datasets: [
                {
                  label: 'Unique Customers',
                  data: barData,
                  backgroundColor: barColors,
                  borderRadius: 4,
                  barPercentage: 0.6,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { stepSize: 1, font: { size: 11 } },
                  grid: { color: '#f1f5f9' },
                },
                x: {
                  ticks: { font: { size: 11, weight: 'bold' }, color: '#475569' },
                  grid: { display: false },
                },
              },
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (context) => ` ${context.raw} client accounts use this OEM`,
                  },
                },
              },
            },
          });
        } else {
          // Status Breakdown: Active, Maintenance, Retired per OEM (Top 6 OEMs)
          const top6 = sortedOems.slice(0, 6);
          const activeCounts = top6.map((o) => records.filter((r) => r.oemBrand === o && r.status === 'Active').length);
          const maintCounts = top6.map((o) => records.filter((r) => r.oemBrand === o && r.status === 'Maintenance').length);
          const retiredCounts = top6.map((o) => records.filter((r) => r.oemBrand === o && r.status === 'Retired').length);

          customerChartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: top6,
              datasets: [
                {
                  label: 'Active',
                  data: activeCounts,
                  backgroundColor: '#10b981', // emerald-500
                  borderRadius: 3,
                },
                {
                  label: 'Maintenance',
                  data: maintCounts,
                  backgroundColor: '#f59e0b', // amber-500
                  borderRadius: 3,
                },
                {
                  label: 'Retired',
                  data: retiredCounts,
                  backgroundColor: '#94a3b8', // slate-400
                  borderRadius: 3,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { stacked: true, grid: { display: false } },
                y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } },
              },
              plugins: {
                legend: {
                  position: 'top',
                  labels: { boxWidth: 10, font: { size: 11 }, padding: 10 },
                },
              },
            },
          });
        }
      }
    }

    return () => {
      if (oemChartInstance.current) oemChartInstance.current.destroy();
      if (customerChartInstance.current) customerChartInstance.current.destroy();
    };
  }, [records, activeSecondaryView]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* OEM Device Breakdown (Donut) */}
      <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-sky-50 text-sky-600 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">OEM Fleet Breakdown</h3>
              <p className="text-xs text-slate-500">Device distribution by manufacturer</p>
            </div>
          </div>
          <span className="text-xs text-slate-500">{records.length} assets</span>
        </div>

        <div className="relative h-64 mt-3 flex items-center justify-center">
          {records.length === 0 ? (
            <div className="text-xs text-slate-400">No data available</div>
          ) : (
            <canvas ref={oemDonutCanvasRef}></canvas>
          )}
        </div>
      </div>

      {/* Customer Distribution by OEM (Bar) */}
      <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {activeSecondaryView === 'customerCount' ? 'Customer Penetration by OEM' : 'OEM Lifecycle Status'}
              </h3>
              <p className="text-xs text-slate-500">
                {activeSecondaryView === 'customerCount'
                  ? 'Distinct corporate clients utilizing each vendor'
                  : 'Active vs Maintenance vs Retired deployments'}
              </p>
            </div>
          </div>

          {/* Toggle buttons */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveSecondaryView('customerCount')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeSecondaryView === 'customerCount'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Customer Count
            </button>
            <button
              onClick={() => setActiveSecondaryView('lifecycle')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeSecondaryView === 'lifecycle'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" />
                Lifecycle
              </span>
            </button>
          </div>
        </div>

        <div className="relative h-64 mt-3">
          {records.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
              No data available
            </div>
          ) : (
            <canvas ref={customerBarCanvasRef}></canvas>
          )}
        </div>
      </div>
    </div>
  );
};
