import connectMongoDB from '@/lib/mongodb';
import Users from '@/models/users';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import { ApiError } from '@/utils/commonError';

export const GET = withApiHandler(async request => {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  await connectMongoDB();

  const user = await Users.findOne({ verificationToken: token });
  if (user.isVerified) {
    throw new ApiError('User is already verified', 409);
  }
  if (!user) {
    throw new ApiError('Invalid verification token', 400);
  }

  user.isVerified = true;
  await user.save();

  return successResponse(null, 'Email verified successfully', 200);
});

/**
 * @openapi
 * /api/verify-email:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Verify user email
 *     description: Verifies a user's email using the provided verification token.
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         description: Verification token sent to user's email
 *         schema:
 *           type: string
 *           example: abc123xyz456
 *     responses:
 *       200:
 *         description: Email verified successfully
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
 *         description: Invalid verification token
 *       409:
 *         description: User is already verified
 *       500:
 *         description: Internal server error
 */
