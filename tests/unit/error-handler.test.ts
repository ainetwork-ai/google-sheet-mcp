import { ErrorHandler } from '../src/utils/error-handler.js';
import { ValidationError, GoogleSheetsMCPError } from '../src/types/errors.js';

describe('ErrorHandler', () => {
  describe('handleError', () => {
    it('should handle GoogleSheetsMCPError correctly', () => {
      const error = new ValidationError('Test validation error');
      const result = ErrorHandler.handleError(error);
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('Validation Error: Test validation error');
    });

    it('should handle generic Error correctly', () => {
      const error = new Error('Generic error');
      const result = ErrorHandler.handleError(error);
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('Generic error');
    });

    it('should handle unknown error types', () => {
      const result = ErrorHandler.handleError('string error');
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('An unknown error occurred');
    });
  });

  describe('validateRequiredParams', () => {
    it('should pass validation for all required params', () => {
      const params = { name: 'test', id: '123' };
      expect(() => ErrorHandler.validateRequiredParams(params, ['name', 'id']))
        .not.toThrow();
    });

    it('should throw ValidationError for missing params', () => {
      const params = { name: 'test' };
      expect(() => ErrorHandler.validateRequiredParams(params, ['name', 'id']))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for null params', () => {
      const params = { name: 'test', id: null };
      expect(() => ErrorHandler.validateRequiredParams(params, ['name', 'id']))
        .toThrow(ValidationError);
    });
  });

  describe('validateParamTypes', () => {
    it('should pass validation for correct types', () => {
      const params = { name: 'test', count: 5 };
      expect(() => ErrorHandler.validateParamTypes(params, { name: 'string', count: 'number' }))
        .not.toThrow();
    });

    it('should throw ValidationError for incorrect types', () => {
      const params = { name: 123 };
      expect(() => ErrorHandler.validateParamTypes(params, { name: 'string' }))
        .toThrow(ValidationError);
    });

    it('should ignore undefined params', () => {
      const params = { name: 'test' };
      expect(() => ErrorHandler.validateParamTypes(params, { name: 'string', count: 'number' }))
        .not.toThrow();
    });
  });

  describe('sanitizeErrorMessage', () => {
    it('should redact long alphanumeric strings', () => {
      const error = new Error('API key: 123456789012345678901234567890');
      const result = ErrorHandler.sanitizeErrorMessage(error);
      
      expect(result).toContain('[REDACTED]');
      expect(result).not.toContain('123456789012345678901234567890');
    });

    it('should redact file paths', () => {
      const error = new Error('File not found: /home/user/secret/file.txt');
      const result = ErrorHandler.sanitizeErrorMessage(error);
      
      expect(result).toContain('[PATH]');
      expect(result).not.toContain('/home/user/secret/file.txt');
    });

    it('should handle non-Error objects', () => {
      const result = ErrorHandler.sanitizeErrorMessage('string error');
      expect(result).toBe('An error occurred');
    });
  });

  describe('createUserFriendlyMessage', () => {
    it('should create friendly message for quota errors', () => {
      const error = new Error('quota exceeded');
      const result = ErrorHandler.createUserFriendlyMessage(error);
      
      expect(result).toBe('API quota exceeded. Please try again later or contact support.');
    });

    it('should create friendly message for not found errors', () => {
      const error = new Error('not found');
      const result = ErrorHandler.createUserFriendlyMessage(error);
      
      expect(result).toBe('The requested resource was not found. Please check your parameters.');
    });

    it('should create friendly message for permission errors', () => {
      const error = new Error('permission denied');
      const result = ErrorHandler.createUserFriendlyMessage(error);
      
      expect(result).toBe('Permission denied. Please check your authentication and permissions.');
    });

    it('should create friendly message for invalid errors', () => {
      const error = new Error('invalid parameter');
      const result = ErrorHandler.createUserFriendlyMessage(error);
      
      expect(result).toBe('Invalid parameters provided. Please check your input.');
    });

    it('should create friendly message for network errors', () => {
      const error = new Error('network timeout');
      const result = ErrorHandler.createUserFriendlyMessage(error);
      
      expect(result).toBe('Network error occurred. Please check your connection and try again.');
    });

    it('should create generic message for unknown errors', () => {
      const error = new Error('unknown error');
      const result = ErrorHandler.createUserFriendlyMessage(error);
      
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });
  });
});

