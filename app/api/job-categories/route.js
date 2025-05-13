import connectMongoDB from '@/lib/mongodb';
import { JobCategory } from '@/models/jobCategories';
import { ApiError } from '@/utils/commonError';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';

export const POST = withApiHandler(async request => {
  await connectMongoDB();
  const { name } = await request.json();
  const categoryExists = await JobCategory.findOne({ name });
  if (categoryExists) {
    throw new ApiError('Category already exists', 409);
  }
  const newCategory = await JobCategory.create({ name });
  return successResponse(newCategory, 'Category added successfully', 201);
});

export const GET = withApiHandler(async () => {
  await connectMongoDB();
  const jobCategories = await JobCategory.find();
  return successResponse(jobCategories, null, 200);
});

/**
 * @openapi
 * /api/job-categories:
 *   post:
 *     tags:
 *       - Job Categories
 *     summary: Add a new job category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Engineering
 *     responses:
 *       201:
 *         description: Category added successfully
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
 *                   example: Category added successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 6620ff50d8c95b3f6cdd1af5
 *                     name:
 *                       type: string
 *                       example: Engineering
 *       409:
 *         description: Category already exists
 *       500:
 *         description: Internal server error
 */
