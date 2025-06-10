import connectMongoDB from '@/lib/mongodb';
import { BookmarkJob } from '@/models/jobCandidateBookmark';
import { ApiError } from '@/utils/commonError';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import Jobs from '@/models/jobs';
import { notificationController } from '@/controllers/notificationController';
import Users from '@/models/users';

export const POST = withApiHandler(async request => {
  await connectMongoDB();
  const { jobId } = await request.json();
  const userDetails = JSON.parse(request.headers.get('x-user'));
  if (userDetails.user_type === 'Employer') {
    throw new ApiError('Unauthorized request', 401);
  }

  const user = await Users.findById(userDetails.id);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  const alreadyBookmarked = await BookmarkJob.findOne({ job: jobId, candidate: userDetails.id });

  if (alreadyBookmarked) {
    throw new ApiError('Job has been already bookmarked', 409);
  }
  const bookmark = await BookmarkJob.create({ job: jobId, candidate: userDetails.id });

  const job = await Jobs.findById(jobId);
  if (job) {
    await notificationController.createNotification(
      job.user,
      `${user.full_name} has interseted in your job '${job.job_title}'`,
      'info',
      {
        type: 'candidate',
        id: userDetails.id,
      }
    );
  }

  return successResponse(bookmark, 'Job bookmarked successfully', 201);
});

/**
 * @openapi
 * /api/job-bookmark:
 *   post:
 *     tags:
 *       - Bookmark
 *     summary: Bookmark a job
 *     description: Allows a candidate to bookmark a job they are interested in.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: The ID of the job to bookmark.
 *                 example: '60c72b2f5f1b2c001c8f0a3b'
 *     responses:
 *       201:
 *         description: Job successfully bookmarked
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
 *         description: Unauthorized request (only candidates can bookmark jobs)
 *       409:
 *         description: Job already bookmarked
 *       500:
 *         description: Internal server error
 */
