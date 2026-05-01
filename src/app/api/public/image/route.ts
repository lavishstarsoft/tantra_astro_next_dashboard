import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const r2Bucket = process.env.R2_BUCKET_NAME;

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

function isAllowedRemote(url: URL): boolean {
  return ['http:', 'https:'].includes(url.protocol);
}

function normalizeR2PublicUrl(url: URL): URL {
  if (!r2Bucket) return url;
  if (!url.hostname.endsWith('.r2.dev')) return url;
  // For bucket-scoped custom domains, old records may include /<bucket>/...
  // Strip it to avoid 404 responses.
  const prefixed = `/${r2Bucket}/`;
  if (url.pathname.startsWith(prefixed)) {
    const cloned = new URL(url.toString());
    cloned.pathname = cloned.pathname.slice(r2Bucket.length + 1);
    return cloned;
  }
  return url;
}

async function streamToBuffer(stream: AsyncIterable<Uint8Array>) {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function getR2ObjectViaCredentials(url: URL): Promise<{ body: Buffer; contentType: string } | null> {
  if (!r2Client || !r2Bucket || !url.hostname.endsWith('.r2.cloudflarestorage.com')) {
    return null;
  }
  const trimmed = url.pathname.replace(/^\/+/, '');
  if (!trimmed.startsWith(`${r2Bucket}/`)) {
    return null;
  }
  const key = trimmed.slice(r2Bucket.length + 1);
  if (!key) {
    return null;
  }

  const obj = await r2Client.send(
    new GetObjectCommand({
      Bucket: r2Bucket,
      Key: key,
    })
  );

  if (!obj.Body || !(Symbol.asyncIterator in obj.Body)) {
    return null;
  }

  const body = await streamToBuffer(obj.Body as AsyncIterable<Uint8Array>);
  return { body, contentType: obj.ContentType ?? 'application/octet-stream' };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('url');
  if (!raw) {
    return NextResponse.json({ error: 'Missing url query param' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  if (!isAllowedRemote(parsed)) {
    return NextResponse.json({ error: 'Unsupported protocol' }, { status: 400 });
  }
  parsed = normalizeR2PublicUrl(parsed);

  try {
    const fromR2 = await getR2ObjectViaCredentials(parsed);
    if (fromR2) {
      return new NextResponse(fromR2.body as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': fromR2.contentType,
          'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
      });
    }

    const upstream = await fetch(parsed.toString(), {
      method: 'GET',
      cache: 'no-store',
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream failed with ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const arr = await upstream.arrayBuffer();
    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';

    return new NextResponse(arr, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  } catch (error) {
    console.error('Image proxy failed', error);
    return NextResponse.json({ error: 'Image proxy failed' }, { status: 502 });
  }
}
