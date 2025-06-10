import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import { ApiError } from '@/utils/commonError';
import connectMongoDB from '@/lib/mongodb';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const POST = withApiHandler(async request => {
  await connectMongoDB();

  const userDetails = JSON.parse(request.headers.get('x-user') || '{}');

  if (userDetails.user_type !== 'Employer') {
    throw new ApiError('Unauthorized request', 401);
  }

  const { plan, paymentMode, successUrl, cancelUrl, email } = await request.json();

  if (!plan || !plan.name || !plan.price || !plan.currency?.name) {
    throw new ApiError('Invalid plan details', 400);
  }

  const priceData = await paymentMode === "payment" ? {
    price_data: {
      currency: plan.currency.name.toLowerCase(),
      product_data: {
        name: plan.name,
        description: plan.features?.join(', ') || 'Subscription plan',
      },
      unit_amount: plan.price * 100,
    },
    price: plan.priceId,
    quantity: 1,
  } : {
    price: plan.priceId,
    quantity: 1,
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: paymentMode,
    line_items: [
      priceData
    ],
    metadata: {
      userId: userDetails.id,
      planName: plan.name,
      planData: JSON.stringify(plan)
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: email,
  });

  return successResponse({ id: session.id }, 'Stripe session created', 200);
});
