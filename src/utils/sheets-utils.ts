import { sheets_v4 } from 'googleapis';

/**
 * Utility functions for Google Sheets operations
 */
export class SheetsUtils {
  /**
   * Extract spreadsheet ID from URL or return as-is if already an ID
   */
  static extractSpreadsheetId(input: string): string {
    // If it's already a valid ID format (alphanumeric string)
    if (/^[a-zA-Z0-9-_]+$/.test(input)) {
      return input;
    }

    // Extract from Google Sheets URL
    const urlPatterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/,
    ];

    for (const pattern of urlPatterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    throw new Error(`Invalid spreadsheet ID or URL: ${input}`);
  }

  /**
   * Convert A1 notation to row and column numbers
   */
  static a1ToRowCol(a1: string): { row: number; col: number } {
    const match = a1.match(/^([A-Z]+)([0-9]+)$/);
    if (!match || !match[1] || !match[2]) {
      throw new Error(`Invalid A1 notation: ${a1}`);
    }

    const colStr = match[1];
    const rowStr = match[2];

    // Convert column letters to number
    let col = 0;
    for (let i = 0; i < colStr.length; i++) {
      col = col * 26 + (colStr.charCodeAt(i) - 64);
    }

    return {
      row: parseInt(rowStr, 10),
      col,
    };
  }

  /**
   * Convert row and column numbers to A1 notation
   */
  static rowColToA1(row: number, col: number): string {
    let colStr = '';
    while (col > 0) {
      col--;
      colStr = String.fromCharCode(65 + (col % 26)) + colStr;
      col = Math.floor(col / 26);
    }
    return `${colStr}${row}`;
  }

  /**
   * Parse range string (e.g., "A1:B10") to get start and end coordinates
   */
  static parseRange(range: string): {
    startRow: number;
    endRow: number;
    startCol: number;
    endCol: number;
  } {
    const parts = range.split(':');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error(`Invalid range format: ${range}`);
    }

    const start = this.a1ToRowCol(parts[0]);
    const end = this.a1ToRowCol(parts[1]);

    return {
      startRow: start.row,
      endRow: end.row,
      startCol: start.col,
      endCol: end.col,
    };
  }

  /**
   * Expand range to include all data
   */
  static expandRangeToData(
    range: string,
    data: any[][]
  ): string {
    if (!data || data.length === 0) {
      return range;
    }

    const parsed = this.parseRange(range);
    const actualRows = data.length;
    const actualCols = data[0]?.length || 0;

    const startCell = this.rowColToA1(parsed.startRow, parsed.startCol);
    const endCell = this.rowColToA1(
      parsed.startRow + actualRows - 1,
      parsed.startCol + actualCols - 1
    );

    return `${startCell}:${endCell}`;
  }

  /**
   * Validate range format
   */
  static isValidRange(range: string): boolean {
    try {
      this.parseRange(range);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get sheet by name from spreadsheet metadata
   */
  static findSheetByName(
    sheets: sheets_v4.Schema$Sheet[],
    sheetName: string
  ): sheets_v4.Schema$Sheet | null {
    return sheets.find((sheet) => sheet.properties?.title === sheetName) || null;
  }

  /**
   * Get sheet by ID from spreadsheet metadata
   */
  static findSheetById(
    sheets: sheets_v4.Schema$Sheet[],
    sheetId: number
  ): sheets_v4.Schema$Sheet | null {
    return sheets.find((sheet) => sheet.properties?.sheetId === sheetId) || null;
  }

  /**
   * Convert 2D array to Google Sheets format
   */
  static arrayToSheetsFormat(values: any[][]): sheets_v4.Schema$ValueRange {
    return {
      values,
      majorDimension: 'ROWS',
    };
  }

  /**
   * Convert Google Sheets format to 2D array
   */
  static sheetsFormatToArray(
    valueRange: sheets_v4.Schema$ValueRange
  ): any[][] {
    return valueRange.values || [];
  }

  /**
   * Create a range string for a specific sheet
   */
  static createSheetRange(sheetName: string, range?: string): string {
    if (range) {
      return `${sheetName}!${range}`;
    }
    return sheetName;
  }

  /**
   * Extract sheet name from range string
   */
  static extractSheetName(range: string): string | null {
    const match = range.match(/^([^!]+)!/);
    return match?.[1] || null;
  }

  /**
   * Check if a value is empty (null, undefined, or empty string)
   */
  static isEmpty(value: any): boolean {
    return value === null || value === undefined || value === '';
  }

  /**
   * Flatten 2D array to 1D array
   */
  static flattenArray<T>(array: T[][]): T[] {
    return array.reduce((acc, curr) => acc.concat(curr), []);
  }

  /**
   * Chunk array into smaller arrays
   */
  static chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

