"use client";

import { useState } from "react";
import type { VariantFormInput } from "@/lib/product-variants";

const inputClass =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200";
const labelClass = "text-sm font-medium text-stone-700";

function emptyVariant(index: number): VariantFormInput {
  return {
    sku: "",
    nameEn: "",
    nameZh: "",
    price: 0,
    compareAtPrice: null,
    stock: 0,
    active: true,
    isDefault: index === 0,
    sortOrder: index,
  };
}

type Props = {
  initialVariants?: VariantFormInput[];
  /** Fallback when creating a product with no variants yet */
  fallback?: {
    sku?: string;
    price?: number;
    compareAtPrice?: number | null;
    stock?: number;
  };
};

export function VariantEditor({ initialVariants = [], fallback }: Props) {
  const [variants, setVariants] = useState<VariantFormInput[]>(() => {
    if (initialVariants.length > 0) {
      const hasDefault = initialVariants.some((v) => v.isDefault);
      return hasDefault
        ? initialVariants
        : initialVariants.map((v, i) => ({ ...v, isDefault: i === 0 }));
    }
    return [
      {
        ...emptyVariant(0),
        sku: fallback?.sku ?? "",
        price: fallback?.price ?? 0,
        compareAtPrice: fallback?.compareAtPrice ?? null,
        stock: fallback?.stock ?? 100,
        isDefault: true,
      },
    ];
  });

  function update(index: number, patch: Partial<VariantFormInput>) {
    setVariants((prev) =>
      prev.map((row, i) => {
        if (i !== index) {
          if (patch.isDefault) return { ...row, isDefault: false };
          return row;
        }
        return { ...row, ...patch };
      }),
    );
  }

  function addRow() {
    setVariants((prev) => [...prev, emptyVariant(prev.length)]);
  }

  function removeRow(index: number) {
    setVariants((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== index).map((v, i) => ({
        ...v,
        sortOrder: i,
      }));
      if (!next.some((v) => v.isDefault) && next[0]) {
        next[0] = { ...next[0], isDefault: true };
      }
      return next;
    });
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">规格与价格</h2>
          <p className="mt-1 text-sm text-stone-500">
            每个规格可设置独立 SKU、售价、划线价与库存。前台按所选规格计价扣库存。
          </p>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          + 添加规格
        </button>
      </div>

      <input type="hidden" name="variantsJson" value={JSON.stringify(variants)} />
      {/* Keep legacy fields in sync for mirrors / empty-json fallback */}
      <input type="hidden" name="sku" value={variants.find((v) => v.isDefault)?.sku ?? variants[0]?.sku ?? ""} />
      <input type="hidden" name="price" value={variants.find((v) => v.isDefault)?.price ?? variants[0]?.price ?? 0} />
      <input
        type="hidden"
        name="compareAtPrice"
        value={
          variants.find((v) => v.isDefault)?.compareAtPrice ??
          variants[0]?.compareAtPrice ??
          ""
        }
      />
      <input
        type="hidden"
        name="stock"
        value={variants.reduce((sum, v) => sum + (v.active ? v.stock : 0), 0)}
      />

      <div className="mt-4 space-y-4">
        {variants.map((v, index) => (
          <div
            key={v.id ?? `new-${index}`}
            className="rounded-xl border border-stone-200 bg-stone-50/60 p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-stone-800">
                规格 #{index + 1}
                {v.isDefault ? (
                  <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                    默认
                  </span>
                ) : null}
              </p>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-sm text-stone-600">
                  <input
                    type="radio"
                    name="defaultVariant"
                    checked={v.isDefault}
                    onChange={() => update(index, { isDefault: true })}
                  />
                  设为默认
                </label>
                <label className="flex items-center gap-1.5 text-sm text-stone-600">
                  <input
                    type="checkbox"
                    checked={v.active}
                    onChange={(e) => update(index, { active: e.target.checked })}
                  />
                  启用
                </label>
                {variants.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    删除
                  </button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className={labelClass}>规格名（英）</label>
                <input
                  value={v.nameEn}
                  onChange={(e) => update(index, { nameEn: e.target.value })}
                  placeholder="e.g. Black / 100W"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>规格名（中）</label>
                <input
                  value={v.nameZh}
                  onChange={(e) => update(index, { nameZh: e.target.value })}
                  placeholder="例如：黑色 / 100W"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>SKU *</label>
                <input
                  value={v.sku}
                  onChange={(e) => update(index, { sku: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>售价 (USD) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={v.price || ""}
                  onChange={(e) =>
                    update(index, { price: Number(e.target.value || 0) })
                  }
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>划线价 (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={v.compareAtPrice ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    update(index, {
                      compareAtPrice: raw ? Number(raw) : null,
                    });
                  }}
                  placeholder="可选"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>库存 *</label>
                <input
                  type="number"
                  min="0"
                  value={v.stock}
                  onChange={(e) =>
                    update(index, {
                      stock: Math.floor(Number(e.target.value || 0)),
                    })
                  }
                  required
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
