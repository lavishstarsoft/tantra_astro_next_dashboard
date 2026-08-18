'use client';

import { useState } from 'react';

type Question = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
  sortOrder: number;
  active: boolean;
};

const emptyDraft = () => ({ prompt: '', options: ['', ''], correctIndex: 0, explanation: '', topic: '' });

export function PracticeQuestionManager({
  videoId,
  initial,
}: {
  videoId: string;
  initial: Question[];
}) {
  const [questions, setQuestions] = useState<Question[]>(initial);
  const [draft, setDraft] = useState(emptyDraft());
  const [busy, setBusy] = useState(false);

  async function reload() {
    const res = await fetch(`/api/admin/practice/videos/${videoId}/questions`, { credentials: 'include' });
    if (res.ok) {
      const data = (await res.json()) as { questions: Question[] };
      setQuestions(data.questions);
    }
  }

  async function create() {
    if (!draft.prompt.trim() || draft.options.some((o) => !o.trim())) {
      alert('Fill prompt and all options');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/practice/videos/${videoId}/questions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        alert((await res.json())?.error ?? 'Create failed');
        return;
      }
      setDraft(emptyDraft());
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/practice/questions/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        alert('Update failed');
        return;
      }
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this question?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/practice/questions/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        alert('Delete failed');
        return;
      }
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= questions.length) return;
    const a = questions[index];
    const b = questions[target];
    await patch(a.id, { sortOrder: b.sortOrder });
    await patch(b.id, { sortOrder: a.sortOrder });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Add question</h2>
        <input
          value={draft.prompt}
          onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
          placeholder="Question prompt"
          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <div className="mt-2 space-y-2">
          {draft.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                checked={draft.correctIndex === i}
                onChange={() => setDraft({ ...draft, correctIndex: i })}
                title="Correct answer"
              />
              <input
                value={opt}
                onChange={(e) => {
                  const options = [...draft.options];
                  options[i] = e.target.value;
                  setDraft({ ...draft, options });
                }}
                placeholder={`Option ${i + 1}`}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              {draft.options.length > 2 ? (
                <button
                  onClick={() => {
                    const options = draft.options.filter((_, x) => x !== i);
                    setDraft({ ...draft, options, correctIndex: Math.min(draft.correctIndex, options.length - 1) });
                  }}
                  className="text-xs text-rose-600">
                  Remove
                </button>
              ) : null}
            </div>
          ))}
          {draft.options.length < 6 ? (
            <button
              onClick={() => setDraft({ ...draft, options: [...draft.options, ''] })}
              className="text-xs font-semibold text-sky-600">
              + Add option
            </button>
          ) : null}
        </div>
        <input
          value={draft.topic}
          onChange={(e) => setDraft({ ...draft, topic: e.target.value })}
          placeholder="Topic (e.g. Nakshatra)"
          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <textarea
          value={draft.explanation}
          onChange={(e) => setDraft({ ...draft, explanation: e.target.value })}
          placeholder="Explanation shown after answering"
          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          disabled={busy}
          onClick={create}
          className="mt-3 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-50">
          Add question
        </button>
      </div>

      <div className="space-y-3">
        {questions.length === 0 ? (
          <p className="text-sm text-slate-400">No questions yet.</p>
        ) : (
          questions.map((q, i) => (
            <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium text-slate-800">
                    {i + 1}. {q.prompt}
                  </p>
                  <ul className="mt-1 space-y-0.5 text-sm text-slate-600">
                    {q.options.map((o, oi) => (
                      <li key={oi} className={oi === q.correctIndex ? 'font-semibold text-emerald-700' : ''}>
                        {oi === q.correctIndex ? '✓ ' : '• '}
                        {o}
                      </li>
                    ))}
                  </ul>
                  {q.topic ? <p className="mt-1 text-xs text-slate-400">Topic: {q.topic}</p> : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      q.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {q.active ? 'Active' : 'Hidden'}
                  </span>
                  <div className="flex gap-1">
                    <button disabled={busy} onClick={() => move(i, -1)} className="rounded border px-2 py-1 text-xs">
                      ↑
                    </button>
                    <button disabled={busy} onClick={() => move(i, 1)} className="rounded border px-2 py-1 text-xs">
                      ↓
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => patch(q.id, { active: !q.active })}
                      className="rounded border px-2 py-1 text-xs">
                      {q.active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => remove(q.id)}
                      className="rounded border border-rose-200 px-2 py-1 text-xs text-rose-600">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
