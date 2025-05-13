import connectMongoDB from '@/lib/mongodb';
import Users from '@/models/users';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import { ApiError } from '@/utils/commonError';

export const GET = withApiHandler(async request => {
  const userHeader = request.headers.get('x-user');
  const user = userHeader ? JSON.parse(userHeader) : null;

  if (!user || !user.id) {
    throw new ApiError('Unauthorized request', 401);
  }

  const id = user.id;
  await connectMongoDB();

  const foundUser = await Users.findById(id).select('-password');

  if (!foundUser) {
    throw new ApiError('User not found', 404);
  }

  return successResponse(foundUser, 'User details fetched successfully', 200);
});

/**
 * @openapi
 * /api/user:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current authenticated user
 *     description: Returns the authenticated user's profile information.
 *     responses:
 *       200:
 *         description: User details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     user_type:
 *                       type: string
 *       401:
 *         description: Unauthorized request
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
