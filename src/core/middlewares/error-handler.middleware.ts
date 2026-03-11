import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { BaseError, ValidationError } from '../errors/base-error';

interface ErrorResponse {
  status: 'error';
  statusCode: number;
  message: string;
  details?: unknown;
}

const buildZodErrorResponse = (
  err: ZodError,
  req: Request,
  statusCode: number
): ErrorResponse => ({
  status: 'error',
  statusCode,
  message: req.t('errors.validation_error'),
  details: err.flatten().fieldErrors,
});

const buildBaseErrorResponse = (
  err: BaseError,
  req: Request
): ErrorResponse => ({
  status: 'error',
  statusCode: err.statusCode,
  message: req.t(err.message),
  ...(err instanceof ValidationError ? { details: err.details } : {}),
});

const buildGenericErrorResponse = (req: Request): ErrorResponse => ({
  status: 'error',
  statusCode: 500,
  message: req.t('errors.internal_server_error'),
});

const resolveErrorResponse = (err: unknown, req: Request): ErrorResponse =>
  err instanceof ZodError
    ? buildZodErrorResponse(err, req, 422)
    : err instanceof BaseError
      ? buildBaseErrorResponse(err, req)
      : buildGenericErrorResponse(req);

export const errorHandlerMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const errorResponse = resolveErrorResponse(err, req);

  const isUnexpected =
    !(err instanceof ZodError) &&
    !(err instanceof BaseError);

  if (isUnexpected) {
    console.error('[UnhandledError]', err);
  }

  res.status(errorResponse.statusCode).json(errorResponse);
};
