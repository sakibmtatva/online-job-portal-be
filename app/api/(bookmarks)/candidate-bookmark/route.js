import connectMongoDB from '@/lib/mongodb';
import EmployerCandidateBookmark from '@/models/employerCandidateBookmark';
import { ApiError } from '@/utils/commonError';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';

export const POST = withApiHandler(async request => {
  await connectMongoDB();
  const { candidateId } = await request.json();
  const userDetails = JSON.parse(request.headers.get('x-user'));

  if (userDetails.user_type !== 'Employer') {
    throw new ApiError('Unauthorized request', 401);
  }

  const alreadyBookmarked = await EmployerCandidateBookmark.findOne({
    candidate: candidateId,
    employer: userDetails.id,
  });

  if (alreadyBookmarked) {
    throw new ApiError('Candidate has been already bookmarked', 409);
  }

  const bookmark = await EmployerCandidateBookmark.create({
    candidate: candidateId,
    employer: userDetails.id,
  });
  return successResponse(bookmark, 'Candidate bookmarked successfully', 201);
});

/**
 * @openapi
 * /api/candidate-bookmark:
 *   post:
 *     tags:
 *       - Bookmark
 *     summary: Bookmark a candidate
 *     description: Allows an employer to bookmark a candidate for future reference.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               candidateId:
 *                 type: string
 *                 description: The ID of the candidate to be bookmarked.
 *                 example: "609e8c76d4c7e3a6a5f9e5bc"
 *     responses:
 *       201:
 *         description: Successfully bookmarked the candidate
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the request was successful
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 data:
 *                   type: object
 *                   properties:
 *                     candidate:
 *                       type: string
 *                       description: The ID of the bookmarked candidate
 *                     employer:
 *                       type: string
 *                       description: The ID of the employer who bookmarked the candidate
 *       401:
 *         description: Unauthorized request (only employers can bookmark candidates)
 *       409:
 *         description: Conflict (candidate already bookmarked)
 *       500:
 *         description: Internal server error
 */
