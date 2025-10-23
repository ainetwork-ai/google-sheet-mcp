import { GoogleSheetsMCPError, ValidationError } from '../types/errors.js';

/**
 * Global error handler for the MCP server
 */
export class ErrorHandler {
  /**
   * Handle and format errors for MCP responses
   */
  static handleError(error: unknown): {
    content: Array<{ type: string; text: string }>;
    isError: boolean;
  } {
    let errorMessage: string;
    let isError = true;

    if (error instanceof GoogleSheetsMCPError) {
      errorMessage = error.message;
      
      // Add helpful context for common errors
      if (error instanceof ValidationError) {
        errorMessage = `Validation Error: ${errorMessage}`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = 'An unknown error occurred';
    }

    // Log error for debugging (in production, use proper logging)
    console.error('MCP Server Error:', error);

    return {
      content: [
        {
          type: 'text',
          text: errorMessage,
        },
      ],
      isError,
    };
  }

  /**
   * Validate required parameters
   */
  static validateRequiredParams(params: any, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (params[field] === undefined || params[field] === null) {
        throw new ValidationError(`Missing required parameter: ${field}`);
      }
    }
  }

  /**
   * Validate parameter types
   */
  static validateParamTypes(params: any, typeMap: Record<string, string>): void {
    for (const [field, expectedType] of Object.entries(typeMap)) {
      if (params[field] !== undefined) {
        const actualType = typeof params[field];
        if (actualType !== expectedType) {
          throw new ValidationError(
            `Parameter ${field} should be ${expectedType}, got ${actualType}`
          );
        }
      }
    }
  }

  /**
   * Sanitize error messages for user display
   */
  static sanitizeErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      // Remove sensitive information from error messages
      let message = error.message;
      
      // Remove potential API keys or tokens
      message = message.replace(/[A-Za-z0-9]{20,}/g, '[REDACTED]');
      
      // Remove file paths that might contain sensitive info
      message = message.replace(/\/[^\s]+\/[^\s]+/g, '[PATH]');
      
      return message;
    }
    
    return 'An error occurred';
  }

  /**
   * Create user-friendly error messages
   */
  static createUserFriendlyMessage(error: unknown): string {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('quota') || message.includes('rate limit')) {
        return 'API quota exceeded. Please try again later or contact support.';
      }
      
      if (message.includes('not found')) {
        return 'The requested resource was not found. Please check your parameters.';
      }
      
      if (message.includes('permission') || message.includes('unauthorized')) {
        return 'Permission denied. Please check your authentication and permissions.';
      }
      
      if (message.includes('invalid')) {
        return 'Invalid parameters provided. Please check your input.';
      }
      
      if (message.includes('network') || message.includes('timeout')) {
        return 'Network error occurred. Please check your connection and try again.';
      }
    }
    
    return 'An unexpected error occurred. Please try again.';
  }
}

