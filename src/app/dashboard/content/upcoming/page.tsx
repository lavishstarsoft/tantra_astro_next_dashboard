'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface UpcomingItem {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string | null;
  kind: string;
  releaseDate: string | null;
  active: boolean;
  sortOrder: number;
}

export default function UpcomingPage() {
  const [items, setItems] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    imageUrl: '',
    kind: 'video',
    releaseDate: '',
    active: true,
    sortOrder: 0,
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/admin/upcoming');
      const data = await res.json();
      setItems(data);
    } catch {
      toast.error('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await res.json();
      setForm((prev) => ({ ...prev, imageUrl: data.absoluteUrl || data.url }));
      toast.success('Image uploaded successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? 'PATCH' : 'POST';
    const url = editingId ? `/api/admin/upcoming/${editingId}` : '/api/admin/upcoming';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success(editingId ? 'Item updated' : 'Item created');
        setForm({
          title: '',
          subtitle: '',
          description: '',
          imageUrl: '',
          kind: 'video',
          releaseDate: '',
          active: true,
          sortOrder: 0,
        });
        setEditingId(null);
        fetchItems();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Failed to save item');
      }
    } catch {
      toast.error('Error saving item');
    }
  };

  const handleEdit = (item: UpcomingItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      subtitle: item.subtitle || '',
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      kind: item.kind,
      releaseDate: item.releaseDate || '',
      active: item.active,
      sortOrder: item.sortOrder,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const res = await fetch(`/api/admin/upcoming/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Item deleted');
        fetchItems();
      } else {
        toast.error('Failed to delete item');
      }
    } catch {
      toast.error('Error deleting item');
    }
  };

  if (loading) return <div className="p-8 text-slate-800">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Upcoming Content</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700">Title (Required)</label>
          <input
            type="text"
            required
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Subtitle</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Release Date Info (e.g. &quot;June 15&quot;)</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2"
            value={form.releaseDate}
            onChange={(e) => setForm({ ...form, releaseDate: e.target.value })}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700">Image</label>
          <div className="mt-1 flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Image URL"
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
            </div>
            <div className="flex-shrink-0">
              <label className={`cursor-pointer inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                <input
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
          {form.imageUrl && (
            <div className="mt-2 relative h-20 w-32 border rounded-lg overflow-hidden bg-slate-50">
              <Image src={form.imageUrl} alt="Preview" fill className="object-cover" />
            </div>
          )}
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700">Description</label>
          <textarea
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Kind</label>
          <select
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2"
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value })}
          >
            <option value="video">Video</option>
            <option value="category">Category Pack</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Sort Order</label>
          <input
            type="number"
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="flex items-center pt-6">
          <input
            type="checkbox"
            className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300 rounded"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          <label className="ml-2 block text-sm text-slate-900">Active / Published</label>
        </div>

        <div className="col-span-2 flex gap-3 pt-4">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
          >
            {editingId ? 'Update Item' : 'Create Item'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({
                  title: '',
                  subtitle: '',
                  description: '',
                  imageUrl: '',
                  kind: 'video',
                  releaseDate: '',
                  active: true,
                  sortOrder: 0,
                });
              }}
              className="inline-flex justify-center py-2 px-4 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Content</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Release</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-slate-900">
                  <div className="flex items-center">
                    {item.imageUrl && (
                      <div className="h-10 w-10 relative mr-3">
                        <Image className="rounded-lg object-cover" src={item.imageUrl} alt="" fill sizes="40px" />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-slate-900">{item.title}</div>
                      <div className="text-xs text-slate-500">{item.subtitle}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 uppercase">{item.kind}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.releaseDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                    {item.active ? 'Active' : 'Hidden'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(item)} className="text-sky-600 hover:text-sky-900 mr-4">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
