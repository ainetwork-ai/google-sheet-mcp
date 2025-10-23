# Google Sheets MCP Server - API Reference

## Overview

The Google Sheets MCP Server provides a comprehensive set of tools for interacting with Google Sheets through the Model Context Protocol. This document describes all available tools, their parameters, and usage examples.

## Authentication

The server supports two authentication methods:

### OAuth 2.0 (Recommended for personal use)
```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback
```

### Service Account (Recommended for automation)
```bash
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./path/to/service-account-key.json
```

## Tools Reference

### Read Tools

#### `sheets_list_files`
List all spreadsheet files accessible to the authenticated user.

**Parameters:**
- `query` (optional, string): Filter files by name

**Returns:**
```json
{
  "files": [
    {
      "id": "1A2B3C4D5E6F",
      "name": "My Spreadsheet",
      "modifiedTime": "2024-01-15T10:30:00Z",
      "webViewLink": "https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F/edit",
      "owners": ["user@example.com"]
    }
  ],
  "totalCount": 1
}
```

**Example:**
```typescript
const result = await use_mcp_tool("sheets_list_files", {
  query: "sales"
});
```

---

#### `sheets_list_sheets`
List all sheets in a specific spreadsheet.

**Parameters:**
- `spreadsheetId` (required, string): The spreadsheet ID or full URL

**Returns:**
```json
{
  "sheets": [
    {
      "sheetId": 0,
      "title": "Sheet1",
      "index": 0,
      "sheetType": "GRID",
      "rowCount": 1000,
      "columnCount": 26
    }
  ],
  "totalCount": 1
}
```

**Example:**
```typescript
const result = await use_mcp_tool("sheets_list_sheets", {
  spreadsheetId: "1A2B3C4D5E6F"
});
```

---

#### `sheets_read_data`
Read all data from a specific sheet.

**Parameters:**
- `spreadsheetId` (required, string): The spreadsheet ID or full URL
- `sheetName` (optional, string): Sheet name (defaults to first sheet)
- `includeFormats` (optional, boolean): Include cell formatting information

**Returns:**
```json
{
  "data": [
    ["Name", "Age", "City"],
    ["John", 30, "Seoul"],
    ["Jane", 25, "Busan"]
  ],
  "rowCount": 3,
  "columnCount": 3,
  "sheetName": "Sheet1"
}
```

**Example:**
```typescript
const result = await use_mcp_tool("sheets_read_data", {
  spreadsheetId: "1A2B3C4D5E6F",
  sheetName: "Customers",
  includeFormats: false
});
```

---

#### `sheets_read_range`
Read data from a specific range.

**Parameters:**
- `spreadsheetId` (required, string): The spreadsheet ID or full URL
- `sheetName` (required, string): Sheet name
- `range` (required, string): A1 notation range (e.g., "A1:D10")

**Returns:**
```json
{
  "data": [
    ["Name", "Age"],
    ["John", 30],
    ["Jane", 25]
  ],
  "range": "A1:B3",
  "rowCount": 3,
  "columnCount": 2,
  "sheetName": "Customers"
}
```

**Example:**
```typescript
const result = await use_mcp_tool("sheets_read_range", {
  spreadsheetId: "1A2B3C4D5E6F",
  sheetName: "Customers",
  range: "A1:B10"
});
```

---

#### `sheets_search`
Search for cells containing specific text.

**Parameters:**
- `spreadsheetId` (required, string): The spreadsheet ID or full URL
- `sheetName` (required, string): Sheet name
- `searchText` (required, string): Text to search for
- `searchColumns` (optional, array): Limit search to specific columns (e.g., ["A", "B"])

**Returns:**
```json
{
  "results": [
    {
      "cell": "A2",
      "value": "John",
      "row": 2,
      "column": 1,
      "sheetName": "Customers"
    }
  ],
  "totalMatches": 1,
  "searchText": "John",
  "sheetName": "Customers",
  "searchColumns": null
}
```

