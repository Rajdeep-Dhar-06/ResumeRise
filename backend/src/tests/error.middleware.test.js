import { test } from 'node:test';
import assert from 'node:assert';
import { errorMiddleware } from '../middlewares/error.middleware.js';
import BaseError, { NotFoundError, BadRequestError } from '../utils/errorHandler.js';

test('Error Middleware - handles standard Error by defaulting to 500 status code', () => {
  const err = new Error('Test standard error');
  const req = {};
  let responseStatus = null;
  let responseData = null;

  const res = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  errorMiddleware(err, req, res, () => {});

  assert.strictEqual(responseStatus, 500);
  assert.strictEqual(responseData.error, 'Test standard error');
});

test('Error Middleware - handles BaseError by using its status code', () => {
  const err = new BaseError('BadRequest', 400, true, 'Bad client request');
  const req = {};
  let responseStatus = null;
  let responseData = null;

  const res = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  errorMiddleware(err, req, res, () => {});

  assert.strictEqual(responseStatus, 400);
  assert.strictEqual(responseData.error, 'Bad client request');
});

test('Error Middleware - maps Mongoose ValidationError to 400 with details', () => {
  const err = {
    name: 'ValidationError',
    errors: {
      email: {
        path: 'email',
        message: 'Email is required'
      }
    }
  };
  const req = {};
  let responseStatus = null;
  let responseData = null;

  const res = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  errorMiddleware(err, req, res, () => {});

  assert.strictEqual(responseStatus, 400);
  assert.strictEqual(responseData.error, 'Validation Error');
  assert.deepStrictEqual(responseData.details, [
    { field: 'email', message: 'Email is required' }
  ]);
});

test('Error Middleware - maps JWT TokenExpiredError to 401', () => {
  const err = {
    name: 'TokenExpiredError',
    message: 'jwt expired'
  };
  const req = {};
  let responseStatus = null;
  let responseData = null;

  const res = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  errorMiddleware(err, req, res, () => {});

  assert.strictEqual(responseStatus, 401);
  assert.strictEqual(responseData.error, 'Your session has expired. Please log in again.');
});

test('Error Middleware - handles NotFoundError using status code 404', () => {
  const err = new NotFoundError('User resource not found');
  const req = {};
  let responseStatus = null;
  let responseData = null;

  const res = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  errorMiddleware(err, req, res, () => {});

  assert.strictEqual(responseStatus, 404);
  assert.strictEqual(responseData.error, 'User resource not found');
});

test('Error Middleware - handles BadRequestError with custom details', () => {
  const customDetails = [{ field: 'password', message: 'Too simple password' }];
  const err = new BadRequestError('Validation failed', customDetails);
  const req = {};
  let responseStatus = null;
  let responseData = null;

  const res = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  errorMiddleware(err, req, res, () => {});

  assert.strictEqual(responseStatus, 400);
  assert.strictEqual(responseData.error, 'Validation failed');
  assert.deepStrictEqual(responseData.details, customDetails);
});
