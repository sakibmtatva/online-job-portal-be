import connectMongoDB from '@/lib/mongodb';
import Application from '@/models/application';
import Jobs from '@/models/jobs';
import { ApiError } from '@/utils/commonError';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import Users from '@/models/users';
import Candidate from '@/models/candidate';

export const GET = withApiHandler(async (request, { params }) => {
  await connectMongoDB();
  const { jobId } = await params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  const userDetails = JSON.parse(request.headers.get('x-user'));
  if (userDetails.user_type !== 'Employer') {
    throw new ApiError('Unauthorized request', 401);
  }

  if (!jobId) {
    throw new ApiError('jobId  is required', 400);
  }

  const job = await Jobs.findById(jobId);
  const applications = await Application.find({ job: job._id })
    .select('-createdAt -updatedAt -__v -cover_letter')
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'candidate',
      select: '_id full_name',
      populate: {
        path: 'candidate-profile-info',
        select: '_id certifications profile_url total_experience education phone_number -user',
      },
    });

  const total = await Application.countDocuments({ job: job._id });
  return successResponse(applications, 'application list fetched successfully', 200, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});
