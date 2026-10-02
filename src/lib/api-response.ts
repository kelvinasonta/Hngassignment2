import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T = any> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, any> | null;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

export const ApiErrorCode = {
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INVALID_COUPON: 'INVALID_COUPON',
  RATE_LIMITED: 'RATE_LIMITED',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ApiErrorCodeType = typeof ApiErrorCode[keyof typeof ApiErrorCode];

/**
 * Creates a standardized JSON success response
 */
export function apiSuccess<T>(data: T, message: string = 'Operation completed successfully', status: number = 200) {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    message,
    data,
  };
  return NextResponse.json(payload, { status });
}

/**
 * Creates a standardized JSON error response
 */
export function apiError(
  message: string = 'Something went wrong',
  code: ApiErrorCodeType | string = ApiErrorCode.INTERNAL_ERROR,
  status: number = 500,
  errors: Record<string, any> | null = null
) {
  const payload: ApiErrorResponse = {
    success: false,
    message,
    code,
    ...(errors ? { errors } : {}),
  };
  return NextResponse.json(payload, { status });
}
