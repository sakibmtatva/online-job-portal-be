import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { VerificationEmail } from '../emails/templates/VerificationEmail';
import { PasswordResetEmail } from '../emails/templates/PasswordResetEmail';
import { ContactUsEmail } from '../emails/templates/AdminContactEmail';
export const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: process.env.EMAIL_SERVER,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendVerificationEmail(email, name, token) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
  const emailHtml = await render(VerificationEmail({ name, verificationUrl }));

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Verify Your Email Address',
      html: emailHtml,
    });

    return info;
  } catch (error) {
    console.error('Error in sendVerificationEmail:', error);
    throw error;
  }
}
export async function sendContactMail(contactDetails) {
  const emailHtml = await render(ContactUsEmail(contactDetails));
  try {
    const info = await transporter.sendMail({
      from: contactDetails.email,
      to: 'jobportaladmin12@yopmail.com',
      subject: contactDetails.subject,
      html: emailHtml,
    });
    return info;
  } catch (error) {
    console.error('Error in sendEmail to admin', error);
    throw error;
  }
}

export async function sendPasswordResetEmail(email, name, otp) {
  const emailHtml = await render(PasswordResetEmail({ name, otp }));

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Reset Your Password',
      html: emailHtml,
    });

    return info;
  } catch (error) {
    console.error('Error in sendPasswordResetEmail:', error);
    throw error;
  }
}
