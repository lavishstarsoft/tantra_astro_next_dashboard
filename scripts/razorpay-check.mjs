import { readFile } from 'fs/promises';

const raw = await readFile(new URL('../.env.local', import.meta.url), 'utf8');
const env = {};
for (const line of raw.split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2];
}

function clean(v) {
  if (v == null) return { val: '', note: 'MISSING' };
  let s = v;
  const notes = [];
  if (/^\s/.test(s) || /\s$/.test(s)) notes.push('surrounding whitespace');
  if (/\r$/.test(s)) notes.push('CR line-ending');
  const dq = s.startsWith('"') && s.endsWith('"');
  const sq = s.startsWith("'") && s.endsWith("'");
  if (dq || sq) { notes.push('wrapped in quotes'); s = s.slice(1, -1); }
  s = s.trim();
  return { val: s, note: notes.join(', ') || 'clean' };
}

const kid = clean(env.RAZORPAY_KEY_ID);
const ks = clean(env.RAZORPAY_KEY_SECRET);
const wh = clean(env.RAZORPAY_WEBHOOK_SECRET);

const mode = kid.val.startsWith('rzp_live_') ? 'LIVE'
  : kid.val.startsWith('rzp_test_') ? 'TEST' : 'UNKNOWN prefix (should be rzp_test_ / rzp_live_)';

console.log('key_id  :', mode, '| format:', kid.note, '| len:', kid.val.length);
console.log('secret  : format:', ks.note, '| len:', ks.val.length, '(Razorpay secrets are usually 24)');
console.log('webhook : format:', wh.note, '| len:', wh.val.length, wh.val ? '' : '(EMPTY — auto-grant webhook will fail signature check)');

try {
  const basic = Buffer.from(`${kid.val}:${ks.val}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/orders?count=1', { headers: { Authorization: `Basic ${basic}` } });
  console.log('\nLive Razorpay auth check → HTTP', res.status, res.status === 200 ? 'OK ✓ (keys are valid)' : 'FAILED ✗ (keys wrong / rotated / mode mismatch)');
} catch (e) {
  console.log('\nCould not reach Razorpay:', e?.message ?? e);
}
