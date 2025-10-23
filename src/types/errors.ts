/**
 * Google Sheets MCP Server Error Types
 */

export class GoogleSheetsMCPError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'GoogleSheetsMCPError';
  }
}

export class AuthenticationError extends GoogleSheetsMCPError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class SpreadsheetNotFoundError extends GoogleSheetsMCPError {
  constructor(spreadsheetId: string) {
    super(`Spreadsheet not found: ${spreadsheetId}`, 'SPREADSHEET_NOT_FOUND', 404);
    this.name = 'SpreadsheetNotFoundError';
  }
}

export class SheetNotFoundError extends GoogleSheetsMCPError {
  constructor(sheetName: string) {
    super(`Sheet not found: ${sheetName}`, 'SHEET_NOT_FOUND', 404);
    this.name = 'SheetNotFoundError';
  }
}

export class InvalidRangeError extends GoogleSheetsMCPError {
  constructor(range: string) {
    super(`Invalid range format: ${range}`, 'INVALID_RANGE', 400);
    this.name = 'InvalidRangeError';
  }
}

export class APIQuotaExceededError extends GoogleSheetsMCPError {
  constructor() {
    super('Google API quota exceeded', 'API_QUOTA_EXCEEDED', 429);
    this.name = 'APIQuotaExceededError';
  }
}

export class ValidationError extends GoogleSheetsMCPError {
  constructor(message: string) {
    super(`Validation error: ${message}`, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class RetryableError extends GoogleSheetsMCPError {
  constructor(message: string, public readonly retryAfter?: number) {
    super(message, 'RETRYABLE_ERROR', 503);
    this.name = 'RetryableError';
  }
}

