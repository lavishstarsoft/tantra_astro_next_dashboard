import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

const DEFAULT_PAGES: Record<string, { title: string; content: string }> = {
  terms: {
    title: 'Terms & Conditions',
    content:
      'Welcome to Thantra Astro.\n\nBy accessing or using the app, you agree to these Terms & Conditions. Please read carefully before using our services.\n\n1. Eligibility and Account\n- You must provide accurate mobile number and profile details.\n- You are responsible for keeping your login and OTP secure.\n- You are responsible for all activity under your account.\n\n2. Services and Content\n- The app provides astrology learning content, videos, and related resources.\n- Content is for personal, non-commercial learning use only.\n- We may update, remove, or reorganize content without prior notice.\n\n3. Payments and Access\n- Paid purchases are processed through supported payment partners.\n- Unless required by applicable law, completed purchases are non-refundable.\n- Access to purchased content may depend on account status and platform availability.\n\n4. Acceptable Use\n- Do not misuse the app, attempt unauthorized access, or disrupt services.\n- Do not copy, resell, redistribute, or publicly share paid content.\n- Any fraudulent, abusive, or illegal activity may lead to account suspension.\n\n5. Privacy and Data\n- We collect account and usage data to operate and improve our services.\n- By using the app, you agree to our data handling for authentication, support, and analytics.\n\n6. Limitation of Liability\n- The app and content are provided on an \"as is\" and \"as available\" basis.\n- We are not liable for indirect, incidental, or consequential losses arising from app usage.\n\n7. Changes to Terms\n- We may revise these terms from time to time.\n- Continued use after updates means you accept the revised terms.\n\nIf you have questions, please contact us through the Help Center.',
  },
  help: {
    title: 'Help Center',
    content:
      'Welcome to the Thantra Astro Help Center.\n\nFrequently Asked Help\n\n1. Login and OTP Issues\n- Ensure mobile number is entered correctly.\n- Request a fresh OTP if expired.\n- Check network signal and SMS inbox delay.\n\n2. Profile Update Issues\n- Go to Profile > Edit Profile to update your details.\n- Use valid email and date format where required.\n- If save fails, log out and log in again, then retry.\n\n3. Purchase and Access Problems\n- After payment, give a few seconds for sync.\n- Reopen the app or visit My Learning to refresh access.\n- If payment succeeded but content is locked, contact support with transaction details.\n\n4. App Performance\n- Keep app updated to the latest version.\n- Clear background apps and ensure stable internet.\n- Restart app if pages are not loading correctly.\n\n5. Contact Support\nPlease share the following for faster help:\n- Registered mobile number\n- Issue description and screenshot\n- Date/time of issue\n- Order/payment reference (if related)\n\nWe are committed to helping you quickly and effectively.',
  },
  invite_playstore_url: {
    title: 'Invite Friends Link',
    content: 'https://play.google.com/store/apps/details?id=com.thantra.astrolearn',
  },
};

type Ctx = { params: Promise<{ key: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { key } = await ctx.params;
  if (!['terms', 'help', 'invite_playstore_url'].includes(key)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const page = await prisma.appContentPage.findUnique({ where: { key } });
  if (!page) {
    const fallback = DEFAULT_PAGES[key];
    return NextResponse.json({
      ok: true,
      page: { key, title: fallback.title, content: fallback.content, updatedAt: null },
    });
  }

  return NextResponse.json({
    ok: true,
    page: { key: page.key, title: page.title, content: page.content, updatedAt: page.updatedAt.toISOString() },
  });
}

