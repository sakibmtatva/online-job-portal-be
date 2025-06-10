import connectMongoDB from '@/lib/mongodb';
import Jobs from '../../../../models/jobs';
import { JobValidationSchema } from '../../../../utils/validation-schemas';
import { BookmarkJob } from '@/models/jobCandidateBookmark';
import Application from '../../../../models/application';
import Users from '../../../../models/users';
import Candidate from '../../../../models/candidate';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import { ApiError } from '@/utils/commonError';

export const GET = withApiHandler(async request => {
  await connectMongoDB();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;
  const jobTitle = searchParams.get('jobTitle');
  const location = searchParams.get('location');
  const category = searchParams.get('category');
  const jobType = searchParams.get('jobType');
  const experienceLevel = searchParams.get('experienceLevel');
  const education = searchParams.get('education');
  const status = searchParams.get('status');
  const salaryRange = searchParams.get('salaryRange');
  const sortBy = searchParams.get('sortBy');

  const userDetails = JSON.parse(request.headers.get('x-user'));
  let query = {
    status: { $ne: 'Expired' },
  };

  if (jobTitle) {
    query.job_title = { $regex: jobTitle, $options: 'i' };
  }

  if (salaryRange) {
    const [min, max] = salaryRange.split('-').map(str => Number(str.trim()));
    query.salary_min = { $gte: min };
    query.salary_max = { $lte: max };
  }

  if (education) {
    query.education = education;
  }

  if (category) {
    query.category = category;
  }

  if (location) {
    query.location = location;
  }

  if (status) {
    query.status = status;
  }

  if (jobType) {
    query.jobType = jobType;
  }

  if (experienceLevel) {
    query.experience_level = experienceLevel;
  }

  const sort = !sortBy ? { createdAt: -1 } : { createdAt: sortBy === 'asc' ? -1 : 1 };

  let jobs = await Jobs.aggregate([
    {
      $sort: {
        is_featured: -1,
        createdAt: 1,
      },
    },
    {
      $match: query,
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

  if (userDetails) {
    const bookmarks = await BookmarkJob.find({
      candidate: userDetails.id,
    }).lean();

    const bookmarkedMap = new Map();
    bookmarks.forEach(b => {
      bookmarkedMap.set(b.job.toString(), b._id.toString());
    });

    jobs = jobs.map(job => {
      const bookmarkId = bookmarkedMap.get(job._id.toString());
      return {
        ...job,
        isBookmarked: !!bookmarkId,
        bookmarkId: bookmarkId || null,
        hasApplied: job.applicants.some(id => id.toString() === userDetails.id.toString()),
      };
    });
  }

  const totalAggregation = await Jobs.aggregate([{ $match: query }, { $count: 'total' }]);
  const totalEmployers = await Users.countDocuments({ user_type: 'Employer' });
  const totalCandidates = await Users.countDocuments({ user_type: 'Candidate' });
  const totalJobsWithoutFilter = await Jobs.countDocuments();
  const total = totalAggregation[0]?.total || 0;

  return successResponse(jobs, 'jobs fetched successfully', 200, {
    total,
    totalJobs: totalJobsWithoutFilter,
    totalEmployers,
    totalCandidates,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

export const POST = withApiHandler(async request => {
  await connectMongoDB();
  const payload = await request.json();
  const userDetails = JSON.parse(request.headers.get('x-user'));
  if (userDetails.user_type !== 'Employer') {
    throw new ApiError('Unauthorized request', 401);
  }

  const data = { ...payload, status: 'Active', user: userDetails.id };
  JobValidationSchema.parse(data);
  const job = await Jobs.create(data);
  return successResponse(job, 'Job created successfully', 200);
});

export const PUT = withApiHandler(async request => {
  await connectMongoDB();
  const payload = await request.json();
  const userDetails = JSON.parse(request.headers.get('x-user'));
  if (userDetails.user_type !== 'Employer') {
    throw new ApiError('Unauthorized request', 401);
  }

  const { jobId, is_featured } = payload;
  if (!jobId || typeof is_featured !== 'boolean') {
    throw new ApiError('Job ID and is_featured(boolean) are required', 400);
  }

  const job = await Jobs.findOneAndUpdate(
    { _id: jobId, user: userDetails.id },
    { $set: { is_featured } },
    { new: true }
  );

  if (!job) {
    throw new ApiError('Job not found or unauthorized', 404);
  }

  return successResponse(job, `Job ${is_featured ? 'marked as featured' : 'unfeatured'} successfully`, 200);
});

/**
 * @openapi
 * /api/jobs:
 *   get:
 *     tags:
 *       - Job
 *     summary: Get a list of jobs with optional filters and pagination
 *     description: Fetches a paginated list of jobs with filtering options (e.g., job title, location, category) and bookmarks.
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (default is 1)
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page (default is 10)
 *       - in: query
 *         name: jobTitle
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter jobs by job title
 *       - in: query
 *         name: location
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter jobs by location
 *       - in: query
 *         name: category
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter jobs by category
 *       - in: query
 *         name: jobType
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter jobs by job type (e.g., full-time, part-time)
 *       - in: query
 *         name: experienceLevel
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter jobs by experience level (e.g., junior, senior)
 *       - in: query
 *         name: education
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter jobs by education requirement
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter jobs by status (e.g., active, closed)
 *       - in: query
 *         name: salaryRange
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter jobs by salary range (e.g., 50000-70000)
 *       - in: query
 *         name: sortBy
 *         required: false
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort jobs by creation date (asc or desc)
 *     responses:
 *       200:
 *         description: Successfully fetched list of jobs
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Job ID
 *                       job_title:
 *                         type: string
 *                         description: Job title
 *                       job_description:
 *                         type: string
 *                         description: Job description
 *                       location:
 *                         type: string
 *                         description: Location of the job
 *                       category:
 *                         type: string
 *                         description: Category of the job
 *                       salary_min:
 *                         type: integer
 *                         description: Minimum salary for the job
 *                       salary_max:
 *                         type: integer
 *                         description: Maximum salary for the job
 *                       education:
 *                         type: string
 *                         description: Education requirement for the job
 *                       jobType:
 *                         type: string
 *                         description: Job type (e.g., full-time, part-time)
 *                       experience_level:
 *                         type: string
 *                         description: Required experience level
 *                       status:
 *                         type: string
 *                         description: Job status (e.g., active, closed)
 *                       applicantCount:
 *                         type: integer
 *                         description: Number of applicants for the job
 *                       profile_url:
 *                         type: string
 *                         description: Employer profile URL
 *                       isBookmarked:
 *                         type: boolean
 *                         description: Whether the job is bookmarked by the candidate
 *                       bookmarkId:
 *                         type: string
 *                         description: Bookmark ID (if job is bookmarked)
 *                       hasApplied:
 *                         type: boolean
 *                         description: Whether the candidate has applied for the job
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of jobs available
 *                     page:
 *                       type: integer
 *                       description: Current page number
 *                     limit:
 *                       type: integer
 *                       description: Limit of jobs per page
 *                     totalPages:
 *                       type: integer
 *                       description: Total number of pages
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /api/jobs:
 *   post:
 *     tags:
 *       - Job
 *     summary: Create a new job listing
 *     description: Allows employers to create a new job listing.
 *     requestBody:
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
 *         description: Job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the job was created successfully
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
 *                       description: Location of the job
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
 *       401:
 *         description: Unauthorized request (only employers can create jobs)
 *       500:
 *         description: Internal server error
 */
