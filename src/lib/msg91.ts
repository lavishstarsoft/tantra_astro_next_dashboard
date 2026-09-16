import crypto from 'crypto';

function mustGet(name: string) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`${name} must be set`);
  }
  return v;
}

const MSG91_BASE_URL = 'https://control.msg91.com/api/v5';

export function generateOtp(): string {
  const n = crypto.randomInt(0, 1_000_000);
  return String(n).padStart(6, '0');
}

function cleanPhoneNumber(phone: string) {
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('91') && p.length > 10) {
    p = p.slice(2);
  }
  return p;
}

function formatPhoneForMSG91(phoneE164: string) {
  return `91${cleanPhoneNumber(phoneE164)}`;
}

export async function sendOtpSms(phoneE164: string, otp: string) {
  const authKey = mustGet('MSG91_AUTH_KEY');
  const templateId = mustGet('MSG91_TEMPLATE_ID');
  const senderId = process.env.MSG91_SENDER_ID;
  const formattedMobile = formatPhoneForMSG91(phoneE164);

  const requestPayload = {
    template_id: templateId,
    sender: senderId,
    short_url: '0',
    mobiles: formattedMobile,
    var: otp,
  };

  // Safe diagnostics: never log full auth key or full OTP.
  const debugMeta = {
    mobile: formattedMobile,
    templateId,
    flowId: null,
    senderId: senderId ?? null,
    otpLength: otp.length,
    url: `${MSG91_BASE_URL}/flow/`,
  };

  const res = await fetch(`${MSG91_BASE_URL}/flow/`, {
    method: 'POST',
    headers: {
      authkey: authKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(requestPayload),
    cache: 'no-store',
  });

  const rawText = await res.text();
  if (!res.ok) {
    console.error('MSG91 HTTP error', { status: res.status, response: rawText, request: debugMeta });
    throw new Error(`MSG91 send failed: HTTP ${res.status} ${rawText}`);
  }

  let responsePayload: Record<string, unknown> = {};
  try {
    responsePayload = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new Error(`MSG91 send failed: invalid JSON response "${rawText}"`);
  }

  if (responsePayload?.type === 'error' || responsePayload?.error || responsePayload?.message === 'error') {
    console.error('MSG91 payload rejected', {
      payload: responsePayload,
      request: debugMeta,
      requestBody: { ...requestPayload, var: '***redacted-otp***' },
    });
    throw new Error(`MSG91 send rejected: ${JSON.stringify(responsePayload)}`);
  }

  console.log('MSG91 OTP accepted', { request: debugMeta, payload: responsePayload });
  return responsePayload;
}