**Example:**
```typescript
const result = await use_mcp_tool("sheets_search", {
  spreadsheetId: "1A2B3C4D5E6F",
  sheetName: "Customers",
  searchText: "Seoul",
  searchColumns: ["C"]
});
```

### Update Tools

#### `sheets_update_cell`
Update a single cell value.

**Parameters:**
- `spreadsheetId` (required, string): The spreadsheet ID or full URL
- `sheetName` (required, string): Sheet name
- `cell` (required, string): Cell reference (e.g., "B5")
- `value` (required, any): New value for the cell

**Returns:**
```json
{
  "success": true,
  "updatedCells": 1,
  "updatedRange": "Sheet1!B5",
  "message": "Cell B5 updated successfully"
}
```

**Example:**
```typescript
const result = await use_mcp_tool("sheets_update_cell", {
  spreadsheetId: "1A2B3C4D5E6F",
  sheetName: "Inventory",
  cell: "B5",
  value: "In Stock"
});
```

---

#### `sheets_update_range`
Update multiple cells in a range.

**Parameters:**
- `spreadsheetId` (required, string): The spreadsheet ID or full URL
- `sheetName` (required, string): Sheet name
- `range` (required, string): A1 notation range (e.g., "A1:B10")
- `values` (required, array): 2D array of values to update
- `preserveFormulas` (optional, boolean): Keep existing formulas

**Returns:**
```json
{
  "success": true,
  "updatedCells": 6,
  "updatedRange": "Sheet1!A2:C4",
  "message": "Range A2:C4 updated successfully"
}
```

**Example:**
```typescript
const result = await use_mcp_tool("sheets_update_range", {
  spreadsheetId: "1A2B3C4D5E6F",
  sheetName: "Products",
  range: "A2:C4",
  values: [
    ["Product A", 100, "$50"],
    ["Product B", 200, "$75"],
    ["Product C", 150, "$60"]
  ],
  preserveFormulas: false
});
```

---

#### `sheets_smart_replace`
Replace text within cells while preserving surrounding content.

**Parameters:**
- `spreadsheetId` (required, string): The spreadsheet ID or full URL
- `sheetName` (required, string): Sheet name
- `findText` (required, string): Text to find and replace
- `replaceText` (required, string): Replacement text
- `range` (optional, string): Limit replacement to specific range
- `matchCase` (optional, boolean): Case-sensitive matching
- `matchEntireCell` (optional, boolean): Match entire cell content

**Returns:**
```json
{
  "success": true,
  "modifiedCells": 3,
  "replacements": [
    {
      "cell": "A2",
      "originalValue": "Contact: Seoul Office, 123-4567",
      "newValue": "Contact: Seoul City Office, 123-4567"
    }
  ],
  "message": "Smart replace completed: 3 cells modified"
}
```

**Example:**
```typescript
const result = await use_mcp_tool("sheets_smart_replace", {
  spreadsheetId: "1A2B3C4D5E6F",
  sheetName: "Customers",
  findText: "Seoul",
  replaceText: "Seoul City",
  matchCase: false
});
```

---

#### `sheets_append_rows`
Append new rows to the end of a sheet.

**Parameters:**
- `spreadsheetId` (required, string): The spreadsheet ID or full URL
- `sheetName` (required, string): Sheet name
- `values` (required, array): 2D array of row values to append

**Returns:**
```json
{
  "success": true,
  "appendedRange": "Sheet1!A4:C6",
  "rowsAppended": 3,
  "message": "3 rows appended successfully"
}
```

**Example:**
```typescript
const result = await use_mcp_tool("sheets_append_rows", {
  spreadsheetId: "1A2B3C4D5E6F",
  sheetName: "Orders",
  values: [
    ["Order1", "2024-01-15", "$100"],
    ["Order2", "2024-01-16", "$150"],
    ["Order3", "2024-01-17", "$200"]
  ]
});
```

### Management Tools

#### `sheets_create_sheet`
Create a new sheet within a spreadsheet.

