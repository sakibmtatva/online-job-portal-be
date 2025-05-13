import connectMongoDB from '@/lib/mongodb';
import City from '@/models/cities';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';

export const GET = withApiHandler(async () => {
  await connectMongoDB();
  const cityList = await City.find().select('-__v -createdAt -updatedAt');
  return successResponse(cityList, 'cities fetched successfully', 200);
});

/**
 * @openapi
 * /api/cities:
 *   get:
 *     tags:
 *       - Cities
 *     summary: Get all cities
 *     description: Retrieves a list of all cities available in the system.
 *     responses:
 *       200:
 *         description: Cities fetched successfully
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
 *                   example: cities fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 662123456abcde7890fghijk
 *                       name:
 *                         type: string
 *                         example: New York
 *       500:
 *         description: Internal server error
 */
