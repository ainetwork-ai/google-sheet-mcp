import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { GoogleSheetsService } from '../services/google-sheets-service.js';
import { AuthService } from '../auth/auth-service.js';
import {
  ListFilesParamsSchema,
  ReadDataParamsSchema,
  ReadRangeParamsSchema,
  SearchParamsSchema,
  UpdateCellParamsSchema,
  UpdateRangeParamsSchema,
  SmartReplaceParamsSchema,
  AppendRowsParamsSchema,
  CreateSheetParamsSchema,
  DeleteSheetParamsSchema,
  RenameSheetParamsSchema,
} from '../types/schemas.js';
import { ValidationError } from '../types/errors.js';

/**
 * Create all MCP tools for Google Sheets operations
 */
export function createTools(googleSheetsService: GoogleSheetsService, authService: AuthService): Tool[] {
  return [
    // Auth tools
    createAuthTool(authService),

    // Read tools
    createListFilesTool(googleSheetsService),
    createListSheetsTool(googleSheetsService),
    createReadDataTool(googleSheetsService),
    createReadRangeTool(googleSheetsService),
    createSearchTool(googleSheetsService),
    
    // Update tools
    createUpdateCellTool(googleSheetsService),
    createUpdateRangeTool(googleSheetsService),
    createSmartReplaceTool(googleSheetsService),
    createAppendRowsTool(googleSheetsService),
    
    // Management tools
    createCreateSheetTool(googleSheetsService),
    createDeleteSheetTool(googleSheetsService),
    createRenameSheetTool(googleSheetsService),
  ];
}

/**
 * List all accessible spreadsheet files
 */
function createListFilesTool(googleSheetsService: GoogleSheetsService): Tool {
  return {
    name: 'sheets_list_files',
    description: 'List all spreadsheet files accessible to the authenticated user',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Optional query to filter files by name',
        },
      },
    },
    handler: async (args: any) => {
      try {
        const params = ListFilesParamsSchema.parse(args);
        const files = await googleSheetsService.listFiles(params.query);
        
        return {
          files: files.map(file => ({
            id: file.id,
            name: file.name,
            modifiedTime: file.modifiedTime,
            webViewLink: file.webViewLink,
            owners: file.owners,
          })),
          totalCount: files.length,
        };
      } catch (error) {
        if (error instanceof Error) {
          throw new ValidationError(error.message);
        }
        throw error;
      }
    },
  };
}

/**
 * List all sheets in a spreadsheet
 */
function createListSheetsTool(googleSheetsService: GoogleSheetsService): Tool {
  return {
    name: 'sheets_list_sheets',
    description: 'List all sheets in a specific spreadsheet',
    inputSchema: {
      type: 'object',
      properties: {
        spreadsheetId: {
          type: 'string',
          description: 'The spreadsheet ID or full URL',
        },
      },
      required: ['spreadsheetId'],
    },
    handler: async (args: any) => {
      try {
        const sheets = await googleSheetsService.listSheets(args.spreadsheetId);
        
        return {
          sheets: sheets.map(sheet => ({
            sheetId: sheet.sheetId,
            title: sheet.title,
            index: sheet.index,
            sheetType: sheet.sheetType,
            rowCount: sheet.gridProperties?.rowCount,
            columnCount: sheet.gridProperties?.columnCount,
          })),
          totalCount: sheets.length,
        };
      } catch (error) {
        if (error instanceof Error) {
          throw new ValidationError(error.message);
        }
        throw error;
      }
    },
  };
}

/**
 * Read all data from a sheet
 */
function createReadDataTool(googleSheetsService: GoogleSheetsService): Tool {
  return {
    name: 'sheets_read_data',
    description: 'Read all data from a specific sheet',
    inputSchema: {
      type: 'object',
      properties: {
        spreadsheetId: {
          type: 'string',
          description: 'The spreadsheet ID or full URL',
        },
        sheetName: {
          type: 'string',
          description: 'Sheet name (defaults to first sheet)',
        },
        includeFormats: {
          type: 'boolean',
          description: 'Include cell formatting information',
          default: false,
        },
      },
      required: ['spreadsheetId'],
    },
    handler: async (args: any) => {
      try {
        const params = ReadDataParamsSchema.parse(args);
        const data = await googleSheetsService.readData(
          params.spreadsheetId,
          params.sheetName,
          params.includeFormats
        );
        
        return {
          data,
          rowCount: data.length,
          columnCount: data[0]?.length || 0,
          sheetName: params.sheetName || 'first sheet',
        };
      } catch (error) {
        if (error instanceof Error) {
          throw new ValidationError(error.message);
        }
        throw error;
      }
    },
  };
}

