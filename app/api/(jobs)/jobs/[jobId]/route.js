import Jobs from '../../../../../models/jobs';
import { JobValidationSchema } from '../../../../../utils/validation-schemas';
import connectMongoDB from '@/lib/mongodb';
import Users from '../../../../../models/users';
import Employer from '../../../../../models/employer';
import { BookmarkJob } from '../../../../../models/jobCandidateBookmark';
import notificationController from '../../../../../controllers/notificationController';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import { ApiError } from '@/utils/commonError';

export const PUT = withApiHandler(async (request, { params }) => {
  await connectMongoDB();
  const { jobId } = await params;
  const body = await request.json();
  let data = { ...body };

  if (!body.status) {
    const job = await Jobs.findById(jobId);
    data = { ...data, status: job.status };
  }

  JobValidationSchema.parse(data);

  const updatedJob = await Jobs.findByIdAndUpdate(jobId, body, {
    new: true,
    runValidators: true,
  });

  if (!updatedJob) {
    throw new ApiError('Job not found', 404);
  }

  return successResponse(updatedJob, 'Job updated successfully', 200);
});

export const GET = withApiHandler(async (request, { params }) => {
  await connectMongoDB();
  const { jobId } = await params;
  const job = await Jobs.findById({ _id: jobId });
  if (!job) {
    throw new ApiError('Job doesnot exist with given ID', 404);
  }
  const userDetails = JSON.parse(request.headers.get('x-user'));
  const user = await Users.findById(job.user);
  let data = job;
  if (user) {
    const employerDetails = await Employer.findOne({
      user: user._id,
    })
      .populate({
        path: 'user',
        select: '-__v -password -createdAt -updatedAt -user_type',
      })
      .select('-__v -createdAt -updatedAt -vision -about_us -user_type');

    const { user: userInfo, ...rest } = employerDetails.toObject();
    data = {
      ...data.toObject(),
      employerDetails: { ...userInfo, ...rest },
      isBookmarked: false,
      bookmarkId: null,
    };
  }

  if (userDetails) {
    const bookmark = await BookmarkJob.findOne({
      candidate: userDetails.id,
      job: jobId,
    });

    data = {
      ...data,
      isBookmarked: !!bookmark,
      bookmarkId: bookmark ? bookmark.id : null,
      hasApplied: job.applicants.some(id => id.toString() === userDetails.id.toString()),
    };
  }
  return successResponse(data, 'Job details fetched successfully', 200);
});

export const DELETE = withApiHandler(async (_, { params }) => {
  await connectMongoDB();
  const { jobId } = await params;
  const job = await Jobs.findByIdAndDelete({ _id: jobId });
  if (job) {
    return successResponse(null, 'Job deleted successfully', 200);
  }
  throw new ApiError('Something went wrong while deleting job', 500);
});

/**
 * @openapi
 * /api/job/{jobId}:
 *   put:
 *     tags:
 *       - Job
 *     summary: Update an existing job listing
 *     description: Updates the details of an existing job listing. Sends notifications to the job owner and applicants upon update.
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         description: Job ID to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               job_title:
 *                 type: string
 *                 description: Job title
 *               job_description:
 *                 type: string
 *                 description: Job description
 *               location:
 *                 type: string
 *                 description: Job location
 *               category:
 *                 type: string
 *                 description: Job category
 *               salary_min:
 *                 type: integer
 *                 description: Minimum salary for the job
 *               salary_max:
 *                 type: integer
 *                 description: Maximum salary for the job
 *               education:
 *                 type: string
 *                 description: Education requirement
 *               jobType:
 *                 type: string
 *                 description: Job type (e.g., full-time, part-time)
 *               experience_level:
 *                 type: string
 *                 description: Required experience level
 *               status:
 *                 type: string
 *                 description: Job status (e.g., active, closed)
 *     responses:
 *       200:
 *         description: Successfully updated job
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the job was updated successfully
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: Job ID
 *                     job_title:
 *                       type: string
 *                       description: Job title
 *                     job_description:
 *                       type: string
 *                       description: Job description
 *                     location:
 *                       type: string
 *                       description: Job location
 *                     category:
 *                       type: string
 *                       description: Job category
 *                     salary_min:
 *                       type: integer
 *                       description: Minimum salary for the job
 *                     salary_max:
 *                       type: integer
 *                       description: Maximum salary for the job
 *                     education:
 *                       type: string
 *                       description: Education requirement
 *                     jobType:
 *                       type: string
 *                       description: Job type (e.g., full-time, part-time)
 *                     experience_level:
 *                       type: string
 *                       description: Experience level required
 *                     status:
 *                       type: string
 *                       description: Job status (e.g., active, closed)
 *       400:
 *         description: Invalid job data
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /api/job/{jobId}:
 *   get:
 *     tags:
 *       - Job
 *     summary: Get details of a specific job
 *     description: Fetches the details of a job, including bookmark and application status.
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         description: Job ID to fetch details for
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully fetched job details
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
 *                     _id:
 *                       type: string
 *                       description: Job ID
 *                     job_title:
 *                       type: string
 *                       description: Job title
 *                     job_description:
 *                       type: string
 *                       description: Job description
 *                     location:
 *                       type: string
 *                       description: Job location
 *                     category:
 *                       type: string
 *                       description: Job category
 *                     salary_min:
 *                       type: integer
 *                       description: Minimum salary for the job
 *                     salary_max:
 *                       type: integer
 *                       description: Maximum salary for the job
 *                     education:
 *                       type: string
 *                       description: Education requirement for the job
 *                     jobType:
 *                       type: string
 *                       description: Job type (e.g., full-time, part-time)
 *                     experience_level:
 *                       type: string
 *                       description: Experience level required
 *                     status:
 *                       type: string
 *                       description: Job status (e.g., active, closed)
 *                     employerDetails:
 *                       type: object
 *                       properties:
 *                         user:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                             profile_url:
 *                               type: string
 *                         vision:
 *                           type: string
 *                         about_us:
 *                           type: string
 *                     isBookmarked:
 *                       type: boolean
 *                       description: Whether the job is bookmarked by the candidate
 *                     bookmarkId:
 *                       type: string
 *                       description: Bookmark ID (if job is bookmarked)
 *                     hasApplied:
 *                       type: boolean
 *                       description: Whether the candidate has applied for the job
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /api/job/{jobId}:
 *   delete:
 *     tags:
 *       - Job
 *     summary: Delete a job listing
 *     description: Deletes a specific job listing.
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         description: Job ID to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the job was deleted successfully
 *                 message:
 *                   type: string
 *                   description: Success message
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */
