import { NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import Users from '@/models/users';
import { sendPasswordResetEmail } from '@/utils/email-service';
import { withApiHandler } from '@/utils/commonHandlers';
import { ApiError } from '@/utils/commonError';

export const POST = withApiHandler(async request => {
  const { email } = await request.json();

  if (!email) {
    throw new ApiError('Email is required', 400);
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await connectMongoDB();
  const user = await Users.findOne({ email });

  if (!user) {
    throw new ApiError('No user found with this email', 404);
  }

  try {
    await sendPasswordResetEmail(email, user.full_name, otp);
  } catch (error) {
    throw new ApiError('Failed to send reset password email. Please try again later.', 500);
  }

  user.resetPasswordOTP = otp;
  user.resetPasswordOTPExpiry = otpExpiry;
  await user.save();

  return NextResponse.json(
    {
      data: null,
      success: true,
      message: 'OTP sent successfully to your email',
      email: email,
    },
    { status: 200 }
  );
});

/**
 * @openapi
 * /api/forgot-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Send OTP for password reset
 *     description: Sends a 6-digit OTP to the user's registered email for password reset. OTP is valid for 10 minutes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: Registered email address of the user
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 email:
 *                   type: string
 *       400:
 *         description: Missing or invalid email
 *       404:
 *         description: No user found with this email
 */
