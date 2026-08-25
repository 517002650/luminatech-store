"use client";

import { useRouter } from "next/navigation";
import { useActionState, useTransition } from "react";
import {
  deleteUserAddressAction,
  saveUserAddressAction,
  setDefaultUserAddressAction,
} from "@/app/actions/user";
import type { SavedAddress } from "@/lib/user-addresses";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { lightInputClass, lightPanelClass } from "@/lib/form-styles";

type Props = {
  addresses: SavedAddress[];
  defaultEmail?: string;
  defaultName?: string;
};

export function AddressBookPanel({
  addresses,
  defaultEmail = "",
  defaultName = "",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, formAction, saving] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      const result = await saveUserAddressAction(formData);
      if (result && "error" in result && result.error) {
        return { error: String(result.error) };
      }
      router.refresh();
      return { success: true };
    },
    null,
  );

  return (
    <div className="space-y-8">
      <section className={lightPanelClass}>
        <h2 className="text-lg font-semibold text-stone-900">已保存地址</h2>
        {addresses.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">暂无地址，请在下方添加。</p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100">
            {addresses.map((addr) => (
              <li key={addr.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                <div>
                  <p className="font-medium text-stone-900">
                    {addr.label}
                    {addr.isDefault ? (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                        默认
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    {addr.name} · {addr.line1}
                    {addr.line2 ? `, ${addr.line2}` : ""}
                  </p>
                  <p className="text-sm text-stone-500">
                    {addr.city}, {addr.state} {addr.postalCode}, {addr.country}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!addr.isDefault ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await setDefaultUserAddressAction(addr.id);
                          router.refresh();
                        })
                      }
                      className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
                    >
                      设为默认
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (!window.confirm("删除此地址？")) return;
                      startTransition(async () => {
                        await deleteUserAddressAction(addr.id);
                        router.refresh();
                      });
                    }}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                  >
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={formAction} className={`${lightPanelClass} space-y-4`}>
        <h2 className="text-lg font-semibold text-stone-900">添加地址</h2>
        {state?.error ? (
          <p className="text-sm text-red-600">{state.error}</p>
        ) : null}
        {state?.success ? (
          <p className="text-sm text-green-700">已保存</p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="标签" name="label" defaultValue="Home" />
          <label className="flex items-end gap-2 pb-2 text-sm text-stone-700">
            <input name="isDefault" type="checkbox" className="h-4 w-4 rounded border-stone-300" />
            设为默认地址
          </label>
          <Field label="收件人" name="name" defaultValue={defaultName} required />
          <Field label="邮箱" name="email" type="email" defaultValue={defaultEmail} required />
          <Field label="电话" name="phone" />
          <Field label="地址行 1" name="line1" required className="sm:col-span-2" />
          <Field label="地址行 2" name="line2" className="sm:col-span-2" />
          <Field label="城市" name="city" required />
          <Field label="州 / 省" name="state" />
          <div>
            <label className="text-sm font-medium text-stone-700">国家 *</label>
            <select name="country" required defaultValue="US" className={lightInputClass}>
              {COUNTRY_OPTIONS.filter((c) => c.code !== "OTHER").map((c) => (
                <option key={c.code} value={c.code}>
                  {c.zh} / {c.en}
                </option>
              ))}
            </select>
          </div>
          <Field label="邮编" name="postalCode" required />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
        >
          {saving ? "保存中..." : "保存地址"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue = "",
  required,
  type = "text",
  className = "",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-sm font-medium text-stone-700">
        {label}
        {required ? " *" : ""}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className={lightInputClass}
      />
    </div>
  );
}