/**
 * Read data from a specific range
 */
function createReadRangeTool(googleSheetsService: GoogleSheetsService): Tool {
  return {
    name: 'sheets_read_range',
    description: 'Read data from a specific range in a sheet',
    inputSchema: {
      type: 'object',
      properties: {
        spreadsheetId: {
          type: 'string',
          description: 'The spreadsheet ID or full URL',
        },
        sheetName: {
          type: 'string',
          description: 'Sheet name',
        },
        range: {
          type: 'string',
          description: 'A1 notation range (e.g., "A1:D10")',
        },
      },
      required: ['spreadsheetId', 'sheetName', 'range'],
    },
    handler: async (args: any) => {
      try {
        const params = ReadRangeParamsSchema.parse(args);
        const data = await googleSheetsService.readRange(
          params.spreadsheetId,
          params.sheetName,
          params.range
        );
        
        return {
          data,
          range: params.range,
          rowCount: data.length,
          columnCount: data[0]?.length || 0,
          sheetName: params.sheetName,
        };
      } catch (error) {
        if (error instanceof Error) {
          throw new ValidationError(error.message);
        }
        throw error;
      }
    },
  };
}

/**
 * Search for text in a sheet
 */
function createSearchTool(googleSheetsService: GoogleSheetsService): Tool {
  return {
    name: 'sheets_search',
    description: 'Search for cells containing specific text',
    inputSchema: {
      type: 'object',
      properties: {
        spreadsheetId: {
          type: 'string',
          description: 'The spreadsheet ID or full URL',
        },
        sheetName: {
          type: 'string',
          description: 'Sheet name',
        },
        searchText: {
          type: 'string',
          description: 'Text to search for',
        },
        searchColumns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Limit search to specific columns (e.g., ["A", "B"])',
        },
      },
      required: ['spreadsheetId', 'sheetName', 'searchText'],
    },
    handler: async (args: any) => {
      try {
        const params = SearchParamsSchema.parse(args);
        const results = await googleSheetsService.search(
          params.spreadsheetId,
          params.sheetName,
          params.searchText,
          params.searchColumns
        );
        
        return {
          results,
          totalMatches: results.length,
          searchText: params.searchText,
          sheetName: params.sheetName,
          searchColumns: params.searchColumns,
        };
      } catch (error) {
        if (error instanceof Error) {
          throw new ValidationError(error.message);
        }
        throw error;
      }
    },
  };
}

/**
 * Update a single cell
 */
function createUpdateCellTool(googleSheetsService: GoogleSheetsService): Tool {
  return {
    name: 'sheets_update_cell',
    description: 'Update a single cell value',
    inputSchema: {
      type: 'object',
      properties: {
        spreadsheetId: {
          type: 'string',
          description: 'The spreadsheet ID or full URL',
        },
        sheetName: {
          type: 'string',
          description: 'Sheet name',
        },
        cell: {
          type: 'string',
          description: 'Cell reference (e.g., "B5")',
        },
        value: {
          description: 'New value for the cell',
        },
      },
      required: ['spreadsheetId', 'sheetName', 'cell', 'value'],
    },
    handler: async (args: any) => {
      try {
        const params = UpdateCellParamsSchema.parse(args);
        const result = await googleSheetsService.updateCell(
          params.spreadsheetId,
          params.sheetName,
          params.cell,
          params.value
        );
        
        return {
          success: true,
          updatedCells: result.updatedCells,
          updatedRange: result.updatedRange,
          message: `Cell ${params.cell} updated successfully`,
        };
      } catch (error) {
        if (error instanceof Error) {
          throw new ValidationError(error.message);
        }
        throw error;
      }
    },
  };
}

/**
 * Update multiple cells in a range
 */
