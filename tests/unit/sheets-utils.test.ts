import { SheetsUtils } from '../src/utils/sheets-utils.js';

describe('SheetsUtils', () => {
  describe('extractSpreadsheetId', () => {
    it('should return ID as-is for valid ID format', () => {
      const id = '1A2B3C4D5E6F7G8H9I0J';
      expect(SheetsUtils.extractSpreadsheetId(id)).toBe(id);
    });

    it('should extract ID from Google Sheets URL', () => {
      const url = 'https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9I0J/edit';
      expect(SheetsUtils.extractSpreadsheetId(url)).toBe('1A2B3C4D5E6F7G8H9I0J');
    });

    it('should extract ID from shortened URL', () => {
      const url = 'https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9I0J';
      expect(SheetsUtils.extractSpreadsheetId(url)).toBe('1A2B3C4D5E6F7G8H9I0J');
    });

    it('should throw error for invalid input', () => {
      expect(() => SheetsUtils.extractSpreadsheetId('invalid')).toThrow();
    });
  });

  describe('a1ToRowCol', () => {
    it('should convert A1 to row 1, col 1', () => {
      const result = SheetsUtils.a1ToRowCol('A1');
      expect(result).toEqual({ row: 1, col: 1 });
    });

    it('should convert B2 to row 2, col 2', () => {
      const result = SheetsUtils.a1ToRowCol('B2');
      expect(result).toEqual({ row: 2, col: 2 });
    });

    it('should convert Z26 to row 26, col 26', () => {
      const result = SheetsUtils.a1ToRowCol('Z26');
      expect(result).toEqual({ row: 26, col: 26 });
    });

    it('should convert AA27 to row 27, col 27', () => {
      const result = SheetsUtils.a1ToRowCol('AA27');
      expect(result).toEqual({ row: 27, col: 27 });
    });

    it('should throw error for invalid A1 notation', () => {
      expect(() => SheetsUtils.a1ToRowCol('invalid')).toThrow();
    });
  });

  describe('rowColToA1', () => {
    it('should convert row 1, col 1 to A1', () => {
      expect(SheetsUtils.rowColToA1(1, 1)).toBe('A1');
    });

    it('should convert row 2, col 2 to B2', () => {
      expect(SheetsUtils.rowColToA1(2, 2)).toBe('B2');
    });

    it('should convert row 26, col 26 to Z26', () => {
      expect(SheetsUtils.rowColToA1(26, 26)).toBe('Z26');
    });

    it('should convert row 27, col 27 to AA27', () => {
      expect(SheetsUtils.rowColToA1(27, 27)).toBe('AA27');
    });
  });

  describe('parseRange', () => {
    it('should parse A1:B10 correctly', () => {
      const result = SheetsUtils.parseRange('A1:B10');
      expect(result).toEqual({
        startRow: 1,
        endRow: 10,
        startCol: 1,
        endCol: 2,
      });
    });

    it('should parse Z1:AA10 correctly', () => {
      const result = SheetsUtils.parseRange('Z1:AA10');
      expect(result).toEqual({
        startRow: 1,
        endRow: 10,
        startCol: 26,
        endCol: 27,
      });
    });

    it('should throw error for invalid range', () => {
      expect(() => SheetsUtils.parseRange('invalid')).toThrow();
    });
  });

  describe('isValidRange', () => {
    it('should return true for valid range', () => {
      expect(SheetsUtils.isValidRange('A1:B10')).toBe(true);
    });

    it('should return false for invalid range', () => {
      expect(SheetsUtils.isValidRange('invalid')).toBe(false);
    });
  });

  describe('createSheetRange', () => {
    it('should create sheet range with range', () => {
      expect(SheetsUtils.createSheetRange('Sheet1', 'A1:B10')).toBe('Sheet1!A1:B10');
    });

    it('should create sheet range without range', () => {
      expect(SheetsUtils.createSheetRange('Sheet1')).toBe('Sheet1');
    });
  });

  describe('extractSheetName', () => {
    it('should extract sheet name from range', () => {
      expect(SheetsUtils.extractSheetName('Sheet1!A1:B10')).toBe('Sheet1');
    });

    it('should return null for range without sheet name', () => {
      expect(SheetsUtils.extractSheetName('A1:B10')).toBe(null);
    });
  });

  describe('isEmpty', () => {
    it('should return true for null', () => {
      expect(SheetsUtils.isEmpty(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(SheetsUtils.isEmpty(undefined)).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(SheetsUtils.isEmpty('')).toBe(true);
    });

    it('should return false for non-empty values', () => {
      expect(SheetsUtils.isEmpty('test')).toBe(false);
      expect(SheetsUtils.isEmpty(0)).toBe(false);
      expect(SheetsUtils.isEmpty(false)).toBe(false);
    });
  });

  describe('flattenArray', () => {
    it('should flatten 2D array to 1D', () => {
      const input = [[1, 2], [3, 4], [5]];
      expect(SheetsUtils.flattenArray(input)).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle empty array', () => {
      expect(SheetsUtils.flattenArray([])).toEqual([]);
    });
  });

  describe('chunkArray', () => {
    it('should chunk array correctly', () => {
      const input = [1, 2, 3, 4, 5, 6, 7];
      expect(SheetsUtils.chunkArray(input, 3)).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    });

    it('should handle empty array', () => {
      expect(SheetsUtils.chunkArray([], 3)).toEqual([]);
    });
  });
});

