import crypto from 'crypto';

function mustGet(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} must be set`);
  return v;
}

export function getRazorpayKeyId() {
  return mustGet('RAZORPAY_KEY_ID');
}

function getRazorpaySecret() {
  return mustGet('RAZORPAY_KEY_SECRET');
}

export async function createRazorpayOrder(input: {
  amountCents: number; // paise
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}) {
  const keyId = getRazorpayKeyId();
  const secret = getRazorpaySecret();
  const basic = Buffer.from(`${keyId}:${secret}`).toString('base64');

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      amount: input.amountCents,
      currency: input.currency ?? 'INR',
      receipt: input.receipt,
      notes: input.notes ?? {},
    }),
    cache: 'no-store',
  });

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(`Razorpay order create failed: HTTP ${res.status} ${JSON.stringify(json)}`);
  }
  return json as { id: string; amount: number; currency: string; receipt: string; status: string };
}

export function verifyRazorpaySignature(args: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const secret = getRazorpaySecret();
  const body = `${args.orderId}|${args.paymentId}`;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expected === args.signature;
}

