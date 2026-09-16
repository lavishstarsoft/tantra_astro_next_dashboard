import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';

const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const r2Bucket = process.env.R2_BUCKET_NAME;
const r2PublicBaseUrl =
  process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, '') ||
  (r2AccountId && r2Bucket
    ? `https://${r2AccountId}.r2.cloudflarestorage.com/${r2Bucket}`
    : undefined);
const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');

const r2Client =
  r2AccountId && r2AccessKeyId && r2SecretAccessKey
    ? new S3Client({
        region: 'auto',
        endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: r2AccessKeyId,
          secretAccessKey: r2SecretAccessKey,
        },
      })
    : null;

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return gate.response;
  }

  if (!r2Client || !r2Bucket || !r2PublicBaseUrl) {
    return NextResponse.json(
      {
        error:
          'R2 storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_BASE_URL in .env',
      },
      { status: 500 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart form-data' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file field' }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'upload';
  const key = `uploads/${Date.now()}-${safeName}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await r2Client.send(
    new PutObjectCommand({
      Bucket: r2Bucket,
      Key: key,
      Body: buf,
      ContentType: file.type || 'application/octet-stream',
    })
  );

  const r2AbsoluteUrl = `${r2PublicBaseUrl}/${key}`;
  const proxyUrl = appBaseUrl
    ? `${appBaseUrl}/api/public/image?url=${encodeURIComponent(r2AbsoluteUrl)}`
    : undefined;
  return NextResponse.json({ url: r2AbsoluteUrl, absoluteUrl: r2AbsoluteUrl, proxyUrl });
}