function createUpdateRangeTool(googleSheetsService: GoogleSheetsService): Tool {
  return {
    name: 'sheets_update_range',
    description: 'Update multiple cells in a range',
    inputSchema: {
      type: 'object',
      properties: {
        spreadsheetId: {
          type: 'string',
          description: 'The spreadsheet ID or full URL',
        },
        sheetName: {
          type: 'string',
          description: 'Sheet name',
        },
        range: {
          type: 'string',
          description: 'A1 notation range (e.g., "A1:B10")',
        },
        values: {
          type: 'array',
          items: {
            type: 'array',
            items: {},
          },
          description: '2D array of values to update',
        },
        preserveFormulas: {
          type: 'boolean',
          description: 'Keep existing formulas (default: false)',
          default: false,
        },
      },
      required: ['spreadsheetId', 'sheetName', 'range', 'values'],
    },
    handler: async (args: any) => {
      try {
        const params = UpdateRangeParamsSchema.parse(args);
        const result = await googleSheetsService.updateRange(
          params.spreadsheetId,
          params.sheetName,
          params.range,
          params.values,
          params.preserveFormulas
        );
        
        return {
          success: true,
          updatedCells: result.updatedCells,
          updatedRange: result.updatedRange,
          message: `Range ${params.range} updated successfully`,
        };
      } catch (error) {
        if (error instanceof Error) {
          throw new ValidationError(error.message);
        }
        throw error;
      }
    },
  };
}

/**
 * Smart replace text in cells
 */
function createSmartReplaceTool(googleSheetsService: GoogleSheetsService): Tool {
  return {
    name: 'sheets_smart_replace',
    description: 'Replace text within cells while preserving surrounding content',
    inputSchema: {
      type: 'object',
      properties: {
        spreadsheetId: {
          type: 'string',
          description: 'The spreadsheet ID or full URL',
        },
        sheetName: {
          type: 'string',
          description: 'Sheet name',
        },
        findText: {
          type: 'string',
          description: 'Text to find and replace',
        },
        replaceText: {
          type: 'string',
          description: 'Replacement text',
        },
        range: {
          type: 'string',
          description: 'Limit replacement to specific range (optional)',
        },
        matchCase: {
          type: 'boolean',
          description: 'Case-sensitive matching (default: false)',
          default: false,
        },
        matchEntireCell: {
          type: 'boolean',
          description: 'Match entire cell content (default: false)',
          default: false,
        },
      },
      required: ['spreadsheetId', 'sheetName', 'findText', 'replaceText'],
    },
    handler: async (args: any) => {
      try {
        const params = SmartReplaceParamsSchema.parse(args);
        const result = await googleSheetsService.smartReplace(
          params.spreadsheetId,
          params.sheetName,
          params.findText,
          params.replaceText,
          params.range,
          params.matchCase,
          params.matchEntireCell
        );
        
        return {
          success: true,
          modifiedCells: result.modifiedCells,
          replacements: result.replacements,
          message: `Smart replace completed: ${result.modifiedCells} cells modified`,
        };
      } catch (error) {
        if (error instanceof Error) {
          throw new ValidationError(error.message);
        }
        throw error;
      }
    },
  };
}

/**
 * Append rows to a sheet
 */
function createAppendRowsTool(googleSheetsService: GoogleSheetsService): Tool {
  return {
    name: 'sheets_append_rows',
    description: 'Append new rows to the end of a sheet',
    inputSchema: {
      type: 'object',
      properties: {
        spreadsheetId: {
          type: 'string',
          description: 'The spreadsheet ID or full URL',
        },
        sheetName: {
          type: 'string',
          description: 'Sheet name',
        },
        values: {
          type: 'array',
          items: {
            type: 'array',
            items: {},
          },
          description: '2D array of row values to append',
        },
      },
      required: ['spreadsheetId', 'sheetName', 'values'],
    },
    handler: async (args: any) => {
      try {
        const params = AppendRowsParamsSchema.parse(args);
        const result = await googleSheetsService.appendRows(
          params.spreadsheetId,
          params.sheetName,
          params.values
        );
        
        return {
          success: true,
          appendedRange: result.appendedRange,
          rowsAppended: params.values.length,
          message: `${params.values.length} rows appended successfully`,
        };
      } catch (error) {
        if (error instanceof Error) {
          throw new ValidationError(error.message);
        }
        throw error;
      }
    },
  };
}

/**
 * Create a new sheet
 */
