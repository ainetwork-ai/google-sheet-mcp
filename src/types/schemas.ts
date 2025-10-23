import { z } from 'zod';

/**
 * Common schemas for Google Sheets operations
 */

// Spreadsheet ID validation (can be ID or URL)
export const SpreadsheetIdSchema = z.string().min(1);

// Sheet name validation
export const SheetNameSchema = z.string().min(1);

// Range validation (A1 notation)
export const RangeSchema = z.string().regex(/^[A-Z]+[0-9]+:[A-Z]+[0-9]+$/);

// Cell reference validation
export const CellReferenceSchema = z.string().regex(/^[A-Z]+[0-9]+$/);

// 2D array of values
export const ValuesArraySchema = z.array(z.array(z.any()));

// Tool parameter schemas
export const ListFilesParamsSchema = z.object({
  query: z.string().optional(),
});

export const ReadDataParamsSchema = z.object({
  spreadsheetId: SpreadsheetIdSchema,
  sheetName: SheetNameSchema.optional(),
  includeFormats: z.boolean().optional(),
});

export const ReadRangeParamsSchema = z.object({
  spreadsheetId: SpreadsheetIdSchema,
  sheetName: SheetNameSchema,
  range: RangeSchema,
});

export const SearchParamsSchema = z.object({
  spreadsheetId: SpreadsheetIdSchema,
  sheetName: SheetNameSchema,
  searchText: z.string().min(1),
  searchColumns: z.array(z.string()).optional(),
});

export const UpdateCellParamsSchema = z.object({
  spreadsheetId: SpreadsheetIdSchema,
  sheetName: SheetNameSchema,
  cell: CellReferenceSchema,
  value: z.any(),
});

export const UpdateRangeParamsSchema = z.object({
  spreadsheetId: SpreadsheetIdSchema,
  sheetName: SheetNameSchema,
  range: RangeSchema,
  values: ValuesArraySchema,
  preserveFormulas: z.boolean().optional(),
});

export const SmartReplaceParamsSchema = z.object({
  spreadsheetId: SpreadsheetIdSchema,
  sheetName: SheetNameSchema,
  findText: z.string().min(1),
  replaceText: z.string(),
  range: RangeSchema.optional(),
  matchCase: z.boolean().optional(),
  matchEntireCell: z.boolean().optional(),
});

export const AppendRowsParamsSchema = z.object({
  spreadsheetId: SpreadsheetIdSchema,
  sheetName: SheetNameSchema,
  values: ValuesArraySchema,
});

export const CreateSheetParamsSchema = z.object({
  spreadsheetId: SpreadsheetIdSchema,
  sheetName: SheetNameSchema,
});

export const DeleteSheetParamsSchema = z.object({
  spreadsheetId: SpreadsheetIdSchema,
  sheetName: SheetNameSchema,
});

export const RenameSheetParamsSchema = z.object({
  spreadsheetId: SpreadsheetIdSchema,
  oldName: SheetNameSchema,
  newName: SheetNameSchema,
});

// Type exports
export type ListFilesParams = z.infer<typeof ListFilesParamsSchema>;
export type ReadDataParams = z.infer<typeof ReadDataParamsSchema>;
export type ReadRangeParams = z.infer<typeof ReadRangeParamsSchema>;
export type SearchParams = z.infer<typeof SearchParamsSchema>;
export type UpdateCellParams = z.infer<typeof UpdateCellParamsSchema>;
export type UpdateRangeParams = z.infer<typeof UpdateRangeParamsSchema>;
export type SmartReplaceParams = z.infer<typeof SmartReplaceParamsSchema>;
export type AppendRowsParams = z.infer<typeof AppendRowsParamsSchema>;
export type CreateSheetParams = z.infer<typeof CreateSheetParamsSchema>;
export type DeleteSheetParams = z.infer<typeof DeleteSheetParamsSchema>;
export type RenameSheetParams = z.infer<typeof RenameSheetParamsSchema>;

