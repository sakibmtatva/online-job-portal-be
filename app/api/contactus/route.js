import connectMongoDB from '@/lib/mongodb';
import { ContactUsValidataionSchema } from '@/utils/validation-schemas';
import { successResponse, withApiHandler } from '@/utils/commonHandlers';
import ContactUS from '@/models/contact';
import { sendContactMail } from '@/utils/email-service';

export const POST = withApiHandler(async request => {
  const body = await request.json();
  const { name, email, subject, message } = body;
  ContactUsValidataionSchema.parse(body);
  await connectMongoDB();
  const contact = await ContactUS.create({
    name,
    email,
    message,
    subject,
  });
  await sendContactMail(contact);
  return successResponse(contact, 'Your Message Sent SuccessFully', 201);
});
