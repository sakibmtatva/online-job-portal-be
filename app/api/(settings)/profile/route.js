import connectMongoDB from '@/lib/mongodb';
import Employer from '@/models/employer';
import Users from '@/models/users';
import Candidate from '@/models/candidate';
import { CandidateValidationSchema, EmployerValidationSchema } from '../../../../utils/validation-schemas';
import { uploadToCloudinary } from '../../../../utils/fileUpload';
import { buildData, getSizeInMB } from '@/utils/commonFunctions';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import { ApiError } from '@/utils/commonError';

export const GET = withApiHandler(async request => {
  await connectMongoDB();
  const userDetails = JSON.parse(request.headers.get('x-user'));
  const user = await Users.findById(userDetails.id);

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  let profileData;
  if (userDetails.user_type === 'Employer') {
    profileData = await Employer.findOne({ user: userDetails.id }).select('-__v');
  } else {
    profileData = await Candidate.findOne({ user: userDetails.id }).select('-__v');
  }

  if (!profileData) {
    throw new ApiError('Profile not found', 404);
  }

  return successResponse(profileData, 'Profile details fetched successfully', 200);
});

export const PUT = withApiHandler(async request => {
  await connectMongoDB();
  const userDetails = JSON.parse(request.headers.get('x-user'));
  const user = await Users.findById(userDetails.id);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  const notAllowedProfileTypes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
  ];

  if (userDetails.user_type === 'Employer') {
    const formData = await request.formData();
    const profilePic = formData.get('profile_pic');
    if (profilePic) {
      if (notAllowedProfileTypes.includes(profilePic.type)) {
        throw new ApiError('profile pic should be of type image', 400);
      }
      const fileSize = getSizeInMB(profilePic);
      if (fileSize > 1) {
        throw new ApiError('profile pic size should be of 1 mb or less', 400);
      }
    }
    let profileUrl = '';
    if (profilePic) {
      profileUrl = await uploadToCloudinary(profilePic, {
        folder: 'job-portal/uploads',
      });
    }
    const keys = [
      'phone_number',
      'location',
      'website',
      'about_us',
      'est_year',
      'industry_type',
      'total_working_employees',
      'vision',
    ];

    let data = buildData(keys, formData, { profile_url: profileUrl });

    if (data?.est_year) {
      data = { ...data, est_year: Number(data.est_year) };
    }

    if (data?.total_working_employees) {
      data = {
        ...data,
        total_working_employees: Number(data.total_working_employees),
      };
    }

    EmployerValidationSchema.parse(data);
    const employer = await Employer.find({ user: userDetails.id });

    await Employer.findByIdAndUpdate({ _id: employer[0]._id }, data, {
      new: true,
      runValidators: true,
    });
  } else {
    const formData = await request.formData();
    const profilePic = formData.get('profile_pic');
    if (profilePic) {
      if (notAllowedProfileTypes.includes(profilePic.type)) {
        throw new ApiError('profile pic should be of type image', 400);
      }

      const profileSize = getSizeInMB(profilePic);
      if (profileSize > 1) {
        throw new ApiError('profile pic size should be of 1 mb or less', 400);
      }
    }

    const resume = formData.get('resume');
    if (resume) {
      if (['image/png', 'image/jpeg'].includes(resume.type)) {
        throw new ApiError('resume should be of type doc or pdf', 400);
      }

      const resumeSize = getSizeInMB(resume);
      if (resumeSize > 1) {
        throw new ApiError('resume size should be of 1 mb or less', 400);
      }
    }

    let profileUrl = '',
      resumeUrl = '';
    if (profilePic) {
      profileUrl = await uploadToCloudinary(profilePic, {
        folder: 'job-portal/uploads',
      });
    }
    if (resume) {
      resumeUrl = await uploadToCloudinary(resume, {
        folder: 'job-portal/uploads',
      });
    }

    const keys = [
      'phone_number',
      'location',
      'position',
      'nationality',
      'total_experience',
      'education',
      'expected_sal',
      'current_sal',
      'certifications',
      'bio',
      'headline',
      'previous_experience',
    ];

    let data = buildData(keys, formData, {
      profile_url: profileUrl,
      resume_url: resumeUrl,
    });

    if (data?.total_experience) {
      data = { ...data, total_experience: Number(data?.total_experience) };
    }
    if (data?.current_sal) {
      data = { ...data, current_sal: Number(data?.current_sal) };
    }
    if (data?.expected_sal) {
      data = { ...data, expected_sal: Number(data?.expected_sal) };
    }
    CandidateValidationSchema.parse(data);
    const candidate = await Candidate.find({ user: userDetails.id });
    await Candidate.findByIdAndUpdate({ _id: candidate[0]._id }, data, {
      new: true,
      runValidators: true,
    });
  }
  return successResponse(null, 'Profile submitted successfully', 200);
});

/**
 * @openapi
 * /api/profile:
 *   get:
 *     tags:
 *       - User
 *     summary: Get user profile
 *     description: Fetches the user's profile data based on their type (Employer or Candidate).
 *     responses:
 *       200:
 *         description: User profile details fetched successfully
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
 *                   description: User profile data (employer or candidate)
 *       404:
 *         description: User or profile not found
 */

/**
 * @openapi
 * /api/profile:
 *   put:
 *     tags:
 *       - User
 *     summary: Update user profile
 *     description: Updates the user's profile data including phone number, location, resume, and profile picture.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profile_pic:
 *                 type: string
 *                 format: binary
 *               resume:
 *                 type: string
 *                 format: binary
 *               phone_number:
 *                 type: string
 *                 example: "+1234567890"
 *               location:
 *                 type: string
 *               position:
 *                 type: string
 *               nationality:
 *                 type: string
 *               total_experience:
 *                 type: integer
 *               education:
 *                 type: string
 *               expected_sal:
 *                 type: integer
 *               current_sal:
 *                 type: integer
 *               certifications:
 *                 type: string
 *               bio:
 *                 type: string
 *               headline:
 *                 type: string
 *               previous_experience:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or invalid file type
 *       404:
 *         description: User profile not found
 */
