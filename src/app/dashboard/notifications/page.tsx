import { prisma } from '@/lib/prisma';
import { SendNotificationForm } from './send-form';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const [users, notifications, categories] = await Promise.all([
    prisma.appUser.findMany({
      select: { id: true, name: true, phone: true },
      orderBy: { name: 'asc' },
    }),
    prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { name: true } } },
    }),
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Notifications</h1>
        <p className="mt-1 text-sm text-slate-500">
          Admin nundi app users ki real-time notifications pampandi.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SendNotificationForm users={users} categories={categories} />
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-800">Recent Sent Notifications</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <div key={n.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          n.type === 'purchase' ? 'bg-emerald-100 text-emerald-700' :
                          n.type === 'offer' ? 'bg-amber-100 text-amber-700' :
                          n.type === 'new_content' ? 'bg-sky-100 text-sky-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {n.type}
                        </span>
                        <span className="text-xs text-slate-400">
                          To: <span className="font-medium text-slate-600">{n.user.name}</span>
                        </span>
                      </div>
                      <h3 className="mt-2 font-bold text-slate-800">{n.title}</h3>
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed">{n.body}</p>
                      <p className="mt-3 text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                        {new Date(n.createdAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="px-6 py-12 text-center text-sm text-slate-500">
                  No notifications sent yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
