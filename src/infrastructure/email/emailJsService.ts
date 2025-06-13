// src/shared/services/emailService.ts
import axios from 'axios';

const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID!;
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID!;
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY!;

export const sendResetPasswordEmail = async ({
  to_email,
  to_name,
  reset_link,
}: {
  to_email: string;
  to_name: string;
  reset_link: string;
}) => {
  const payload = {
    service_id: EMAILJS_SERVICE_ID,
    template_id: EMAILJS_TEMPLATE_ID,
    user_id: EMAILJS_PUBLIC_KEY,
    template_params: {
      to_email,
      to_name,
      reset_link,
    },
  };

  try {
    const res = await axios.post('https://api.emailjs.com/api/v1.0/email/send', payload);
    console.log('✅ Email sent successfully', res.data);
  } catch (error: any) {
    console.error('❌ Error sending email:', error.response?.data || error.message);
    throw new Error('فشل إرسال البريد الإلكتروني.');
  }
};
