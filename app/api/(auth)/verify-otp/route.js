import connectMongoDB from '@/lib/mongodb';
import Users from '@/models/users';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import { ApiError } from '@/utils/commonError';

export const POST = withApiHandler(async request => {
  const { email, otp } = await request.json();

  if (!otp) {
    throw new ApiError('OTP is required', 400);
  }

  if (!email) {
    throw new ApiError('No Email found', 400);
  }

  await connectMongoDB();
  const user = await Users.findOne({ email });

  if (!user) {
    throw new ApiError('No user found with this email', 404);
  }

  if (!user.resetPasswordOTP || !user.resetPasswordOTPExpiry) {
    throw new ApiError('No OTP request found', 400);
  }

  if (user.resetPasswordOTP !== otp) {
    throw new ApiError('Invalid OTP', 400);
  }

  if (new Date() > new Date(user.resetPasswordOTPExpiry)) {
    throw new ApiError('OTP has been expired', 400);
  }

  return successResponse(null, 'OTP verified successfully', 200);
});

/**
 * @openapi
 * /api/verify-otp:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Verify password reset OTP
 *     description: Validates the OTP sent to the user's email for password reset.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: OTP verified successfully
 *       400:
 *         description: Missing or invalid OTP or email
 *       404:
 *         description: No user found with this email
 *       500:
 *         description: Internal server error
 */
