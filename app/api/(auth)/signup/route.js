import connectMongoDB from '@/lib/mongodb';
import Users from '@/models/users';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import Candidate from '@/models/candidate';
import Employer from '@/models/employer';
import { SignupValidationSchema } from '@/utils/validation-schemas';
import { sendVerificationEmail } from '@/utils/email-service';
import crypto from 'crypto';
import { withApiHandler } from '@/utils/commonHandlers';
import { ApiError } from '@/utils/commonError';

export const POST = withApiHandler(async request => {
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
  const body = await request.json();
  const { full_name, user_name, email, password, user_type } = body;
  SignupValidationSchema.parse(body);

  await connectMongoDB();

  const existingUserEmail = await Users.findOne({ email });
  if (existingUserEmail) {
    throw new ApiError('Email is already in use.', 400);
  }

  const existingUserName = await Users.findOne({ user_name });
  if (existingUserName) {
    throw new ApiError('User name is already in use.', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString('hex');

  try {
    await sendVerificationEmail(email, full_name, verificationToken);
  } catch (error) {
    throw new ApiError('Failed to send verification email', 500);
  }

  const newUser = await Users.create({
    full_name,
    user_name,
    email,
    password: hashedPassword,
    user_type,
    verificationToken,
    isVerified: false,
  });
  if (user_type === 'Candidate') {
    await Candidate.create({ user: newUser._id });
  } else if (user_type === 'Employer') {
    await Employer.create({ user: newUser._id });
  }

  return NextResponse.json(
    {
      message: 'User created successfully. Please check your email to verify your account.',
      data: newUser,
      success: true,
    },
    {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
});

/**
 * @openapi
 * /api/signup:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     description: Creates a new user account and sends an email verification link. Supports Candidate and Employer roles.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - user_name
 *               - email
 *               - password
 *               - user_type
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: John Doe
 *               user_name:
 *                 type: string
 *                 example: johndoe123
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongPass123
 *               user_type:
 *                 type: string
 *                 enum: [Candidate, Employer]
 *                 example: Candidate
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                   description: User object (excluding password)
 *       400:
 *         description: Validation error or duplicate email/username
 */
