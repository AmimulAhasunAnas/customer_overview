import { parseExcelData } from './excelUtils';
import { CustomerDeviceRecord } from './types';

/**
 * --------------------------------------------------------------------------
 * 🔗 GOOGLE SHEET REAL-TIME INTEGRATION CONFIGURATION
 * --------------------------------------------------------------------------
 * You can paste your Google Sheet share URL below so the dashboard loads
 * your live Google Sheet automatically on startup.
 *
 * Requirements for your Google Sheet:
 * 1. Open your Google Sheet in Google Drive.
 * 2. Click "Share" (top-right).
 * 3. Under "General access", select "Anyone with the link" and role "Viewer".
 * 4. Click "Copy link" and paste it below or in the dashboard UI!
 *
 * Example format:
 * "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing"
 */
export const DEFAULT_GOOGLE_SHEET_URL = '';

/**
 * Extracts the Google Sheet ID and sheet GID from any Google Sheets URL
 */
export function extractGoogleSheetId(url: string): { sheetId: string | null; gid: string } {
  if (!url) return { sheetId: null, gid: '0' };

  const trimmed = url.trim();

  // If user pasted a "Publish to the web" CSV URL directly
  if (trimmed.includes('/pub') && trimmed.includes('output=csv')) {
    return { sheetId: 'published_csv', gid: '0' };
  }

  // Standard Google Sheets link: /spreadsheets/d/<SHEET_ID>/...
  const idMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);

  return {
    sheetId: idMatch ? idMatch[1] : null,
    gid: gidMatch ? gidMatch[1] : '0',
  };
}

/**
 * Converts any standard Google Sheet URL into a CORS-friendly, cache-busting CSV stream
 */
export function getGoogleSheetCsvUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Already a direct CSV link
  if (trimmed.includes('output=csv')) {
    const sep = trimmed.includes('?') ? '&' : '?';
    return `${trimmed}${sep}_ts=${Date.now()}`;
  }

  const { sheetId, gid } = extractGoogleSheetId(trimmed);
  if (!sheetId) return null;

  // Google Visualization API CSV export: 100% CORS-friendly, client-side readable, real-time
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}&_ts=${Date.now()}`;
}

/**
 * Fetches real-time CSV data directly from a Google Sheet with read permission
 */
export async function fetchGoogleSheetData(rawUrl: string): Promise<{
  records: CustomerDeviceRecord[];
  error?: string;
  sourceSheetId?: string;
}> {
  const csvUrl = getGoogleSheetCsvUrl(rawUrl);
  if (!csvUrl) {
    return {
      records: [],
      error: 'Invalid Google Sheet URL. Please ensure it looks like: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit?usp=sharing',
    };
  }

  try {
    const response = await fetch(csvUrl, {
      method: 'GET',
      headers: {
        Accept: 'text/csv, text/plain, */*',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { records: [], error: 'Google Sheet not found. Please verify the URL.' };
      }
      if (response.status === 401 || response.status === 403) {
        return {
          records: [],
          error: 'Permission denied: Please open your Google Sheet, click "Share", and set General access to "Anyone with the link can view".',
        };
      }
      return { records: [], error: `Failed to fetch Google Sheet (HTTP ${response.status})` };
    }

    const csvText = await response.text();

    if (!csvText || csvText.trim().length === 0) {
      return { records: [], error: 'The Google Sheet is currently empty.' };
    }

    // If Google returned HTML instead of CSV, permissions are missing
    if (csvText.includes('<!DOCTYPE html>') || csvText.includes('<html')) {
      return {
        records: [],
        error: 'Permission Required: Open your Google Sheet, click "Share" -> change "Restricted" to "Anyone with the link" (Viewer), then try again.',
      };
    }

    // Encode text as Uint8Array for SheetJS parsing
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(csvText);
    const { records, errors } = parseExcelData(dataBuffer);

    if (errors.length > 0 && records.length === 0) {
      return { records: [], error: errors.join(', ') };
    }

    if (records.length === 0) {
      return {
        records: [],
        error: 'No valid customer device records found. Ensure your Google Sheet contains headers: Customer Name, OEM Brand, Device Model, etc.',
      };
    }

    const { sheetId } = extractGoogleSheetId(rawUrl);
    return {
      records,
      sourceSheetId: sheetId || undefined,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    return {
      records: [],
      error: `Could not connect to Google Sheet: ${message}. Ensure you have an internet connection and the sheet is public/viewable with link.`,
    };
  }
}
