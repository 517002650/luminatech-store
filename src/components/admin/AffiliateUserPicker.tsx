"use client";

import { useEffect, useState, useTransition } from "react";
import { searchUsersForAffiliateAction } from "@/app/admin/actions";

export type AffiliateUserOption = {
  id: string;
  email: string;
  name: string;
};

type Props = {
  /** Current bound user (edit form) */
  initialUser?: AffiliateUserOption | null;
  required?: boolean;
};

export function AffiliateUserPicker({ initialUser = null, required = true }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AffiliateUserOption[]>([]);
  const [selected, setSelected] = useState<AffiliateUserOption | null>(initialUser);
  const [pending, startTransition] = useTransition();
  const [searched, setSearched] = useState(false);
  const allowUserId = initialUser?.id;

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setSearched(false);
      return;
    }
    const t = setTimeout(() => {
      startTransition(async () => {
        const rows = await searchUsersForAffiliateAction(q, allowUserId);
        setResults(rows);
        setSearched(true);
      });
    }, 280);
    return () => clearTimeout(t);
  }, [query, allowUserId]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-stone-700">
        绑定前台用户 {required ? "*" : ""}
      </label>
      <input type="hidden" name="userId" value={selected?.id ?? ""} required={required} />
      {selected ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
          <span className="font-medium text-stone-900">
            {selected.name || "（未填姓名）"}
          </span>
          <span className="text-stone-600">{selected.email}</span>
          <button
            type="button"
            className="ml-auto text-xs text-stone-600 underline"
            onClick={() => {
              setSelected(null);
              setQuery("");
              setResults([]);
            }}
          >
            更换
          </button>
        </div>
      ) : (
        <>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索用户邮箱或姓名…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            autoComplete="off"
          />
          {pending ? (
            <p className="text-xs text-stone-500">搜索中…</p>
          ) : null}
          {searched && !pending && results.length === 0 ? (
            <p className="text-xs text-stone-500">无匹配用户，请先让对方在前台注册。</p>
          ) : null}
          {results.length > 0 ? (
            <ul className="max-h-48 overflow-auto rounded-xl border border-stone-200 bg-white shadow-sm">
              {results.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-amber-50"
                    onClick={() => {
                      setSelected(u);
                      setQuery("");
                      setResults([]);
                      setSearched(false);
                      const nameInput = document.querySelector<HTMLInputElement>(
                        'input[name="name"]',
                      );
                      const emailInput = document.querySelector<HTMLInputElement>(
                        'input[name="email"]',
                      );
                      if (nameInput && !nameInput.value.trim() && u.name) {
                        nameInput.value = u.name;
                      }
                      if (emailInput) {
                        emailInput.value = u.email;
                      }
                    }}
                  >
                    <span className="font-medium text-stone-900">
                      {u.name || "（未填姓名）"}
                    </span>
                    <span className="text-xs text-stone-500">{u.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
      <p className="text-xs text-stone-500">
        绑定后，该用户用<strong>普通前台账号</strong>登录即可在「我的推广」查看链接与提成结算状态（无需进后台）。
      </p>
    </div>
  );
}
