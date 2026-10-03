import express from 'express';
import {
  login,
  refresh,
  logout,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} from '../controllers/authController.js';
import {
  loginValidator,
  refreshTokenValidator,
  forgotPasswordValidator,
  verifyResetOtpValidator,
  resetPasswordValidator,
} from '../validators/authValidator.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.post('/login', loginValidator, login);
router.post('/refresh', refreshTokenValidator, refresh);
router.post('/logout', authenticate, logout);
router.post('/forgot-password', forgotPasswordValidator, forgotPassword);
router.post('/verify-reset-otp', verifyResetOtpValidator, verifyResetOtp);
router.post('/reset-password', resetPasswordValidator, resetPassword);

export default router;
