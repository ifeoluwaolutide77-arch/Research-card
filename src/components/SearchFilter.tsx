"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

export function SearchFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      startTransition(() => {
        router.push(`/?${next.toString()}`);
      });
    },
    [params, router],
  );

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-end">
      <label className="flex flex-1 flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Search</span>
        <input
          defaultValue={params.get("q") ?? ""}
          name="q"
          placeholder="Title, abstract, or keyword"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-violet-500 focus:ring-2"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setParam("q", (e.target as HTMLInputElement).value.trim() || null);
            }
          }}
        />
      </label>
      <label className="flex w-full flex-col gap-1 text-sm md:w-48">
        <span className="font-medium text-slate-700">Source</span>
        <select
          defaultValue={params.get("source") ?? ""}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-violet-500 focus:ring-2"
          onChange={(e) => setParam("source", e.target.value || null)}
        >
          <option value="">All</option>
          <option value="pubmed">PubMed</option>
          <option value="arxiv">arXiv</option>
          <option value="biorxiv">bioRxiv</option>
        </select>
      </label>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const el = document.querySelector<HTMLInputElement>('input[name="q"]');
          setParam("q", el?.value.trim() || null);
        }}
        className="h-10 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
      >
        Apply
      </button>
    </div>
  );
}
