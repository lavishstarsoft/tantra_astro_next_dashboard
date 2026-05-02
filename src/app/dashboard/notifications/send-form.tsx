'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export function SendNotificationForm({ 
  users, 
  categories 
}: { 
  users: { id: string, name: string, phone: string }[],
  categories: { id: string, name: string }[]
}) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('general');
  
  const [targetType, setTargetType] = useState<'all' | 'user' | 'category'>('all');
  const [userId, setUserId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) {
      toast.error('Title and body are required');
      return;
    }
    if (targetType === 'user' && !userId) {
      toast.error('Select a user');
      return;
    }
    if (targetType === 'category' && !categoryId) {
      toast.error('Select a category');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          body, 
          type, 
          userId: targetType === 'user' ? userId : undefined,
          categoryId: targetType === 'category' ? categoryId : undefined,
          broadcast: targetType === 'all' 
        }),
      });
      if (!res.ok) throw new Error('Failed to send');
      toast.success('Notification sent successfully!');
      setTitle('');
      setBody('');
    } catch (err) {
      toast.error('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">Send New Notification</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Target Audience</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(['all', 'user', 'category'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTargetType(t)}
                className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                  targetType === t 
                    ? 'border-sky-500 bg-sky-50 text-sky-600' 
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t === 'all' ? 'All Users' : t === 'user' ? 'One User' : 'Category Group'}
              </button>
            ))}
          </div>
        </div>

        {targetType === 'user' && (
          <div>
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Select User</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="">-- Choose a user --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.phone})
                </option>
              ))}
            </select>
          </div>
        )}

        {targetType === 'category' && (
          <div>
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Select Category Group</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="">-- Choose a category --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Purchasers)
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification Title"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="general">General</option>
              <option value="purchase">Purchase Update</option>
              <option value="new_content">New Content</option>
              <option value="offer">Special Offer</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Message Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type your message here..."
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-sky-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-600 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Notification'}
        </button>
      </form>
    </div>
  );
}
