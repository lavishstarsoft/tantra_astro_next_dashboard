'use client';

import Link from 'next/link';
import { useLinkStatus } from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

import { SignOutButton } from '@/components/sign-out-button';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Navigation model                                                    */
/* ------------------------------------------------------------------ */

type IconKey =
  | 'overview'
  | 'analytics'
  | 'videos'
  | 'new'
  | 'arrange'
  | 'categories'
  | 'carousel'
  | 'home'
  | 'pages'
  | 'upcoming'
  | 'notifications'
  | 'practice'
  | 'users'
  | 'deletion'
  | 'orders'
  | 'settings';

type NavItem = { href: string; label: string; icon: IconKey };
type NavGroup = { heading: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    heading: 'General',
    items: [
      { href: '/dashboard', label: 'Overview', icon: 'overview' },
      { href: '/dashboard/analytics', label: 'Analytics', icon: 'analytics' },
    ],
  },
  {
    heading: 'Content',
    items: [
      { href: '/dashboard/content/videos', label: 'Courses & Videos', icon: 'videos' },
      { href: '/dashboard/content/videos/new', label: 'Create New', icon: 'new' },
      { href: '/dashboard/content/arrange', label: 'Display Order', icon: 'arrange' },
      { href: '/dashboard/content/categories', label: 'Categories', icon: 'categories' },
      { href: '/dashboard/content/carousel', label: 'Carousel', icon: 'carousel' },
      { href: '/dashboard/shorts', label: 'Quick Lessons', icon: 'carousel' },
      { href: '/dashboard/content/home', label: 'Home Control', icon: 'home' },
      { href: '/dashboard/content/pages', label: 'App Pages', icon: 'pages' },
      { href: '/dashboard/content/upcoming', label: 'Upcoming', icon: 'upcoming' },
    ],
  },
  {
    heading: 'Engagement',
    items: [
      { href: '/dashboard/notifications', label: 'Notifications', icon: 'notifications' },
      { href: '/dashboard/practice', label: 'Practice & Master', icon: 'practice' },
    ],
  },
  {
    heading: 'People & Sales',
    items: [
      { href: '/dashboard/users', label: 'Registered Users', icon: 'users' },
      { href: '/dashboard/deletion-requests', label: 'Deletion Requests', icon: 'deletion' },
      { href: '/dashboard/commerce/orders', label: 'Orders', icon: 'orders' },
    ],
  },
];

const flatNav: NavItem[] = navGroups.flatMap((g) => g.items).concat({ href: '/dashboard/settings', label: 'Settings', icon: 'settings' });

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

