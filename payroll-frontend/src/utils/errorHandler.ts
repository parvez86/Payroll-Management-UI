/**
 * Error Handling Utilities for Backend Integration
 * Following industry best practices for API error management
 */

import { AxiosError } from 'axios';

export interface APIError {
  code: string;
  message: string;
  details?: string[];
  timestamp?: string;
  statusCode?: number;
}

export interface APIValidationError {
  field: string;
  message: string;
  value?: any;
}

// Error codes from API documentation
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  EMPLOYEE_NOT_FOUND: 'EMPLOYEE_NOT_FOUND',
  GRADE_LIMIT_EXCEEDED: 'GRADE_LIMIT_EXCEEDED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  DUPLICATE_EMPLOYEE_ID: 'DUPLICATE_EMPLOYEE_ID',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

// User-friendly error messages
export const ERROR_MESSAGES = {
  [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again',
  [ERROR_CODES.EMPLOYEE_NOT_FOUND]: 'Employee not found',
  [ERROR_CODES.GRADE_LIMIT_EXCEEDED]: 'Grade distribution limit has been reached',
  [ERROR_CODES.INSUFFICIENT_BALANCE]: 'Insufficient company account balance',
  [ERROR_CODES.DUPLICATE_EMPLOYEE_ID]: 'Employee ID already exists',
  [ERROR_CODES.UNAUTHORIZED]: 'Please log in to continue',
  [ERROR_CODES.FORBIDDEN]: 'You do not have permission to perform this action',
  [ERROR_CODES.NETWORK_ERROR]: 'Network error - please check your connection',
  [ERROR_CODES.TIMEOUT_ERROR]: 'Request timeout - please try again',
  [ERROR_CODES.SERVER_ERROR]: 'Server error - please try again later',
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred'
} as const;

/**
 * Parse API error response and return standardized error object
 */
export function parseAPIError(error: AxiosError): APIError {
  // Network or timeout errors
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return {
        code: ERROR_CODES.TIMEOUT_ERROR,
        message: ERROR_MESSAGES[ERROR_CODES.TIMEOUT_ERROR],
        statusCode: 0
      };
    }
    if (error.code === 'ERR_NETWORK') {
      return {
        code: ERROR_CODES.NETWORK_ERROR,
        message: ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
        statusCode: 0
      };
    }
    return {
      code: ERROR_CODES.NETWORK_ERROR,
      message: error.message || ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
      statusCode: 0
    };
  }

  const { status, data } = error.response;

  // Handle structured API error responses
  if (data && typeof data === 'object' && 'success' in data && !data.success) {
    const apiErrorData = data as any; // Type assertion for API error structure
    return {
      code: apiErrorData.data?.errorCode || mapStatusToErrorCode(status),
      message: apiErrorData.message || ERROR_MESSAGES[mapStatusToErrorCode(status)],
      details: apiErrorData.data?.details || [],
      timestamp: apiErrorData.data?.timestamp,
      statusCode: status
    };
  }

  // Handle HTTP status codes
  return {
    code: mapStatusToErrorCode(status),
    message: ERROR_MESSAGES[mapStatusToErrorCode(status)],
    statusCode: status
  };
}

/**
 * Map HTTP status codes to error codes
 */
function mapStatusToErrorCode(status: number): keyof typeof ERROR_CODES {
  switch (status) {
    case 400:
      return ERROR_CODES.VALIDATION_ERROR;
    case 401:
      return ERROR_CODES.UNAUTHORIZED;
    case 403:
      return ERROR_CODES.FORBIDDEN;
    case 404:
      return ERROR_CODES.EMPLOYEE_NOT_FOUND;
    case 409:
      return ERROR_CODES.DUPLICATE_EMPLOYEE_ID;
    case 422:
      return ERROR_CODES.GRADE_LIMIT_EXCEEDED;
    case 500:
    case 502:
    case 503:
    case 504:
      return ERROR_CODES.SERVER_ERROR;
    default:
      return ERROR_CODES.UNKNOWN_ERROR;
  }
}

/**
 * Extract validation errors from API response
 */
export function extractValidationErrors(error: APIError): APIValidationError[] {
  if (error.code !== ERROR_CODES.VALIDATION_ERROR || !error.details) {
    return [];
  }

  return error.details.map((detail, index) => ({
    field: `field_${index}`,
    message: detail,
    value: undefined
  }));
}

/**
 * Check if error indicates insufficient funds
 */
export function isInsufficientFundsError(error: APIError): boolean {
  return error.code === ERROR_CODES.INSUFFICIENT_BALANCE;
}

/**
 * Check if error indicates authentication issue
 */
export function isAuthError(error: APIError): boolean {
  return error.code === ERROR_CODES.UNAUTHORIZED || error.code === ERROR_CODES.FORBIDDEN;
}

/**
 * Check if error indicates validation issue
 */
export function isValidationError(error: APIError): boolean {
  return error.code === ERROR_CODES.VALIDATION_ERROR;
}

/**
 * Check if error indicates network issue
 */
export function isNetworkError(error: APIError): boolean {
  return error.code === ERROR_CODES.NETWORK_ERROR || error.code === ERROR_CODES.TIMEOUT_ERROR;
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: APIError, includeDetails: boolean = false): string {
  let message = error.message;
  
  if (includeDetails && error.details && error.details.length > 0) {
    message += '\n\nDetails:\n' + error.details.map(detail => `• ${detail}`).join('\n');
  }
  
  return message;
}

/**
 * Log error for debugging (development only)
 */
export function logError(error: APIError, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔥 API Error${context ? ` (${context})` : ''}`);
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Status:', error.statusCode);
    if (error.details?.length) {
      console.error('Details:', error.details);
    }
    if (error.timestamp) {
      console.error('Timestamp:', error.timestamp);
    }
    console.groupEnd();
  }
}

/**
 * Create standardized error response for UI components
 */
export function createErrorResponse(error: AxiosError, context?: string): {
  error: APIError;
  userMessage: string;
  showDetails: boolean;
  retryable: boolean;
} {
  const parsedError = parseAPIError(error);
  logError(parsedError, context);

  return {
    error: parsedError,
    userMessage: formatErrorMessage(parsedError),
    showDetails: isValidationError(parsedError),
    retryable: isNetworkError(parsedError) || (parsedError.statusCode !== undefined && parsedError.statusCode >= 500)
  };
}