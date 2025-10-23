/**
 * Google Sheets MCP Server Configuration Types
 */

export interface GoogleConfig {
  type: 'oauth' | 'service_account';
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  credentials?: string; // Path to service account key file
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerDay: number;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum number of cached items
}

export interface ServerConfig {
  google: GoogleConfig;
  rateLimit?: RateLimitConfig;
  cache?: CacheConfig;
}

export interface SpreadsheetFile {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink?: string | null | undefined;
  owners?: string[] | undefined;
}

export interface SheetInfo {
  sheetId: number;
  title: string;
  index: number;
  sheetType: 'GRID' | 'OBJECT';
  gridProperties?: {
    rowCount?: number | null;
    columnCount?: number | null;
  };
}

export interface CellData {
  value: any;
  formattedValue?: string;
  userEnteredFormat?: any;
  effectiveFormat?: any;
}

export interface RangeData {
  range: string;
  values: any[][];
  majorDimension?: 'ROWS' | 'COLUMNS';
}

export interface SearchResult {
  cell: string;
  value: any;
  row: number;
  column: number;
  sheetName: string;
}

export interface UpdateResult {
  updatedCells: number;
  updatedRange: string;
}

export interface SmartReplaceResult {
  modifiedCells: number;
  replacements: Array<{
    cell: string;
    originalValue: string;
    newValue: string;
  }>;
}

