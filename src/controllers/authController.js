import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import mailService from '../services/mailService.js';
import 'dotenv/config';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      return next(err);
    }

    if (!user.isActive) {
      const err = new Error('Your account is inactive');
      err.statusCode = 401;
      return next(err);
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      return next(err);
    }

    const payload = {
      sub: user.id, // Mongoose `id` virtual
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    user.refreshToken = hashedRefreshToken;
    await user.save();

    res.sendSuccess({
      message: 'Login successful',
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(payload.sub);

    if (!user || !user.refreshToken) {
      const err = new Error('Invalid refresh token');
      err.statusCode = 401;
      return next(err);
    }

    if (!user.isActive) {
      const err = new Error('Your account is inactive');
      err.statusCode = 401;
      return next(err);
    }

    const tokenValid = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!tokenValid) {
      const err = new Error('Invalid refresh token');
      err.statusCode = 401;
      return next(err);
    }

    const newPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(newPayload, process.env.JWT_SECRET, { expiresIn: '15m' });
    const newRefreshToken = jwt.sign(newPayload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
    user.refreshToken = hashedRefreshToken;
    await user.save();

    res.sendSuccess({
      access_token: accessToken,
      refresh_token: newRefreshToken,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      const err = new Error('Invalid or expired refresh token');
      err.statusCode = 401;
      return next(err);
    }
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    // req.user is set by authenticate middleware
    const user = req.user;

    user.refreshToken = null;
    await user.save();

    res.sendSuccess({
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      const err = new Error('Invalid email address');
      err.statusCode = 401;
      return next(err);
    }

    if (!user.isActive) {
      const err = new Error('Your account is inactive');
      err.statusCode = 401;
      return next(err);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    user.resetOtp = hashedOtp;
    user.resetOtpExpiry = otpExpiry;
    await user.save();

    await mailService.sendOtpEmail(email, otp);

    res.sendSuccess({
      message: 'Password reset OTP sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const verifyResetOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      const err = new Error('Invalid email or OTP');
      err.statusCode = 401;
      return next(err);
    }

    if (!user.resetOtp || !user.resetOtpExpiry) {
      const err = new Error('OTP not found or expired');
      err.statusCode = 401;
      return next(err);
    }

    if (new Date() > user.resetOtpExpiry) {
      const err = new Error('OTP has expired');
      err.statusCode = 401;
      return next(err);
    }

    const otpValid = await bcrypt.compare(otp, user.resetOtp);
    if (!otpValid) {
      const err = new Error('Invalid OTP');
      err.statusCode = 401;
      return next(err);
    }

    res.sendSuccess({
      message: 'OTP verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      const err = new Error('Invalid email or OTP');
      err.statusCode = 401;
      return next(err);
    }

    if (!user.resetOtp || !user.resetOtpExpiry) {
      const err = new Error('OTP not found or expired');
      err.statusCode = 401;
      return next(err);
    }

    if (new Date() > user.resetOtpExpiry) {
      const err = new Error('OTP has expired');
      err.statusCode = 401;
      return next(err);
    }

    const otpValid = await bcrypt.compare(otp, user.resetOtp);
    if (!otpValid) {
      const err = new Error('Invalid OTP');
      err.statusCode = 401;
      return next(err);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    user.refreshToken = null;
    await user.save();

    res.sendSuccess({
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};
