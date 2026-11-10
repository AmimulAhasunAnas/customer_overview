export type DeviceStatus = 'Active' | 'Maintenance' | 'Retired';

export interface CustomerDeviceRecord {
  id: string;
  customerName: string;
  industry: string;
  oemBrand: string;
  deviceModel: string;
  serialNumber: string;
  status: DeviceStatus;
  location?: string;
  warrantyExpiry?: string;
}

export type SortField = 'customerName' | 'industry' | 'oemBrand' | 'deviceModel' | 'serialNumber' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  searchQuery: string;
  oemFilter: string;
  statusFilter: string;
  industryFilter: string;
}
