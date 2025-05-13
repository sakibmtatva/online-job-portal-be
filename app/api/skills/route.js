import connectMongoDB from '@/lib/mongodb';
import Skill from '../../../models/skills';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';

export const GET = withApiHandler(async () => {
  await connectMongoDB();
  const skillList = await Skill.find().select('-__v -createdAt -updatedAt');
  return successResponse(skillList, null, 200);
});

/**
 * @openapi
 * /api/skills:
 *   get:
 *     tags:
 *       - Skills
 *     summary: Get all skills
 *     description: Retrieves a list of all available skills in the system.
 *     responses:
 *       200:
 *         description: List of skills fetched successfully
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
 *                   nullable: true
 *                   example: null
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 661fbb39e8915c0d6c65cf1b
 *                       name:
 *                         type: string
 *                         example: JavaScript
 *       500:
 *         description: Internal server error
 */
