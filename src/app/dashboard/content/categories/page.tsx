import { CategoryEditor } from '@/components/category-editor';
import { CategoryCreateForm } from '@/components/category-create-form';
import { prisma } from '@/lib/prisma';

export default async function CategoriesPage() {
  const categories = (await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { videos: true, packItems: true } } },
  })).filter(c => c.name !== 'General');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Categories</h1>
      </div>
      <CategoryCreateForm />
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Pack label</th>
              <th className="px-4 py-3">Videos</th>
              <th className="px-4 py-3">Pack rows</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {categories.map((c) => (
              <CategoryEditor key={c.id} category={c} />
            ))}
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                  No categories yet. Click <span className="font-semibold text-slate-700">Add category</span> to create the first one.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