**Parameters:**
- `spreadsheetId` (required, string): The spreadsheet ID or full URL
- `sheetName` (required, string): Name for the new sheet

**Returns:**
```json
{
  "success": true,
  "sheetId": 1234567890,
  "sheetName": "Q4 Report",
  "message": "Sheet \"Q4 Report\" created successfully"
}
```

**Example:**
```typescript
const result = await use_mcp_tool("sheets_create_sheet", {
  spreadsheetId: "1A2B3C4D5E6F",
  sheetName: "Q4 Report"
});
```

---

#### `sheets_delete_sheet`
Delete a sheet from a spreadsheet.

**Parameters:**
- `spreadsheetId` (required, string): The spreadsheet ID or full URL
- `sheetName` (required, string): Sheet name to delete

**Returns:**
```json
{
  "success": true,
  "sheetName": "Old Sheet",
  "message": "Sheet \"Old Sheet\" deleted successfully"
}
```

**Example:**
```typescript
const result = await use_mcp_tool("sheets_delete_sheet", {
  spreadsheetId: "1A2B3C4D5E6F",
  sheetName: "Old Sheet"
});
```

---

#### `sheets_rename_sheet`
Rename a sheet.

**Parameters:**
- `spreadsheetId` (required, string): The spreadsheet ID or full URL
- `oldName` (required, string): Current sheet name
- `newName` (required, string): New sheet name

**Returns:**
```json
{
  "success": true,
  "oldName": "Sheet1",
  "newName": "January Sales",
  "message": "Sheet renamed from \"Sheet1\" to \"January Sales\""
}
```

**Example:**
```typescript
const result = await use_mcp_tool("sheets_rename_sheet", {
  spreadsheetId: "1A2B3C4D5E6F",
  oldName: "Sheet1",
  newName: "January Sales"
});
```

## Error Handling

The server provides comprehensive error handling with user-friendly messages:

### Common Error Types

- **ValidationError**: Invalid parameters or data format
- **AuthenticationError**: Authentication failed or expired
- **SpreadsheetNotFoundError**: Spreadsheet not found or inaccessible
- **SheetNotFoundError**: Sheet not found in spreadsheet
- **InvalidRangeError**: Invalid range format
- **APIQuotaExceededError**: Google API quota exceeded

### Error Response Format

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error message here"
    }
  ],
  "isError": true
}
```

## Performance Considerations

- **Rate Limiting**: 60 requests per minute by default
- **Retry Logic**: Automatic retry with exponential backoff for transient errors
- **Caching**: Optional caching for frequently accessed data
- **Batch Operations**: Use range updates for multiple cells instead of individual cell updates

## Best Practices

1. **Use appropriate tools**: Choose the right tool for your use case
2. **Batch operations**: Update multiple cells at once when possible
3. **Handle errors**: Always check for errors in responses
4. **Respect rate limits**: Implement appropriate delays between requests
5. **Validate input**: Ensure parameters are correct before making requests

## Examples

### Complete Workflow Example

```typescript
// 1. List available spreadsheets
const files = await use_mcp_tool("sheets_list_files", {});

// 2. Read data from a specific sheet
const data = await use_mcp_tool("sheets_read_data", {
  spreadsheetId: files.files[0].id,
  sheetName: "Sales"
});

// 3. Search for specific values
const results = await use_mcp_tool("sheets_search", {
  spreadsheetId: files.files[0].id,
  sheetName: "Sales",
  searchText: "Pending"
});

// 4. Update cells based on search results
for (const result of results.results) {
  await use_mcp_tool("sheets_update_cell", {
    spreadsheetId: files.files[0].id,
    sheetName: "Sales",
    cell: result.cell,
    value: "Completed"
  });
}

// 5. Smart replace for bulk updates
await use_mcp_tool("sheets_smart_replace", {
  spreadsheetId: files.files[0].id,
  sheetName: "Sales",
  findText: "Old Company",
  replaceText: "New Company"
});
```

