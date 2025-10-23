import { sheets_v4, drive_v3 } from 'googleapis';
import { AuthService } from '../auth/auth-service.js';
import { SheetsUtils } from '../utils/sheets-utils.js';
import { RetryUtil, RateLimiter } from '../utils/retry-utils.js';
import {
  SpreadsheetFile,
  SheetInfo,
  RangeData,
  SearchResult,
  UpdateResult,
  SmartReplaceResult,
} from '../types/index.js';
import {
  SpreadsheetNotFoundError,
  SheetNotFoundError,
  InvalidRangeError,
  ValidationError,
} from '../types/errors.js';

/**
 * Google Sheets API service wrapper
 * Provides high-level methods for Google Sheets operations
 */
export class GoogleSheetsService {
  private authService: AuthService;
  private rateLimiter: RateLimiter;

  constructor(authService: AuthService) {
    this.authService = authService;
    this.rateLimiter = new RateLimiter(60, 60000); // 60 requests per minute
  }

  /**
   * Get authenticated Google Sheets client
   */
  private async getSheetsClient(): Promise<sheets_v4.Sheets> {
    return this.authService.getSheetsClient();
  }

  /**
   * Get authenticated Google Drive client
   */
  private async getDriveClient(): Promise<drive_v3.Drive> {
    return this.authService.getDriveClient();
  }

