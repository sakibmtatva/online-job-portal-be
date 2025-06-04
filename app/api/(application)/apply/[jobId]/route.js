import Application from '@/models/application';
import Jobs from '@/models/jobs';
import connectMongoDB from '@/lib/mongodb';
import { ApplicationSchema } from '../../../../../utils/validation-schemas';
import { uploadToCloudinary } from '../../../../../utils/fileUpload';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import { ApiError } from '@/utils/commonError';
import { getSizeInMB } from '@/utils/commonFunctions';
import { transporter } from '../../../../../utils/email-service';
import { notificationController } from '@/controllers/notificationController';
import Users from '@/models/users';

export const POST = withApiHandler(async (request, { params }) => {
  await connectMongoDB();
  const { jobId } = await params;
  const formData = await request.formData();

  const userDetails = JSON.parse(request.headers.get('x-user'));
  if (userDetails.user_type === 'Employer') {
    throw new ApiError('Unauthorized request', 401);
  }

  if (!jobId) {
    throw new ApiError('jobId  is required', 400);
  }

  const cover_letter = formData.get('cover_letter');
  const resume = formData.get('resume');

  if (resume) {
    const resumeSize = getSizeInMB(resume);
    if (resumeSize > 1) {
      throw new ApiError('resume size should be of 1 mb or less', 400);
    }

    if (['image/png', 'image/jpeg'].includes(resume.type)) {
      throw new ApiError('resume should be of type doc or pdf', 400);
    }
  } else {
    throw new ApiError('Resume is required', 400);
  }

  const uploadedUrl = await uploadToCloudinary(resume, {
    folder: 'job-portal/uploads',
  });

  const values = {
    cover_letter: cover_letter,
    resume_url: uploadedUrl,
    trello_name: 'All Applications',
  };

  ApplicationSchema.parse(values);
  const data = { ...values, candidate: userDetails.id, job: jobId };

  const alreadyApplied = await Application.findOne({
    job: jobId,
    candidate: userDetails.id,
  });

  if (alreadyApplied) {
    throw new ApiError('You have already applied for this job', 409);
  }

  let job = await Jobs.findById(jobId).populate('user', '-password');

  if (!job || job.status === 'Expired') {
    throw new ApiError('This job has expired. You cannot apply.', 400);
  }

  if (job) {
    job.applicants.push(userDetails.id);
    await Jobs.findByIdAndUpdate(jobId, job, {
      new: true,
    });

    const footer = `
    <hr />
    <p><strong>Resume:</strong> <a href='${uploadedUrl}' target='_blank'>${uploadedUrl}</a></p>
  `;

    const fullHtml = cover_letter + footer;
    const candidate = await Users.findById(userDetails.id);

    await notificationController.createNotification(
      job.user._id,
      `${candidate.full_name} has applied for your job '${job.job_title}'`,
      'info',
      {
        type: 'Candidate',
        id: userDetails.id,
      }
    );

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: job.user.email,
      subject: `Application for the ${job.job_title} position`,
      html: fullHtml,
    });
  }
  const application = await Application.create(data);
  return successResponse(application, 'applied for the job successfully', 201);
});

/**
 * @openapi
 * /api/apply/{jobId}:
 *   post:
 *     tags:
 *       - Applications
 *     summary: Apply to a job
 *     description: Allows a candidate to apply for a job by submitting a cover letter and a resume file.
 *     parameters:
 *       - name: jobId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the job to apply for
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               cover_letter:
 *                 type: string
 *                 description: Cover letter as HTML string
 *               resume:
 *                 type: string
 *                 format: binary
 *                 description: Resume file (PDF or DOC only, max 1 MB)
 *     responses:
 *       201:
 *         description: Applied for the job successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   description: The created application document
 *       400:
 *         description: Validation or file upload errors
 *       401:
 *         description: Unauthorized (employers cannot apply)
 *       409:
 *         description: Already applied to the job
 */