function createCreateSheetTool(googleSheetsService: GoogleSheetsService): Tool {
  return {
    name: 'sheets_create_sheet',
    description: 'Create a new sheet within a spreadsheet',
    inputSchema: {
      type: 'object',
      properties: {
        spreadsheetId: {
          type: 'string',
          description: 'The spreadsheet ID or full URL',
        },
        sheetName: {
          type: 'string',
          description: 'Name for the new sheet',
        },
      },
      required: ['spreadsheetId', 'sheetName'],
    },
    handler: async (args: any) => {
      try {
        const params = CreateSheetParamsSchema.parse(args);
        const result = await googleSheetsService.createSheet(
          params.spreadsheetId,
          params.sheetName
        );
        
        return {
          success: true,
          sheetId: result.sheetId,
          sheetName: params.sheetName,
          message: `Sheet "${params.sheetName}" created successfully`,
        };
      } catch (error) {
        if (error instanceof Error) {
          throw new ValidationError(error.message);
        }
        throw error;
      }
    },
  };
}

/**
 * Delete a sheet
 */
function createDeleteSheetTool(googleSheetsService: GoogleSheetsService): Tool {
  return {
    name: 'sheets_delete_sheet',
    description: 'Delete a sheet from a spreadsheet',
    inputSchema: {
      type: 'object',
      properties: {
        spreadsheetId: {
          type: 'string',
          description: 'The spreadsheet ID or full URL',
        },
        sheetName: {
          type: 'string',
          description: 'Sheet name to delete',
        },
      },
      required: ['spreadsheetId', 'sheetName'],
    },
    handler: async (args: any) => {
      try {
        const params = DeleteSheetParamsSchema.parse(args);
        await googleSheetsService.deleteSheet(
          params.spreadsheetId,
          params.sheetName
        );
        
        return {
          success: true,
          sheetName: params.sheetName,
          message: `Sheet "${params.sheetName}" deleted successfully`,
        };
      } catch (error) {
        if (error instanceof Error) {
          throw new ValidationError(error.message);
        }
        throw error;
      }
    },
  };
}

/**
 * Rename a sheet
 */
function createRenameSheetTool(googleSheetsService: GoogleSheetsService): Tool {
  return {
    name: 'sheets_rename_sheet',
    description: 'Rename a sheet',
    inputSchema: {
      type: 'object',
      properties: {
        spreadsheetId: {
          type: 'string',
          description: 'The spreadsheet ID or full URL',
        },
        oldName: {
          type: 'string',
          description: 'Current sheet name',
        },
        newName: {
          type: 'string',
          description: 'New sheet name',
        },
      },
      required: ['spreadsheetId', 'oldName', 'newName'],
    },
    handler: async (args: any) => {
      try {
        const params = RenameSheetParamsSchema.parse(args);
        await googleSheetsService.renameSheet(
          params.spreadsheetId,
          params.oldName,
          params.newName
        );
        
        return {
          success: true,
          oldName: params.oldName,
          newName: params.newName,
          message: `Sheet renamed from "${params.oldName}" to "${params.newName}"`,
        };
      } catch (error) {
        if (error instanceof Error) {
          throw new ValidationError(error.message);
        }
        throw error;
      }
    },
  };
}

/**
 * Tool for handling authentication
 */
function createAuthTool(authService: AuthService): Tool {
  return {
    name: 'sheets_authenticate',
    description: 'Authenticate with Google to access sheets',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The authentication command to execute',
          enum: ['get_auth_url', 'exchange_code'],
        },
        code: {
          type: 'string',
          description: 'The authorization code to exchange for tokens',
        },
      },
      required: ['command'],
    },
    handler: async (args: any) => {
      try {
        if (args.command === 'get_auth_url') {
          const authUrl = authService.getAuthUrl();
          return {
            authUrl,
            message: 'Please visit this URL to authenticate',
          };
        } else if (args.command === 'exchange_code') {
          if (!args.code) {
            throw new ValidationError('Missing required parameter: code');
          }
          await authService.exchangeCodeForTokens(args.code);
          return {
            success: true,
            message: 'Authentication successful',
          };
        } else {
          throw new ValidationError(`Invalid command: ${args.command}`);
        }
      } catch (error) {
        if (error instanceof Error) {
          throw new ValidationError(error.message);
        }
        throw error;
      }
    },
  };
}

