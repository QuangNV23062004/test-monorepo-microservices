import paypal from 'paypal-rest-sdk';
import dotenv from 'dotenv';
dotenv.config();
// Environment Configuration
paypal.configure({
  mode: process.env.PAYPAL_PAYMENT_MODE as string,
  client_id: process.env.PAYPAL_CLIENT_ID as string,
  client_secret: process.env.PAYPAL_CLIENT_SECRET as string,
});

export default paypal;
