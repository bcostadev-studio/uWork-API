export abstract class BaseError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorKey: string;

  readonly isOperational: boolean = true;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends BaseError {
  readonly statusCode = 404;
  readonly errorKey = 'errors.not_found';

  constructor(message: string = 'errors.not_found') {
    super(message);
  }
}

export class ValidationError extends BaseError {
  readonly statusCode = 422;
  readonly errorKey = 'errors.validation_error';
  readonly details: unknown;

  constructor(details: unknown, message: string = 'errors.validation_error') {
    super(message);
    this.details = details;
  }
}

export class BadRequestError extends BaseError {
  readonly statusCode = 400;
  readonly errorKey = 'errors.bad_request';

  constructor(message: string = 'errors.bad_request') {
    super(message);
  }
}

export class UpstreamUnavailableError extends BaseError {
  readonly statusCode = 502;
  readonly errorKey = 'errors.upstream_unavailable';

  constructor(message: string = 'errors.upstream_unavailable') {
    super(message);
  }
}

export class TooManyRequestsError extends BaseError {
  readonly statusCode = 429;
  readonly errorKey = 'errors.too_many_requests';

  constructor(message: string = 'errors.too_many_requests') {
    super(message);
  }
}
