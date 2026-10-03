import { body, validationResult } from 'express-validator';

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed');
    error.errors = errors.array();
    return next(error); // Caught by errorHandler matching class-validator
  }
  next();
};

export const loginValidator = [
  body('email').notEmpty().withMessage('email should not be empty').isEmail().withMessage('email must be an email'),
  body('password').notEmpty().withMessage('password should not be empty'),
  validate,
];

export const refreshTokenValidator = [
  body('refreshToken').notEmpty().withMessage('refreshToken should not be empty').isString().withMessage('refreshToken must be a string'),
  validate,
];

export const forgotPasswordValidator = [
  body('email').notEmpty().withMessage('email should not be empty').isEmail().withMessage('email must be an email'),
  validate,
];

export const verifyResetOtpValidator = [
  body('email').notEmpty().withMessage('email should not be empty').isEmail().withMessage('email must be an email'),
  body('otp').isString().withMessage('otp must be a string').isLength({ min: 6, max: 6 }).withMessage('otp must be longer than or equal to 6 characters'),
  validate,
];

export const resetPasswordValidator = [
  body('email').notEmpty().withMessage('email should not be empty').isEmail().withMessage('email must be an email'),
  body('otp').isString().withMessage('otp must be a string').isLength({ min: 6, max: 6 }).withMessage('otp must be longer than or equal to 6 characters'),
  body('newPassword').isString().withMessage('newPassword must be a string').isLength({ min: 8 }).withMessage('newPassword must be longer than or equal to 8 characters'),
  validate,
];
