"use client";

import { useActionState, useState } from "react";
import { createProductAction, updateProductAction } from "@/app/admin/actions";
import { GalleryUploadField } from "@/components/admin/GalleryUploadField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { PRODUCT_CATEGORIES, resolveCategoryKey, type ProductCategory } from "@/lib/categories";

type ProductFormValues = {
  slug?: string;
  sku?: string;
  brand?: string;
  nameEn?: string;
  nameZh?: string;
  shortDescEn?: string;
  shortDescZh?: string;
  descriptionEn?: string;
  descriptionZh?: string;
  categoryKey?: string;
  categoryEn?: string;
  categoryZh?: string;
  price?: number;
  image?: string;
  galleryText?: string;
  specsEnText?: string;
  specsZhText?: string;
  highlightsEnText?: string;
  highlightsZhText?: string;
  stock?: number;
  featured?: boolean;
  requiresFreight?: boolean;
  active?: boolean;
  warranty?: string;
};

type Props = {
  productId?: string;
  initialValues?: ProductFormValues;
  categories?: ProductCategory[];
};

const inputClass =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200";
const labelClass = "text-sm font-medium text-stone-700";

export function ProductForm({
  productId,
  initialValues = {},
  categories = PRODUCT_CATEGORIES,
}: Props) {
  const [image, setImage] = useState(initialValues.image ?? "");
  const [galleryText, setGalleryText] = useState(initialValues.galleryText ?? "");
  const [descriptionEn, setDescriptionEn] = useState(initialValues.descriptionEn ?? "");
  const [descriptionZh, setDescriptionZh] = useState(initialValues.descriptionZh ?? "");
  const knownKeys = categories.map((c) => c.key);
  const defaultCategoryKey = resolveCategoryKey(
    {
      categoryKey: initialValues.categoryKey,
      categoryEn: initialValues.categoryEn,
      slug: initialValues.slug,
    },
    knownKeys,
  );

  const action = productId
    ? updateProductAction.bind(null, productId)
    : createProductAction;

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await action(formData)) ?? null;
    },
    null,
  );

  return (
    <form action={formAction} className="space-y-8">
      {state?.error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-900">基本信息</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Slug（URL 标识）</label>
            <input
              name="slug"
              defaultValue={initialValues.slug}
              placeholder="留空则根据英文名自动生成"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>SKU 货号 *</label>
            <input name="sku" required defaultValue={initialValues.sku} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>商品分类 *</label>
            <select
              name="categoryKey"
              required
              defaultValue={defaultCategoryKey}
              className={inputClass}
            >
              {categories.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.zh} ({cat.en})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>品牌 *</label>
            <input name="brand" required defaultValue={initialValues.brand} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>质保 *</label>
            <input
              name="warranty"
              required
              defaultValue={initialValues.warranty ?? "1 year"}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>价格 (USD) *</label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={initialValues.price}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>库存 *</label>
            <input
              name="stock"
              type="number"
              min="0"
              required
              defaultValue={initialValues.stock ?? 100}
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              id="active"
              name="active"
              type="checkbox"
              value="on"
              defaultChecked={initialValues.active !== false}
              className="h-4 w-4 rounded border-stone-300"
            />
            <label htmlFor="active" className="text-sm text-stone-700">
              上架销售（取消勾选即下架，前台不可见、不可购买）
            </label>
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              id="featured"
              name="featured"
              type="checkbox"
              defaultChecked={initialValues.featured}
              className="h-4 w-4 rounded border-stone-300"
            />
            <label htmlFor="featured" className="text-sm text-stone-700">
              设为首页精选商品
            </label>
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              id="requiresFreight"
              name="requiresFreight"
              type="checkbox"
              defaultChecked={initialValues.requiresFreight}
              className="h-4 w-4 rounded border-stone-300"
            />
            <label htmlFor="requiresFreight" className="text-sm text-stone-700">
              重货 / 需货运报价（结账时禁止在线支付，引导联系客服）
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-900">英文内容</h2>
        <div className="mt-4 grid gap-4">
          <div>
            <label className={labelClass}>英文名称 *</label>
            <input name="nameEn" required defaultValue={initialValues.nameEn} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>英文简介 *</label>
            <input
              name="shortDescEn"
              required
              defaultValue={initialValues.shortDescEn}
              className={inputClass}
            />
          </div>
          <MarkdownEditor
            label="英文详细描述 *"
            name="descriptionEn"
            value={descriptionEn}
            onChange={setDescriptionEn}
            placeholder="支持 Markdown；可插入图片 ![](url) 与视频 ![介绍视频](YouTube链接)"
          />
          <div>
            <label className={labelClass}>英文亮点（每行一条）</label>
            <textarea
              name="highlightsEnText"
              rows={4}
              defaultValue={initialValues.highlightsEnText}
              placeholder={"Hybrid ANC\nDual-device connection"}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>英文规格（每行：参数名 | 参数值）</label>
            <textarea
              name="specsEnText"
              rows={6}
              defaultValue={initialValues.specsEnText}
              placeholder={"Driver | 10mm titanium\nBluetooth | 5.3"}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-900">中文内容</h2>
        <div className="mt-4 grid gap-4">
          <div>
            <label className={labelClass}>中文名称 *</label>
            <input name="nameZh" required defaultValue={initialValues.nameZh} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>中文简介 *</label>
            <input
              name="shortDescZh"
              required
              defaultValue={initialValues.shortDescZh}
              className={inputClass}
            />
          </div>
          <MarkdownEditor
            label="中文详细描述 *"
            name="descriptionZh"
            value={descriptionZh}
            onChange={setDescriptionZh}
            placeholder="支持 Markdown；可上传图片，或插入视频 ![介绍视频](链接)"
          />
          <div>
            <label className={labelClass}>中文亮点（每行一条）</label>
            <textarea
              name="highlightsZhText"
              rows={4}
              defaultValue={initialValues.highlightsZhText}
              placeholder={"混合降噪\n双设备连接"}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>中文规格（每行：参数名 | 参数值）</label>
            <textarea
              name="specsZhText"
              rows={6}
              defaultValue={initialValues.specsZhText}
              placeholder={"驱动单元 | 10mm 钛复合振膜\n蓝牙 | 5.3"}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-900">图片</h2>
        <div className="mt-4 grid gap-6">
          <ImageUploadField
            label="主图 *"
            value={image}
            onChange={setImage}
            required
          />
          <input type="hidden" name="image" value={image} required />
          <GalleryUploadField
            label="图库（可选，支持批量上传）"
            value={galleryText}
            onChange={setGalleryText}
          />
          <input type="hidden" name="galleryText" value={galleryText} />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
        >
          {pending ? "保存中..." : productId ? "保存修改" : "创建商品"}
        </button>
        <a
          href="/admin"
          className="rounded-xl border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700 hover:bg-white"
        >
          取消
        </a>
      </div>
    </form>
  );
}