function Icon({ icon, className }: { icon: IconKey; className?: string }) {
  const c = cn('h-[18px] w-[18px]', className);
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (icon) {
    case 'overview':
      return (
        <svg viewBox="0 0 24 24" className={c} aria-hidden>
          <rect x="3" y="3" width="7" height="9" rx="1.6" {...p} />
          <rect x="14" y="3" width="7" height="5" rx="1.6" {...p} />
          <rect x="14" y="12" width="7" height="9" rx="1.6" {...p} />
          <rect x="3" y="16" width="7" height="5" rx="1.6" {...p} />
        </svg>
      );
    case 'analytics':
      return (
        <svg viewBox="0 0 24 24" className={c} aria-hidden>
          <path d="M4 19h16" {...p} />
          <path d="M7 16v-4M12 16V6M17 16v-7" {...p} />
        </svg>
      );
    case 'videos':
      return (
        <svg viewBox="0 0 24 24" className={c} aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2.5" {...p} />
          <path d="M10 9.5v5l4-2.5-4-2.5Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'new':
      return (
        <svg viewBox="0 0 24 24" className={c} aria-hidden>
          <circle cx="12" cy="12" r="8.5" {...p} />
          <path d="M12 8.5v7M8.5 12h7" {...p} />
        </svg>
      );
    case 'categories':
      return (
        <svg viewBox="0 0 24 24" className={c} aria-hidden>
          <rect x="4" y="4" width="7" height="7" rx="1.6" {...p} />
          <rect x="13" y="4" width="7" height="7" rx="1.6" {...p} />
          <rect x="4" y="13" width="7" height="7" rx="1.6" {...p} />
          <rect x="13" y="13" width="7" height="7" rx="1.6" {...p} />
        </svg>
      );
    case 'arrange':
      return (
        <svg viewBox="0 0 24 24" className={c} aria-hidden>
          <path d="M8 6h12M8 12h12M8 18h12" {...p} />
          <path d="M4 8V5m0 0L2.5 6.5M4 5l1.5 1.5M4 16v3m0 0 1.5-1.5M4 19l-1.5-1.5" {...p} />
        </svg>
      );
    case 'carousel':
      return (
        <svg viewBox="0 0 24 24" className={c} aria-hidden>
          <rect x="6" y="6" width="12" height="12" rx="2" {...p} />
          <path d="M3 9v6M21 9v6" {...p} />
        </svg>
      );
    case 'home':
      return (
        <svg viewBox="0 0 24 24" className={c} aria-hidden>
          <path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8.5Z" {...p} />
        </svg>
      );
    case 'pages':
      return (
        <svg viewBox="0 0 24 24" className={c} aria-hidden>
          <path d="M6 4h9l3 3v13H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" {...p} />
          <path d="M15 4v4h4M8.5 12h7M8.5 16h5" {...p} />
        </svg>
      );
    case 'upcoming':
      return (
        <svg viewBox="0 0 24 24" className={c} aria-hidden>
          <circle cx="12" cy="12" r="8.5" {...p} />
          <path d="M12 8v4l2.5 2.5" {...p} />
        </svg>
      );
    case 'notifications':
      return (
        <svg viewBox="0 0 24 24" className={c} aria-hidden>
          <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5 2 6H4c.5-1 2-2 2-6Z" {...p} />
          <path d="M10 19a2 2 0 0 0 4 0" {...p} />
        </svg>
      );
    case 'practice':
      return (
        <svg viewBox="0 0 24 24" className={c} aria-hidden>
          <path d="m12 3 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L5.1 8.7l5.4-.8L12 3Z" {...p} />
        </svg>
      );
    case 'users':
      return (
        <svg viewBox="0 0 24 24" className={c} aria-hidden>
          <circle cx="9" cy="8.5" r="3" {...p} />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0" {...p} />
          <circle cx="17.5" cy="9.5" r="2.3" {...p} />
          <path d="M15 19a4 4 0 0 1 6.5-3.1" {...p} />
        </svg>
      );
    case 'deletion':
      return (
        <svg viewBox="0 0 24 24" className={c} aria-hidden>
          <path d="M5 7h14M9 7V5h6v2M7 7l1 12h8l1-12" {...p} />
        </svg>
      );
    case 'orders':
      return (
        <svg viewBox="0 0 24 24" className={c} aria-hidden>
          <path d="M6 7h12l-1 11H7L6 7Z" {...p} />
          <path d="M9 7a3 3 0 0 1 6 0" {...p} />
        </svg>
      );
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" className={c} aria-hidden>
          <circle cx="12" cy="12" r="3" {...p} />
          <path d="M19.4 13.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H23a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1.5Z" {...p} strokeWidth={1.3} />
        </svg>
      );
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Nav link with built-in pending indicator (fixes "nothing happens")  */
/* ------------------------------------------------------------------ */

function LinkInner({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const { pending } = useLinkStatus();
  return (
    <>
      <span className="relative inline-flex h-5 w-5 items-center justify-center">
        {pending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80" />
        ) : (
          <Icon icon={item.icon} />
        )}
      </span>
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />}
    </>
  );
}

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      prefetch
      title={item.label}
      onClick={onNavigate}
      className={cn(
        'group flex h-10 items-center rounded-xl text-sm font-medium transition',
        collapsed ? 'w-10 justify-center' : 'gap-3 px-3',
        active
          ? 'bg-brand-50 text-brand-700 shadow-[inset_0_0_0_1px_rgb(199_210_254)]'
          : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
      )}>
      <LinkInner item={item} active={active} collapsed={collapsed} />
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

export function DashboardShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);

  const userName = email.split('@')[0];
  const initials = email.slice(0, 2).toUpperCase();

  const activeHref = useMemo(
    () =>
      [...flatNav]
        .sort((a, b) => b.href.length - a.href.length)
        .find((i) => pathname === i.href || (i.href !== '/dashboard' && pathname.startsWith(i.href)))?.href ?? '/dashboard',
    [pathname]
  );
  const activeItem = flatNav.find((i) => i.href === activeHref);

  // Restore sidebar collapse preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dash:collapsed');
      if (saved) setCollapsed(saved === '1');
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('dash:collapsed', collapsed ? '1' : '0');
    } catch {}
  }, [collapsed]);

  // Close mobile drawer / profile on route change
  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  // Close profile on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return flatNav.filter((i) => i.label.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  const SidebarContent = ({ inDrawer = false }: { inDrawer?: boolean }) => {
    const isCollapsed = collapsed && !inDrawer;
    return (
      <>
        {/* Brand */}
        <div className={cn('flex items-center', isCollapsed ? 'justify-center' : 'gap-2.5 px-1')}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 shadow-glow">
            <Image src="/thantra-logo.png" alt="Thantra" width={28} height={28} className="h-7 w-7 rounded-md object-cover" />
          </div>
          {!isCollapsed && (
            <div className="leading-tight">
              <p className="text-sm font-bold text-ink">Thantra LMS</p>
              <p className="text-[11px] text-ink-soft">Admin Console</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="mt-6 flex-1 space-y-5 overflow-y-auto pr-0.5">
          {navGroups.map((group) => (
            <div key={group.heading}>
              {!isCollapsed && (
                <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-ink-soft">{group.heading}</p>
              )}
              <div className={cn('space-y-1', isCollapsed && 'flex flex-col items-center')}>
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={item.href === activeHref}
                    collapsed={isCollapsed}
                    onNavigate={inDrawer ? () => setMobileOpen(false) : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer / account */}
        <div className="mt-4 border-t border-line pt-3">
          <NavLink item={{ href: '/dashboard/settings', label: 'Settings', icon: 'settings' }} active={activeHref === '/dashboard/settings'} collapsed={isCollapsed} onNavigate={inDrawer ? () => setMobileOpen(false) : undefined} />
          {!isCollapsed && (
            <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-surface-2 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{initials}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-ink">{userName}</p>
                <p className="truncate text-[11px] text-ink-soft">{email}</p>
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-surface p-3 transition-[width] duration-200 md:flex',
          collapsed ? 'w-[76px]' : 'w-[264px]'
        )}>
        <SidebarContent />
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-16 z-20 hidden h-6 w-6 items-center justify-center rounded-full border border-line bg-surface text-ink-muted shadow-card hover:text-brand-600 md:flex">
          <svg viewBox="0 0 24 24" className={cn('h-3.5 w-3.5 transition-transform', collapsed && 'rotate-180')} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="m14 6-6 6 6 6" />
          </svg>
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-[280px] animate-slide-in flex-col border-r border-line bg-surface p-3">
            <SidebarContent inDrawer />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/80 px-4 backdrop-blur-md md:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="btn-ghost h-10 w-10 !px-0 md:hidden">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          {/* Breadcrumb / title */}
          <div className="min-w-0">
            <p className="hidden text-[11px] text-ink-soft sm:block">Dashboard {activeItem && activeItem.href !== '/dashboard' ? `/ ${activeItem.label}` : ''}</p>
            <h1 className="truncate text-base font-bold text-ink">{activeItem?.label ?? 'Overview'}</h1>
          </div>

          {/* Search */}
          <div className="relative ml-auto hidden w-full max-w-xs sm:block">
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3-3" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dashboard…"
              className="input h-10 !py-0 pl-9"
            />
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-pop">
                {searchResults.map((r) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    prefetch
                    onClick={() => setQuery('')}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-muted hover:bg-surface-2 hover:text-ink">
                    <Icon icon={r.icon} className="h-4 w-4 text-ink-soft" />
                    {r.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <Link href="/dashboard/notifications" prefetch className="btn-ghost relative h-10 w-10 !px-0" title="Notifications">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5 2 6H4c.5-1 2-2 2-6Z" />
              <path d="M10 19a2 2 0 0 0 4 0" />
            </svg>
          </Link>

          {/* Profile */}
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-line bg-surface py-1.5 pl-1.5 pr-2 hover:bg-surface-2"
              aria-haspopup="menu"
              aria-expanded={profileOpen}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 text-xs font-bold text-white">{initials}</div>
              <div className="hidden text-left leading-tight md:block">
                <p className="text-xs font-semibold text-ink">{userName}</p>
                <p className="text-[11px] text-ink-soft">Admin</p>
              </div>
              <svg viewBox="0 0 24 24" className="hidden h-4 w-4 text-ink-soft md:block" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-12 z-40 w-52 overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-pop">
                <div className="border-b border-line px-3 py-2">
                  <p className="truncate text-sm font-semibold text-ink">{userName}</p>
                  <p className="truncate text-[11px] text-ink-soft">{email}</p>
                </div>
                <Link href="/dashboard/settings" className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-surface-2 hover:text-ink" onClick={() => setProfileOpen(false)}>
                  <Icon icon="settings" className="h-4 w-4" /> Settings
                </Link>
                <div className="mt-1 border-t border-line pt-1">
                  <SignOutButton />
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto max-w-[1400px] animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
