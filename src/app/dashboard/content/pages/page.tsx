'use client';

import { useEffect, useState } from 'react';

type PageState = {
  title: string;
  content: string;
};

const DEFAULT_TERMS_CONTENT = `Welcome to Thantra Astro.

By accessing or using the app, you agree to these Terms & Conditions. Please read carefully before using our services.

1. Eligibility and Account
- You must provide accurate mobile number and profile details.
- You are responsible for keeping your login and OTP secure.
- You are responsible for all activity under your account.

2. Services and Content
- The app provides astrology learning content, videos, and related resources.
- Content is for personal, non-commercial learning use only.
- We may update, remove, or reorganize content without prior notice.

3. Payments and Access
- Paid purchases are processed through supported payment partners.
- Unless required by applicable law, completed purchases are non-refundable.
- Access to purchased content may depend on account status and platform availability.

4. Acceptable Use
- Do not misuse the app, attempt unauthorized access, or disrupt services.
- Do not copy, resell, redistribute, or publicly share paid content.
- Any fraudulent, abusive, or illegal activity may lead to account suspension.

5. Privacy and Data
- We collect account and usage data to operate and improve our services.
- By using the app, you agree to our data handling for authentication, support, and analytics.

6. Limitation of Liability
- The app and content are provided on an "as is" and "as available" basis.
- We are not liable for indirect, incidental, or consequential losses arising from app usage.

7. Changes to Terms
- We may revise these terms from time to time.
- Continued use after updates means you accept the revised terms.

If you have questions, please contact us through the Help Center.`;

const DEFAULT_HELP_CONTENT = `Welcome to the Thantra Astro Help Center.

Frequently Asked Help

1. Login and OTP Issues
- Ensure mobile number is entered correctly.
- Request a fresh OTP if expired.
- Check network signal and SMS inbox delay.

2. Profile Update Issues
- Go to Profile > Edit Profile to update your details.
- Use valid email and date format where required.
- If save fails, log out and log in again, then retry.

3. Purchase and Access Problems
- After payment, give a few seconds for sync.
- Reopen the app or visit My Learning to refresh access.
- If payment succeeded but content is locked, contact support with transaction details.

4. App Performance
- Keep app updated to the latest version.
- Clear background apps and ensure stable internet.
- Restart app if pages are not loading correctly.

5. Contact Support
Please share the following for faster help:
- Registered mobile number
- Issue description and screenshot
- Date/time of issue
- Order/payment reference (if related)

We are committed to helping you quickly and effectively.`;

export default function ContentPagesAdminPage() {
  const [terms, setTerms] = useState<PageState>({ title: 'Terms & Conditions', content: DEFAULT_TERMS_CONTENT });
  const [help, setHelp] = useState<PageState>({ title: 'Help Center', content: DEFAULT_HELP_CONTENT });
  const [invite, setInvite] = useState<PageState>({
    title: 'Invite Friends Link',
    content: 'https://play.google.com/store/apps/details?id=com.thantra.astrolearn',
  });
  const [savingKey, setSavingKey] = useState<'terms' | 'help' | 'invite_playstore_url' | null>(null);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/admin/content-pages', { cache: 'no-store' });
      if (!res.ok) return;
      const json = (await res.json()) as { pages?: Array<{ key: string; title: string; content: string }> };
      const pages = json.pages ?? [];
      const t = pages.find((p) => p.key === 'terms');
      const h = pages.find((p) => p.key === 'help');
      const i = pages.find((p) => p.key === 'invite_playstore_url');
      if (t) setTerms({ title: t.title, content: t.content });
      if (h) setHelp({ title: h.title, content: h.content });
      if (i) setInvite({ title: i.title, content: i.content });
    })();
  }, []);

  const save = async (key: 'terms' | 'help' | 'invite_playstore_url') => {
    const payload = key === 'terms' ? terms : key === 'help' ? help : invite;
    setSavingKey(key);
    setStatus('');
    try {
      const res = await fetch('/api/admin/content-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, ...payload }),
      });
      if (!res.ok) {
        setStatus('Save failed. Please try again.');
        return;
      }
      setStatus(
        key === 'terms'
          ? 'Terms saved successfully.'
          : key === 'help'
            ? 'Help Center saved successfully.'
            : 'Invite link saved successfully.'
      );
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">App Content Pages</h1>
        <p className="mt-1 text-sm text-slate-500">Edit Terms & Conditions and Help Center content for the mobile app.</p>
        {status ? <p className="mt-2 text-sm font-medium text-emerald-700">{status}</p> : null}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-700">Terms & Conditions</h2>
        <div className="mt-4 space-y-3">
          <input
            value={terms.title}
            onChange={(e) => setTerms((prev) => ({ ...prev, title: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
          />
          <textarea
            value={terms.content}
            onChange={(e) => setTerms((prev) => ({ ...prev, content: e.target.value }))}
            rows={10}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
          />
          <button
            type="button"
            onClick={() => void save('terms')}
            disabled={savingKey !== null}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-60">
            {savingKey === 'terms' ? 'Saving...' : 'Save Terms'}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-700">Help Center</h2>
        <div className="mt-4 space-y-3">
          <input
            value={help.title}
            onChange={(e) => setHelp((prev) => ({ ...prev, title: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
          />
          <textarea
            value={help.content}
            onChange={(e) => setHelp((prev) => ({ ...prev, content: e.target.value }))}
            rows={10}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
          />
          <button
            type="button"
            onClick={() => void save('help')}
            disabled={savingKey !== null}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-60">
            {savingKey === 'help' ? 'Saving...' : 'Save Help Center'}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-700">Invite Friends (Play Store Link)</h2>
        <div className="mt-4 space-y-3">
          <input
            value={invite.title}
            onChange={(e) => setInvite((prev) => ({ ...prev, title: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
          />
          <textarea
            value={invite.content}
            onChange={(e) => setInvite((prev) => ({ ...prev, content: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
          />
          <button
            type="button"
            onClick={() => void save('invite_playstore_url')}
            disabled={savingKey !== null}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-60">
            {savingKey === 'invite_playstore_url' ? 'Saving...' : 'Save Invite Link'}
          </button>
        </div>
      </section>
    </div>
  );
}

