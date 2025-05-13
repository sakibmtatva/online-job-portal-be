import { NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import Users from '@/models/users';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { withApiHandler } from '@/utils/commonHandlers';
import { ApiError } from '@/utils/commonError';

const JWT_SECRET = process.env.JWT_SECRET;

export const POST = withApiHandler(async request => {
  const { email, password } = await request.json();

  await connectMongoDB();
  const user = await Users.findOne({ email });
  if (!user) {
    throw new ApiError('Invalid credentials', 401);
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError('Invalid credentials', 401);
  }

  const userObj = user.toObject();
  const { password: userPassword, verificationToken, __v, ...rest } = userObj;

  if (!user.isVerified) {
    return NextResponse.json(
      {
        success: true,
        data: { isVerified: false },
        message: 'We have sent an email for verification. Please verify your email before logging in',
        token: null,
        user: { isVerified: false },
      },
      { status: 200 }
    );
  }

  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      user_type: user.user_type,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return NextResponse.json(
    {
      success: true,
      data: rest,
      message: 'Login successfully',
      token,
      user: rest,
    },
    { status: 200 }
  );
});

/**
 * @openapi
 * /api/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: User login
 *     description: Authenticates a user using email and password. Returns a JWT token if the user is verified.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: yourPassword123
 *     responses:
 *       200:
 *         description: Login successful or user not verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                   nullable: true
 *                   description: JWT token (null if not verified)
 *                 user:
 *                   type: object
 *                   description: User data (excluding sensitive fields)
 *       401:
 *         description: Invalid credentials
 */
