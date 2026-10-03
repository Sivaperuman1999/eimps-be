import nodemailer from 'nodemailer';
import 'dotenv/config';

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    this.transporter.verify((error, success) => {
      if (error) {
        console.error('SMTP CONNECTION ERROR:', error);
      } else {
        console.log('SMTP SERVER READY:', success);
      }
    });
  }

  async sendOtpEmail(email, otp) {
    try {
      const result = await this.transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: email,
        subject: 'Password Reset OTP',
        text: `Your password reset OTP is ${otp}. It will expire in 5 minutes.`,
      });

      return result;
    } catch (error) {
      console.error('EMAIL ERROR:', error);
      throw error;
    }
  }
}

export default new MailService();
