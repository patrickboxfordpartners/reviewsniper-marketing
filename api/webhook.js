import Stripe from 'stripe';
import { buffer } from 'micro';

export const config = {
  api: {
    bodyParser: false, // Disables Vercel's default body parsing so we can verify the signature
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // 1. Get the raw body buffer for signature verification
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    // 2. Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 3. Handle the specific event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // --- YOUR LOGIC GOES HERE ---
    // Since this is a marketing site without a DB, we log the success.
    // In the future, you would use 'fetch' here to tell your 
    // main app (app.reviewsniper.app) that this user paid.
    console.log(`✅ Payment successful for user: ${session.customer_email}`);
    console.log(`💰 Amount: ${session.amount_total / 100} ${session.currency}`);
  }

  // 4. Return a 200 response to acknowledge receipt
  res.status(200).json({ received: true });
}
