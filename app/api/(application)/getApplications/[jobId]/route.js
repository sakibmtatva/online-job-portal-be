import connectMongoDB from '@/lib/mongodb';
import Application from '@/models/application';
import Jobs from '@/models/jobs';
import { ApiError } from '@/utils/commonError';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import Candidate from '@/models/candidate';
import Users from '@/models/users';

export const GET = withApiHandler(async (request, { params }) => {
  await connectMongoDB();
  const { jobId } = await params;
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');

  const shouldPaginate = pageParam && limitParam;
  const page = shouldPaginate ? parseInt(pageParam) : 1;
  const limit = shouldPaginate ? parseInt(limitParam) : 0;
  const skip = shouldPaginate ? (page - 1) * limit : 0;

  const userDetails = JSON.parse(request.headers.get('x-user'));
  if (userDetails.user_type !== 'Employer') {
    throw new ApiError('Unauthorized request', 401);
  }

  if (!jobId) {
    throw new ApiError('jobId  is required', 400);
  }

  const job = await Jobs.findById(jobId);

  const query = Application.find({ job: job._id })
    .sort({ createdAt: -1 })
    .select('-updatedAt -__v')
    .populate({
      path: 'candidate',
      select: '_id full_name email',
      populate: {
        path: 'candidate-profile-info',
        select:
          '_id certifications profile_url location position bio nationality education total_experience education phone_number -user',
      },
    });

  if (shouldPaginate) {
    query.skip(skip).limit(limit);
  }

  const applications = await query;
  const total = await Application.countDocuments({ job: job._id });

  return successResponse(applications, 'application list fetched successfully', 200, {
    total,
    page: shouldPaginate ? page : 1,
    limit: shouldPaginate ? limit : total,
    totalPages: shouldPaginate ? Math.ceil(total / limit) : 1,
  });
});
