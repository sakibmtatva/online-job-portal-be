import connectMongoDB from '@/lib/mongodb';
import Application from '@/models/application';
import { ApiError } from '@/utils/commonError';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';

export const GET = withApiHandler(async (request, { params }) => {
  await connectMongoDB();
  const { applicationId } = await params;

  const userDetails = JSON.parse(request.headers.get('x-user'));
  if (userDetails.user_type !== 'Employer') {
    throw new ApiError('Unauthorized request', 401);
  }

  if (!applicationId) {
    throw new ApiError('applicationId  is required', 400);
  }

  const application = await Application.findById(applicationId)
    .select('-createdAt -updatedAt -__v')
    .populate({
      path: 'candidate',
      select: '-password -verificationToken -createdAt -updatedAt -__v -isVerified -user_type',
      populate: {
        path: 'candidate-profile-info',
        select: '_id certifications profile_url total_experience education phone_number -user',
      },
    })
    .populate('job', 'job_title')
    .lean();

  return successResponse(application, 'application details fetched successfully', 200);
});
