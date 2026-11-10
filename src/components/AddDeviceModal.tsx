import React, { useState, useEffect } from 'react';
import { CustomerDeviceRecord, DeviceStatus } from '../types';
import { X, Save } from 'lucide-react';

interface AddDeviceModalProps {
  isOpen: boolean;
  editingRecord: CustomerDeviceRecord | null;
  existingCustomers: string[];
  existingOems: string[];
  onClose: () => void;
  onSave: (record: CustomerDeviceRecord) => void;
}

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  isOpen,
  editingRecord,
  existingCustomers,
  existingOems,
  onClose,
  onSave,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [industry, setIndustry] = useState('');
  const [oemBrand, setOemBrand] = useState('Cisco');
  const [deviceModel, setDeviceModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [status, setStatus] = useState<DeviceStatus>('Active');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (editingRecord) {
      setCustomerName(editingRecord.customerName);
      setIndustry(editingRecord.industry);
      setOemBrand(editingRecord.oemBrand);
      setDeviceModel(editingRecord.deviceModel);
      setSerialNumber(editingRecord.serialNumber);
      setStatus(editingRecord.status);
      setLocation(editingRecord.location || '');
    } else {
      setCustomerName('');
      setIndustry('Financial Services');
      setOemBrand('Cisco');
      setDeviceModel('');
      setSerialNumber('');
      setStatus('Active');
      setLocation('');
    }
  }, [editingRecord, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !oemBrand.trim() || !deviceModel.trim()) {
      alert('Please fill out Customer Name, OEM Brand, and Device Model.');
      return;
    }

    const record: CustomerDeviceRecord = {
      id: editingRecord ? editingRecord.id : `dev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      customerName: customerName.trim(),
      industry: industry.trim() || 'General Enterprise',
      oemBrand: oemBrand.trim(),
      deviceModel: deviceModel.trim(),
      serialNumber: serialNumber.trim() || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      status,
      location: location.trim() || undefined,
    };

    onSave(record);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-900">
            {editingRecord ? 'Edit Hardware Asset' : 'Add New Customer Hardware Asset'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Customer Name */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Customer / Company Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              list="customer-suggestions"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <datalist id="customer-suggestions">
              {existingCustomers.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Industry */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Industry / Sector</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Healthcare, Finance"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* OEM Brand */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                OEM Brand <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                list="oem-suggestions"
                value={oemBrand}
                onChange={(e) => setOemBrand(e.target.value)}
                placeholder="e.g. Cisco, Dell, HP"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <datalist id="oem-suggestions">
                {['Cisco', 'Dell', 'HP', 'Palo Alto', 'Lenovo', 'Fortinet', 'Juniper', 'Arista', ...existingOems].map(
                  (oem, idx) => (
                    <option key={`${oem}-${idx}`} value={oem} />
                  )
                )}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Device Model */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Device Model <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={deviceModel}
                onChange={(e) => setDeviceModel(e.target.value)}
                placeholder="e.g. Catalyst 9300 48P"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Serial Number */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Serial Number / Hostname
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. CSCO-9300-8812A"
                className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Lifecycle Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DeviceStatus)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
              >
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Retired">Retired</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Location / Site</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Ashburn DC Rack 4"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{editingRecord ? 'Update Record' : 'Save Device'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
