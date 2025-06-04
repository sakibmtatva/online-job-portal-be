import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { withApiHandler } from './utils/commonHandlers';
import { ApiError } from './utils/commonError';
import { rateLimit } from './lib/rateLimiter';
const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET);

const publicRoutes = [
  '/api/login',
  '/api/signup',
  '/api/skills',
  '/api/verify-email',
  '/api/forgot-password',
  '/api/verify-otp',
  '/api/reset-password',
  '/api/job-categories',
  '/api/cities',
  '/api/contactus',
];

const publicPrivateRoutes = ['/api/jobs', '/api/profileList', '/api/employerjobs', '/api/swagger'];

export const middleware = withApiHandler(async request => {
  const response = NextResponse.next();

  response.headers.set('Access-Control-Allow-Origin', '*');

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: response.headers,
    });
  }

  if (!rateLimit(request.ip)) {
    throw new ApiError('Too many requests', 429);
  }

  const { pathname } = request.nextUrl;

  if (publicRoutes.includes(pathname)) {
    return response;
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token && !publicPrivateRoutes.some(route => pathname.startsWith(route))) {
    throw new ApiError('Token not found', 401);
  }

  if (token || !publicPrivateRoutes.some(route => pathname.startsWith(route))) {
    try {
      const { payload } = await jwtVerify(token, getSecret());
      response.headers.set('x-user', JSON.stringify(payload));
      console.log('Verified:', payload);
    } catch (error) {
      throw new ApiError('Token is expired', 401);
    }
  }
  return response;
});

export const config = {
  matcher: '/api/:path*',
};
