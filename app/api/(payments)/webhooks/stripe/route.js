import connectMongoDB from "@/lib/mongodb";
import { stripe } from "@/lib/strip";
import Invoice from "@/models/invoice";
import Subscription from "@/models/subscription";
import Users from "@/models/users";
import { ApiError } from "@/utils/commonError";
import { successResponse } from "@/utils/commonHandlers";
import { headers } from "next/headers";
import { NextResponse } from "next/server";;

export async function POST(req) {
    const body = await req.text()
    const signature = await headers().get("Stripe-Signature");

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch (error) {
        throw new ApiError(`Webhook Error: ${err.message}`, 400);
    }

    await connectMongoDB();

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const userId = session.metadata.userId;
        const planName = session.metadata.planName;
        const planData = JSON.parse(session.metadata.planData)

        const startDate = new Date();
        const endDate = new Date();

        if (planData.duration === '/month') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else if (planData.duration === '/year') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
            throw new Error('Invalid plan duration. Expected "/month" or "/year".');
        }
        
        const subscriptionRes = await Subscription.create({
            user: userId,
            planName,
            planData: planData,
            status: 'active',
            startDate,
            endDate,
            paymentMethod: 'card',
        });


        await Invoice.create({
            user: userId,
            subscription: subscriptionRes._id,
            invoiceNumber: session.id,
            paymentId: session.payment_intent,
            amount: session.amount_total / 100,
            currency: session.currency.toUpperCase(),
            status: 'paid',
            paidAt: new Date(),
        });

        const user = await Users.findByIdAndUpdate(userId, {
            currentSubscription: subscriptionRes._id,
        });

        return successResponse(user, 'Subscription has been done successfully', 200);
    }

    if (event.type === 'payment_intent.payment_failed') {
        const intent = event.data.object;
        console.error(`Payment failed for PaymentIntent ${intent.id}`);
    }


    return new NextResponse('Subscription has been done successfully', { status: 200 });


}