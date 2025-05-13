import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiError } from './commonError';

export function successResponse(data, message = 'Success', status = 200, pagination = null) {
  const response = { success: true, message, data };
  if (pagination) {
    response.pagination = pagination;
  }
  return NextResponse.json(response, { status });
}

export function errorResponse(error, status = 500) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        message: 'Validation Failed',
        errors: error.errors.map(e => ({
          field: e.path[0],
          message: e.message,
        })),
      },
      { status: 400 }
    );
  }

  if (error?.name === 'ValidationError') {
    const errors = {};
    for (const field in error.errors) {
      errors[field] = error.errors[field].message;
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Validation Error',
        errors,
      },
      { status: 422 }
    );
  }

  const customStatus = error instanceof ApiError ? error.status : status;

  return NextResponse.json(
    {
      success: false,
      message: error instanceof ApiError ? error.message : 'Something went wrong',
    },
    { status: customStatus }
  );
}

export function withApiHandler(handler) {
  return async (req, context = {}) => {
    try {
      return await handler(req, context);
    } catch (err) {
      console.error('API Error:', err);
      return errorResponse(err);
    }
  };
}
