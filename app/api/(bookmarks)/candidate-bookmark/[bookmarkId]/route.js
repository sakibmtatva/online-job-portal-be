import connectMongoDB from '@/lib/mongodb';
import EmployerCandidateBookmark from '@/models/employerCandidateBookmark';
import { ApiError } from '@/utils/commonError';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';

export const DELETE = withApiHandler(async (request, { params }) => {
  await connectMongoDB();
  const userDetails = JSON.parse(request.headers.get('x-user'));
  const { bookmarkId } = await params;

  if (userDetails.user_type !== 'Employer') {
    throw new ApiError('Unauthorized request', 401);
  }

  await EmployerCandidateBookmark.findByIdAndDelete(bookmarkId);
  return successResponse(null, 'bookmark removed successfully', 200);
});

/**
 * @openapi
 * /api/candidate-bookmark/{bookmarkId}:
 *   delete:
 *     tags:
 *       - Bookmark
 *     summary: Remove a candidate's bookmark
 *     description: Allows an employer to remove a previously bookmarked candidate.
 *     parameters:
 *       - name: bookmarkId
 *         in: path
 *         required: true
 *         description: The ID of the bookmark to be removed.
 *         schema:
 *           type: string
 *           example: "60c72b2f5f1b2c001c8f0a3b"
 *     responses:
 *       200:
 *         description: Successfully removed the bookmark
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
 *       401:
 *         description: Unauthorized request (only employers can remove bookmarks)
 *       404:
 *         description: Bookmark not found
 *       500:
 *         description: Internal server error
 */
