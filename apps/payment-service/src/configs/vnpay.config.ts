import dotenv from 'dotenv';

dotenv.config();

export const vnpayConfig = {
  vnp_TmnCode: process.env.VNP_TMNCODE as string,
  vnp_HashSecret: process.env.VNP_HASHSECRET as string,
  vnp_Url: process.env.VNP_PAYMENT_URL,
  vnp_Api: process.env.VNP_PAYMENT_API,
};
