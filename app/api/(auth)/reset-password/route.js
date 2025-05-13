import connectMongoDB from '@/lib/mongodb';
import Users from '@/models/users';
import bcrypt from 'bcryptjs';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import { ApiError } from '@/utils/commonError';

export const POST = withApiHandler(async request => {
  const { email, newPassword } = await request.json();

  if (!newPassword) {
    throw new ApiError('New password is required', 400);
  }

  await connectMongoDB();
  const user = await Users.findOne({ email });

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  if (!user.resetPasswordOTP || !user.resetPasswordOTPExpiry) {
    throw new ApiError('No OTP request found', 400);
  }

  if (new Date() > new Date(user.resetPasswordOTPExpiry)) {
    throw new ApiError('OTP has been expired', 400);
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new ApiError('New password cannot be same as old password', 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.resetPasswordOTP = undefined;
  user.resetPasswordOTPExpiry = undefined;
  user.password = hashedPassword;
  await user.save();

  return successResponse(null, 'Password updated successfully', 200);
});

/**
 * @openapi
 * /api/reset-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Reset user password
 *     description: Updates the user's password after verifying the OTP. The new password must be different from the old one.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewSecurePass123
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or OTP expired
 *       404:
 *         description: User not found
 */
