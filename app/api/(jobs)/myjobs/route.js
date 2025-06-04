import connectMongoDB from '@/lib/mongodb';
import Jobs from '@/models/jobs';
import { ApiError } from '@/utils/commonError';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import mongoose from 'mongoose';

export const GET = withApiHandler(async request => {
  await connectMongoDB();
  const userDetails = JSON.parse(request.headers.get('x-user'));

  if (userDetails.user_type !== 'Employer') {
    throw new ApiError('Unauthorized request', 401);
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const sortBy = searchParams.get('sortBy');
  const sort = !sortBy ? { createdAt: -1 } : { createdAt: sortBy === 'asc' ? -1 : 1 };
  const skip = (page - 1) * limit;

  let jobs = await Jobs.aggregate([
    {
      $sort: sort,
    },
    {
      $match: { user: new mongoose.Types.ObjectId(userDetails.id) },
    },
    {
      $lookup: {
        from: 'employers',
        localField: 'user',
        foreignField: 'user',
        as: 'employerData',
      },
    },
    {
      $unwind: {
        path: '$employerData',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        job_title: 1,
        job_description: 1,
        location: 1,
        category: 1,
        salary_min: 1,
        salary_max: 1,
        education: 1,
        jobType: 1,
        experience_level: 1,
        status: 1,
        applicants: 1,
        skills_required: 1,
        closing_date: 1,
        profile_url: '$employerData.profile_url',
        is_featured: 1,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  jobs = jobs.map(job => ({
    ...job,
    applicantCount: job.applicants.length,
  }));

  const totalAggregation = await Jobs.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userDetails.id) } },
    { $count: 'total' },
  ]);

  const total = totalAggregation[0]?.total || 0;

  return successResponse(jobs, 'jobs fetched successfully', 200, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

/**
 * @openapi
 * /api/myjobs:
 *   get:
 *     tags:
 *       - Job
 *     summary: Fetch jobs posted by an employer
 *     description: Fetches the list of jobs posted by the authenticated employer. Only employers are allowed to access this endpoint.
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number for pagination (default is 1)
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Number of jobs per page for pagination (default is 10)
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successfully fetched jobs
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
 *                     total:
 *                       type: integer
 *                       description: Total number of jobs
 *                     page:
 *                       type: integer
 *                       description: Current page number
 *                     limit:
 *                       type: integer
 *                       description: Number of jobs per page
 *                     totalPages:
 *                       type: integer
 *                       description: Total number of pages
 *                     jobs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Job ID
 *                           job_title:
 *                             type: string
 *                             description: Job title
 *                           job_description:
 *                             type: string
 *                             description: Job description
 *                           location:
 *                             type: string
 *                             description: Job location
 *                           category:
 *                             type: string
 *                             description: Job category
 *                           salary_min:
 *                             type: integer
 *                             description: Minimum salary for the job
 *                           salary_max:
 *                             type: integer
 *                             description: Maximum salary for the job
 *                           education:
 *                             type: string
 *                             description: Education requirement for the job
 *                           jobType:
 *                             type: string
 *                             description: Job type (e.g., full-time, part-time)
 *                           experience_level:
 *                             type: string
 *                             description: Experience level required for the job
 *                           status:
 *                             type: string
 *                             description: Job status (e.g., active, closed)
 *       401:
 *         description: Unauthorized request (only employers can access this)
 *       500:
 *         description: Internal server error
 */
