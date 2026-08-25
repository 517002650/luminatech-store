"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/app/admin/actions";
import type { ProductCategory } from "@/lib/categories";

const inputClass =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200";
const labelClass = "text-sm font-medium text-stone-700";

export function CategoryCreateForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await createCategoryAction(formData)) ?? null;
    },
    null,
  );

  return (
    <form action={formAction} className="rounded-2xl border border-stone-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-stone-900">新增分类</h2>
      <p className="mt-1 text-sm text-stone-500">标识用于 URL 筛选，例如 fog-machines</p>
      {state?.error ? (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
      ) : null}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>中文名称 *</label>
          <input name="nameZh" required placeholder="雾机" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>英文名称 *</label>
          <input name="nameEn" required placeholder="Fog Machines" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>标识 Key</label>
          <input name="key" placeholder="留空则按英文名生成" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>排序（越小越靠前）</label>
          <input name="sortOrder" type="number" defaultValue={100} className={inputClass} />
        </div>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm text-stone-700">
        <input name="active" type="checkbox" defaultChecked className="h-4 w-4 rounded border-stone-300" />
        前台显示
      </label>
      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50"
      >
        {pending ? "保存中..." : "添加分类"}
      </button>
    </form>
  );
}

export function CategoryEditForm({ category }: { category: ProductCategory }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await updateCategoryAction(category.id!, formData)) ?? null;
    },
    null,
  );

  return (
    <form action={formAction} className="rounded-2xl border border-stone-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-stone-900">编辑分类</h2>
      {state?.error ? (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
      ) : null}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>中文名称 *</label>
          <input name="nameZh" required defaultValue={category.zh} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>英文名称 *</label>
          <input name="nameEn" required defaultValue={category.en} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>标识 Key *</label>
          <input name="key" required defaultValue={category.key} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>排序</label>
          <input
            name="sortOrder"
            type="number"
            defaultValue={category.sortOrder ?? 0}
            className={inputClass}
          />
        </div>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm text-stone-700">
        <input
          name="active"
          type="checkbox"
          defaultChecked={category.active !== false}
          className="h-4 w-4 rounded border-stone-300"
        />
        前台显示
      </label>
      <div className="mt-5 flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50"
        >
          {pending ? "保存中..." : "保存修改"}
        </button>
        <Link
          href="/admin/categories"
          className="rounded-xl border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          返回
        </Link>
      </div>
    </form>
  );
}

type Row = ProductCategory & { productCount: number };

export function CategoryTable({ categories }: { categories: Row[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center text-stone-600">
        暂无分类
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-stone-100 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
          <tr>
            <th className="px-4 py-3">排序</th>
            <th className="px-4 py-3">中文</th>
            <th className="px-4 py-3">英文</th>
            <th className="px-4 py-3">Key</th>
            <th className="px-4 py-3">商品数</th>
            <th className="px-4 py-3">状态</th>
            <th className="px-4 py-3 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {categories.map((cat) => (
            <tr key={cat.id ?? cat.key} className="hover:bg-stone-50/80">
              <td className="px-4 py-3 text-stone-500">{cat.sortOrder ?? 0}</td>
              <td className="px-4 py-3 font-medium text-stone-900">{cat.zh}</td>
              <td className="px-4 py-3 text-stone-700">{cat.en}</td>
              <td className="px-4 py-3 font-mono text-xs text-stone-500">{cat.key}</td>
              <td className="px-4 py-3 text-stone-700">{cat.productCount}</td>
              <td className="px-4 py-3">
                {cat.active !== false ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                    显示
                  </span>
                ) : (
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                    隐藏
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/admin/categories/${cat.id}/edit`}
                    className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    编辑
                  </Link>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (!window.confirm(`确定删除分类「${cat.zh}」？`)) return;
                      startTransition(async () => {
                        const result = await deleteCategoryAction(cat.id!);
                        if (result?.error) {
                          window.alert(result.error);
                          return;
                        }
                        router.refresh();
                      });
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    删除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
