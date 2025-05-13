import connectMongoDB from '@/lib/mongodb';
import Employer from '@/models/employer';
import Candidate from '@/models/candidate';
import Users from '@/models/users';
import EmployerCandidateBookmark from '@/models/employerCandidateBookmark';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import { ApiError } from '@/utils/commonError';

export const GET = withApiHandler(async request => {
  await connectMongoDB();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const userType = searchParams.get('user_type');
  const skip = (page - 1) * limit;
  const userDetails = JSON.parse(request.headers.get('x-user'));
  const sortBy = searchParams.get('sortBy');
  const sort = !sortBy ? { createdAt: -1 } : { createdAt: sortBy === 'asc' ? -1 : 1 };
  if (!userType) {
    throw new ApiError('user_type is required', 400);
  }
  let list = [],
    total = 0;
  if (userType === 'Employer') {
    const employerList = await Employer.find()
      .populate('user', '-password -verificationToken -__v')
      .select('-__v')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    list = employerList.map(employer => {
      const { user, ...rest } = employer.toObject();
      return {
        ...rest,
        ...user,
      };
    });
    total = await Employer.countDocuments();
  } else if (userType === 'Candidate') {
    if (!userDetails || !userDetails.id) {
      throw new ApiError('Token not found', 401);
    }
    const candidateList = await Candidate.find()
      .select('profile_url resume_url location total_experience position')
      .populate({
        path: 'user',
        select: '-password -__v -createdAt -updatedAt -verificationToken',
      })
      .select('-__v -createdAt -updatedAt')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    total = await Candidate.countDocuments();

    const candidateUserIds = candidateList.map(c => c.user._id.toString());

    const bookmarkedCandidates = await EmployerCandidateBookmark.find({
      employer: userDetails.id,
      candidate: { $in: candidateUserIds },
    }).lean();

    const bookmarkMap = {};
    bookmarkedCandidates.forEach(bm => {
      bookmarkMap[bm.candidate.toString()] = bm._id.toString();
    });

    list = candidateList.map(candidate => {
      const { user, ...rest } = candidate.toObject();
      const { _id, ...restUser } = user;
      const userId = user._id.toString();

      return {
        ...rest,
        ...restUser,
        profile_url: candidate.profile_url || '',
        resume_url: candidate.resume_url || '',
        location: candidate.location || '',
        total_experience: candidate.total_experience ?? 0,
        position: candidate.position || '',
        user: _id,
        isBookmarked: !!bookmarkMap[userId],
        bookmarkId: bookmarkMap[userId] || null,
      };
    });
  }
  return successResponse(list, 'list fetched successfully', 200, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

/**
 * @openapi
 * /api/profileList:
 *   get:
 *     tags:
 *       - User
 *     summary: Get a list of candidates or employers
 *     description: Fetches a paginated list of candidates or employers with optional bookmarking information for candidates.
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
 *         name: user_type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Employer, Candidate]
 *         description: User type to filter by (Employer or Candidate)
 *     responses:
 *       200:
 *         description: Successfully fetched list of users (employers or candidates)
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
 *                         description: User ID
 *                       full_name:
 *                         type: string
 *                         description: Full name of the user
 *                       user_name:
 *                         type: string
 *                         description: Username of the user
 *                       email:
 *                         type: string
 *                         description: Email address of the user
 *                       location:
 *                         type: string
 *                         description: Location of the candidate (if user_type is Candidate)
 *                       total_experience:
 *                         type: integer
 *                         description: Total years of experience (if user_type is Candidate)
 *                       position:
 *                         type: string
 *                         description: Position the candidate is seeking (if user_type is Candidate)
 *                       isBookmarked:
 *                         type: boolean
 *                         description: Whether the user has bookmarked the candidate (if user_type is Candidate)
 *                       bookmarkId:
 *                         type: string
 *                         description: ID of the bookmark (if user_type is Candidate and bookmarked)
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of items available
 *                     page:
 *                       type: integer
 *                       description: Current page number
 *                     limit:
 *                       type: integer
 *                       description: Limit of items per page
 *                     totalPages:
 *                       type: integer
 *                       description: Total number of pages
 *       400:
 *         description: Invalid user type or missing required parameters
 *       401:
 *         description: Token not found or invalid
 *       500:
 *         description: Internal server error
 */