  /**
   * List all accessible spreadsheet files
   */
  async listFiles(query?: string): Promise<SpreadsheetFile[]> {
    return RetryUtil.executeWithRetry(async () => {
      await this.rateLimiter.checkRateLimit();
      
      const drive = await this.getDriveClient();
      const response = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.spreadsheet'" + (query ? ` and name contains '${query}'` : ''),
        fields: 'files(id,name,modifiedTime,webViewLink,owners)',
        orderBy: 'modifiedTime desc',
        pageSize: 100,
      });

      return (response.data.files || []).map(file => ({
        id: file.id!,
        name: file.name!,
        modifiedTime: file.modifiedTime!,
        webViewLink: file.webViewLink,
        owners: file.owners?.map(owner => owner.emailAddress || ''),
      }));
    });
  }

  /**
   * Get spreadsheet metadata and sheet information
   */
  async getSpreadsheetInfo(spreadsheetId: string): Promise<{
    spreadsheetId: string;
    title: string;
    sheets: SheetInfo[];
  }> {
    return RetryUtil.executeWithRetry(async () => {
      await this.rateLimiter.checkRateLimit();
      
      const sheets = await this.getSheetsClient();
      const spreadsheetIdClean = SheetsUtils.extractSpreadsheetId(spreadsheetId);
      
      const response = await sheets.spreadsheets.get({
        spreadsheetId: spreadsheetIdClean,
        fields: 'properties,sheets.properties',
      });

      if (!response.data) {
        throw new SpreadsheetNotFoundError(spreadsheetIdClean);
      }

            return {
              spreadsheetId: spreadsheetIdClean,
              title: response.data.properties?.title || 'Untitled',
              sheets: (response.data.sheets || []).map(sheet => ({
                sheetId: sheet.properties?.sheetId || 0,
                title: sheet.properties?.title || 'Sheet1',
                index: sheet.properties?.index || 0,
                sheetType: (sheet.properties?.sheetType as 'GRID' | 'OBJECT') || 'GRID',
                ...(sheet.properties?.gridProperties && {
                              gridProperties: {
                                rowCount: sheet.properties.gridProperties.rowCount ?? null,
                                columnCount: sheet.properties.gridProperties.columnCount ?? null
                              }                })
              })),
            };    });
  }

  /**
   * List all sheets in a spreadsheet
   */
  async listSheets(spreadsheetId: string): Promise<SheetInfo[]> {
    const info = await this.getSpreadsheetInfo(spreadsheetId);
    return info.sheets;
  }

  /**
   * Read all data from a sheet
   */
  async readData(
    spreadsheetId: string,
    sheetName?: string,
    includeFormats: boolean = false
  ): Promise<any[][]> {
    return RetryUtil.executeWithRetry(async () => {
      await this.rateLimiter.checkRateLimit();
      
      const sheets = await this.getSheetsClient();
      const spreadsheetIdClean = SheetsUtils.extractSpreadsheetId(spreadsheetId);
      
      // Get sheet info to determine the range
      const info = await this.getSpreadsheetInfo(spreadsheetIdClean);
      const targetSheet = sheetName 
        ? info.sheets.find(sheet => sheet.title === sheetName)
        : info.sheets[0];

      if (!targetSheet) {
        throw new SheetNotFoundError(sheetName || 'first sheet');
      }

      const range = targetSheet.title;
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetIdClean,
        range,
        valueRenderOption: includeFormats ? 'FORMATTED_VALUE' : 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING',
      });

      return response.data.values || [];
    });
  }

  /**
   * Read data from a specific range
   */
  async readRange(
    spreadsheetId: string,
    sheetName: string,
    range: string
  ): Promise<any[][]> {
    return RetryUtil.executeWithRetry(async () => {
      await this.rateLimiter.checkRateLimit();
      
      const sheets = await this.getSheetsClient();
      const spreadsheetIdClean = SheetsUtils.extractSpreadsheetId(spreadsheetId);
      
      if (!SheetsUtils.isValidRange(range)) {
        throw new InvalidRangeError(range);
      }

      const fullRange = SheetsUtils.createSheetRange(sheetName, range);
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetIdClean,
        range: fullRange,
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING',
      });

      return response.data.values || [];
    });
  }

  /**
   * Search for text in a sheet
   */
  async search(
    spreadsheetId: string,
    sheetName: string,
    searchText: string,
    searchColumns?: string[]
  ): Promise<SearchResult[]> {
    return RetryUtil.executeWithRetry(async () => {
      await this.rateLimiter.checkRateLimit();
      
      const data = await this.readData(spreadsheetId, sheetName);
      const results: SearchResult[] = [];

      for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];
        if (!row) continue;
        
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
          const cellValue = row[colIndex];
          
          // Skip if searching specific columns and this isn't one of them
          if (searchColumns && searchColumns.length > 0) {
            const columnLetter = SheetsUtils.rowColToA1(1, colIndex + 1).replace(/[0-9]/g, '');
            if (!searchColumns.includes(columnLetter)) {
              continue;
            }
          }

          // Check if cell contains search text
          if (cellValue && String(cellValue).toLowerCase().includes(searchText.toLowerCase())) {
            results.push({
              cell: SheetsUtils.rowColToA1(rowIndex + 1, colIndex + 1),
              value: cellValue,
              row: rowIndex + 1,
              column: colIndex + 1,
              sheetName,
            });
          }
        }
      }

      return results;
    });
  }

  /**
   * Update a single cell
   */
  async updateCell(
    spreadsheetId: string,
    sheetName: string,
    cell: string,
    value: any
  ): Promise<UpdateResult> {
    return RetryUtil.executeWithRetry(async () => {
      await this.rateLimiter.checkRateLimit();
      
      const sheets = await this.getSheetsClient();
      const spreadsheetIdClean = SheetsUtils.extractSpreadsheetId(spreadsheetId);
      
      const range = SheetsUtils.createSheetRange(sheetName, cell);
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetIdClean,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[value]],
        },
      });

      return {
        updatedCells: 1,
        updatedRange: range,
      };
    });
  }

  /**
   * Update multiple cells in a range
   */
  async updateRange(
    spreadsheetId: string,
    sheetName: string,
    range: string,
    values: any[][],
    preserveFormulas: boolean = false
  ): Promise<UpdateResult> {
    return RetryUtil.executeWithRetry(async () => {
      await this.rateLimiter.checkRateLimit();
      
      const sheets = await this.getSheetsClient();
      const spreadsheetIdClean = SheetsUtils.extractSpreadsheetId(spreadsheetId);
      
      if (!SheetsUtils.isValidRange(range)) {
        throw new InvalidRangeError(range);
      }

      const fullRange = SheetsUtils.createSheetRange(sheetName, range);
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetIdClean,
        range: fullRange,
        valueInputOption: preserveFormulas ? 'RAW' : 'USER_ENTERED',
        requestBody: {
          values,
        },
      });

      const totalCells = values.reduce((sum, row) => sum + row.length, 0);
      
      return {
        updatedCells: totalCells,
        updatedRange: fullRange,
      };
    });
  }

  /**
   * Smart replace text in cells
   */
  async smartReplace(
    spreadsheetId: string,
    sheetName: string,
    findText: string,
    replaceText: string,
    range?: string,
    matchCase: boolean = false,
    matchEntireCell: boolean = false
  ): Promise<SmartReplaceResult> {
    return RetryUtil.executeWithRetry(async () => {
      await this.rateLimiter.checkRateLimit();
      
      const data = await this.readData(spreadsheetId, sheetName);
      const replacements: Array<{
        cell: string;
        originalValue: string;
        newValue: string;
      }> = [];

      const searchText = matchCase ? findText : findText.toLowerCase();
      
      for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];
        if (!row) continue;
        
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
          const cellValue = row[colIndex];
          
          if (!cellValue) continue;

          const cellText = matchCase ? String(cellValue) : String(cellValue).toLowerCase();
          const cellRef = SheetsUtils.rowColToA1(rowIndex + 1, colIndex + 1);
          
          // Skip if range is specified and cell is outside range
          if (range) {
            const parsedRange = SheetsUtils.parseRange(range);
            if (rowIndex + 1 < parsedRange.startRow || rowIndex + 1 > parsedRange.endRow ||
                colIndex + 1 < parsedRange.startCol || colIndex + 1 > parsedRange.endCol) {
              continue;
            }
          }

          let newValue: string = String(cellValue);
          let shouldReplace = false;

          if (matchEntireCell) {
            if (cellText === searchText) {
              newValue = replaceText;
              shouldReplace = true;
            }
          } else {
            if (cellText.includes(searchText)) {
              newValue = String(cellValue).replace(
                new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), matchCase ? 'g' : 'gi'),
                replaceText
              );
              shouldReplace = true;
            }
          }

          if (shouldReplace) {
            replacements.push({
              cell: cellRef,
              originalValue: String(cellValue),
              newValue,
            });
            
            // Update the cell
            await this.updateCell(spreadsheetId, sheetName, cellRef, newValue);
          }
        }
      }

      return {
        modifiedCells: replacements.length,
        replacements,
      };
    });
  }

  /**
   * Append rows to the end of a sheet
   */
  async appendRows(
    spreadsheetId: string,
    sheetName: string,
    values: any[][]
  ): Promise<{ appendedRange: string }> {
    return RetryUtil.executeWithRetry(async () => {
      await this.rateLimiter.checkRateLimit();
      
      const sheets = await this.getSheetsClient();
      const spreadsheetIdClean = SheetsUtils.extractSpreadsheetId(spreadsheetId);
      
      const range = SheetsUtils.createSheetRange(sheetName);
      
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetIdClean,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values,
        },
      });

      return {
        appendedRange: response.data.updates?.updatedRange || range,
      };
    });
  }

  /**
   * Create a new sheet
   */
  async createSheet(
    spreadsheetId: string,
    sheetName: string
  ): Promise<{ sheetId: number }> {
    return RetryUtil.executeWithRetry(async () => {
      await this.rateLimiter.checkRateLimit();
      
      const sheets = await this.getSheetsClient();
      const spreadsheetIdClean = SheetsUtils.extractSpreadsheetId(spreadsheetId);
      
      const response = await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetIdClean,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            },
          ],
        },
      });

      const addedSheet = response.data.replies?.[0]?.addSheet;
      if (!addedSheet) {
        throw new Error('Failed to create sheet');
      }

      return {
        sheetId: addedSheet.properties?.sheetId || 0,
      };
    });
  }

  /**
   * Delete a sheet
   */
  async deleteSheet(
    spreadsheetId: string,
    sheetName: string
  ): Promise<void> {
    return RetryUtil.executeWithRetry(async () => {
      await this.rateLimiter.checkRateLimit();
      
      const sheets = await this.getSheetsClient();
      const spreadsheetIdClean = SheetsUtils.extractSpreadsheetId(spreadsheetId);
      
      // Get sheet info to find sheet ID
      const info = await this.getSpreadsheetInfo(spreadsheetIdClean);
      const targetSheet = info.sheets.find(sheet => sheet.title === sheetName);
      
      if (!targetSheet) {
        throw new SheetNotFoundError(sheetName);
      }

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetIdClean,
        requestBody: {
          requests: [
            {
              deleteSheet: {
                sheetId: targetSheet.sheetId,
              },
            },
          ],
        },
      });
    });
  }

  /**
   * Rename a sheet
   */
  async renameSheet(
    spreadsheetId: string,
    oldName: string,
    newName: string
  ): Promise<void> {
    return RetryUtil.executeWithRetry(async () => {
      await this.rateLimiter.checkRateLimit();
      
      const sheets = await this.getSheetsClient();
      const spreadsheetIdClean = SheetsUtils.extractSpreadsheetId(spreadsheetId);
      
      // Get sheet info to find sheet ID
      const info = await this.getSpreadsheetInfo(spreadsheetIdClean);
      const targetSheet = info.sheets.find(sheet => sheet.title === oldName);
      
      if (!targetSheet) {
        throw new SheetNotFoundError(oldName);
      }

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetIdClean,
        requestBody: {
          requests: [
            {
              updateSheetProperties: {
                properties: {
                  sheetId: targetSheet.sheetId,
                  title: newName,
                },
                fields: 'title',
              },
            },
          ],
        },
      });
    });
  }
}

