export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  if (err.statusCode) {
    statusCode = err.statusCode;
  } else if (err.status) {
    statusCode = err.status;
  }

  let message = err.message || 'Internal server error';

  // Format Express Validator array messages exactly like class-validator did
  if (Array.isArray(err.errors)) {
    statusCode = 400; // Bad Request
    message = err.errors.map(e => e.msg || e.message).join(', ');
  }

  // Handle Mongoose specific validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // Handle Mongoose duplicate key error (unique constraint)
  if (err.code === 11000) {
    statusCode = 409; // Conflict
    message = `Duplicate field value entered`;
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
};
