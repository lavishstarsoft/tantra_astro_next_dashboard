'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';

import { SignOutButton } from '@/components/sign-out-button';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/dashboard', label: 'Overview', icon: 'overview' },
  { href: '/dashboard/content/videos', label: 'Videos', icon: 'videos' },
  { href: '/dashboard/content/videos/new', label: 'New', icon: 'new' },
  { href: '/dashboard/content/categories', label: 'Categories', icon: 'categories' },
  { href: '/dashboard/content/carousel', label: 'Carousel', icon: 'pages' },
  { href: '/dashboard/content/home', label: 'Home Control', icon: 'pages' },
  { href: '/dashboard/content/pages', label: 'App Pages', icon: 'pages' },
  { href: '/dashboard/users', label: 'Registered Users', icon: 'users' },
  { href: '/dashboard/commerce/orders', label: 'Orders', icon: 'orders' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: 'analytics' },
] as const;

type NavIconKey = (typeof nav)[number]['icon'];

function MenuIcon({ icon }: { icon: NavIconKey }) {
  const common = 'h-[18px] w-[18px]';

  switch (icon) {
    case 'overview':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V10.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'videos':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M10 9.5v5l4-2.5-4-2.5Z" fill="currentColor" />
        </svg>
      );
    case 'new':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'categories':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
          <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case 'pages':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <path d="M6 4h9l3 3v13H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M15 4v4h4" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8.5 12h7M8.5 16h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'orders':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <path d="M6 7h12l-1 10H7L6 7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 7a3 3 0 0 1 6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'users':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M4.5 18a4.5 4.5 0 0 1 9 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="17" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M14.5 18a3.5 3.5 0 0 1 5 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'analytics':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <path d="M5 19V10M12 19V5M19 19v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

export function DashboardShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const activeHref =
    [...nav]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))
      ?.href ?? '/dashboard';
  const userName = email.split('@')[0];

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    // Warm dashboard routes in background for faster tab-to-tab navigation.
    for (const item of nav) {
      if (item.href === activeHref) continue;
      router.prefetch(item.href);
    }
  }, [activeHref, router]);

  return (
    <div className="flex min-h-screen bg-[#f4f7fb] text-slate-800">
      <aside
        className={cn(
          'relative hidden shrink-0 flex-col border-r border-slate-200 bg-white py-4 shadow-sm transition-all duration-200 md:flex',
          isSidebarOpen ? 'w-64 items-stretch px-3' : 'w-20 items-center'
        )}>
        <div className={cn('mb-6 flex items-center', isSidebarOpen ? 'justify-between' : 'justify-center')}>
          <div
            className={cn(
              'flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white',
              isSidebarOpen ? 'h-11 w-[184px] justify-start px-2' : 'h-11 w-11 justify-center'
            )}>
            <Image
              src="/thantra-logo.png"
              alt="Thantra LMS"
              width={36}
              height={36}
              className={cn('rounded-lg object-cover', isSidebarOpen ? 'h-7 w-7' : 'h-9 w-9')}
            />
            {isSidebarOpen ? <span className="ml-2 text-sm font-semibold text-slate-700">Thantra LMS</span> : null}
          </div>
          <button
            type="button"
            className={cn(
              'absolute top-6 z-20 h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-sm font-bold text-white shadow-md hover:bg-slate-700',
              isSidebarOpen ? '-right-3 inline-flex' : 'hidden'
            )}
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
            ‹
          </button>
        </div>
        <nav className={cn('flex flex-1 flex-col gap-3', isSidebarOpen ? 'items-stretch' : 'items-center')}>
          {nav.map((item) => {
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                title={item.label}
                className={cn(
                  'flex h-11 items-center rounded-xl border text-sm font-semibold transition',
                  isSidebarOpen ? 'w-full justify-start gap-3 px-3' : 'w-11 justify-center',
                  active
                    ? 'border-sky-300 bg-sky-50 text-sky-600 shadow-sm'
                    : 'border-transparent bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                )}>
                <span className="inline-flex items-center justify-center">
                  <MenuIcon icon={item.icon} />
                </span>
                {isSidebarOpen ? <span className="text-sm font-medium">{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div
          className={cn(
            'mt-4 flex items-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-600',
            isSidebarOpen ? 'h-11 justify-start gap-2 px-3' : 'h-11 w-11 justify-center'
          )}>
          <span>{email.slice(0, 2).toUpperCase()}</span>
          {isSidebarOpen ? <span className="truncate text-[11px] text-slate-700">{email}</span> : null}
        </div>
        {!isSidebarOpen ? (
          <button
            type="button"
            className="absolute right-0 top-6 z-20 hidden h-7 w-7 translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-sm font-bold text-white shadow-md hover:bg-slate-700 md:flex"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label="Expand sidebar">
            ›
          </button>
        ) : null}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative flex h-20 items-center gap-3 border-b border-slate-200 bg-white px-4 md:px-8">
          <div className="flex-1">
            <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
              <span className="text-sm text-slate-400">Search</span>
            </div>
          </div>
          <div ref={profileMenuRef} className="relative ml-auto md:ml-0">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 hover:bg-slate-50 md:flex"
              aria-haspopup="menu"
              aria-expanded={isProfileMenuOpen}>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-700">{userName}</p>
                <p className="text-[11px] text-slate-500">Admin</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700">
                {email.slice(0, 2).toUpperCase()}
              </div>
            </button>
            {isProfileMenuOpen ? (
              <div className="absolute right-0 top-12 z-30 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                <Link
                  href="/dashboard/settings"
                  className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  onClick={() => setIsProfileMenuOpen(false)}>
                  Settings
                </Link>
                <div className="mt-1 border-t border-slate-100 pt-1">
                  <SignOutButton />
                </div>
              </div>
            ) : null}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
