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

export const PUT = withApiHandler(async (request, { params }) => {
  await connectMongoDB();
  const { applicationId } = await params;
  const { searchParams } = new URL(request.url);
  const trello_name = searchParams.get('trello_name');

  const userDetails = JSON.parse(request.headers.get('x-user'));
  if (userDetails.user_type !== 'Employer') {
    throw new ApiError('Unauthorized request', 401);
  }

  if (!applicationId) {
    throw new ApiError('Application ID is required', 400);
  }
  if (!trello_name || trello_name.trim() === '') {
    throw new ApiError('Valid column name is required', 400);
  }

  const trimmedTrelloName = trello_name.trim();
  const existingApplication = await Application.findById(applicationId);

  if (!existingApplication) {
    throw new ApiError('Application not found', 404);
  }

  if (existingApplication.trello_name === trimmedTrelloName) {
    throw new ApiError(`Application is already in ${trimmedTrelloName}`, 400);
  }

  const application = await Application.findByIdAndUpdate(
    applicationId,
    { trello_name: trimmedTrelloName },
    { new: true }
  );

  return successResponse(application, `Application moved to ${trimmedTrelloName} successfully`, 200);
});

/**
 * @openapi
 * /api/apply/{applicationId}:
 *   put:
 *     tags:
 *       - Applications
 *     summary: Update application's trello column
 *     description: Allows an employer to update the trello column for a job application
 *     parameters:
 *       - name: applicationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the application
 *       - name: trello_name
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: New Trello column name
 *     responses:
 *       200:
 *         description: Trello column updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Application'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Application not found
 */
