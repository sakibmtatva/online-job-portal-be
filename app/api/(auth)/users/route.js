import connectMongoDB from '@/lib/mongodb';
import Users from '@/models/users';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';

export const GET = withApiHandler(async () => {
  await connectMongoDB();
  const users = await Users.find().select('-password');
  return successResponse(users, 'Users fetched successfully', 200);
});

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users
 *     description: Retrieve a list of all users. Passwords are excluded from the response.
 *     responses:
 *       200:
 *         description: Users fetched successfully
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       email:
 *                         type: string
 *                       name:
 *                         type: string
 *                       user_type:
 *                         type: string
 *       500:
 *         description: Internal server error
 */
