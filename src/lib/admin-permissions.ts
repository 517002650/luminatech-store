/** Module-level admin permissions (nav + page/API gates). */

export const ADMIN_PERMISSION_KEYS = [
  "products",
  "categories",
  "orders",
  "returns",
  "reviews",
  "users",
  "inbox",
  "coupons",
  "affiliates",
  "commissions",
  "finance",
  "refunds",
  "refund_stripe",
  "shipping",
  "media",
  "backup",
  "security",
  "team",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSION_KEYS)[number];

export const ADMIN_PERMISSION_LABELS: Record<AdminPermission, string> = {
  products: "商品管理",
  categories: "商品分类",
  orders: "订单管理",
  returns: "退货申请",
  reviews: "评价审核",
  users: "用户管理",
  inbox: "客户留言",
  coupons: "优惠码",
  affiliates: "推广员",
  commissions: "推广提成",
  finance: "财务账本",
  refunds: "退款记账（线下退款 / 仅改订单，不调用 Stripe）",
  refund_stripe: "Stripe 在线退款（从买家卡自动退钱）",
  shipping: "运费设置",
  media: "媒体清理",
  backup: "数据备份",
  security: "安全设置",
  team: "团队账号",
};

/** Owner always has every module (including team). */
export const OWNER_PERMISSIONS: AdminPermission[] = [...ADMIN_PERMISSION_KEYS];

/**
 * Default Admin: daily ops without shipping / media / backup / team / Stripe refund.
 * Can mark offline refunds; Stripe money-out requires refund_stripe (Owner or custom).
 */
export const DEFAULT_ADMIN_PERMISSIONS: AdminPermission[] =
  ADMIN_PERMISSION_KEYS.filter(
    (k) =>
      k !== "shipping" &&
      k !== "media" &&
      k !== "backup" &&
      k !== "team" &&
      k !== "refund_stripe",
  );

/** Permissions that must never appear on non-Owner role types (Owner key only). */
export const OWNER_ONLY_PERMISSIONS: AdminPermission[] = [];

export const SYSTEM_ROLE_KEYS = ["owner", "admin"] as const;
export type SystemRoleKey = (typeof SYSTEM_ROLE_KEYS)[number];

export function isAdminPermission(value: string): value is AdminPermission {
  return (ADMIN_PERMISSION_KEYS as readonly string[]).includes(value);
}

export function parsePermissionsJson(raw: string | null | undefined): AdminPermission[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is AdminPermission => typeof p === "string" && isAdminPermission(p));
  } catch {
    return [];
  }
}

export function serializePermissions(perms: AdminPermission[]): string {
  const unique = Array.from(new Set(perms.filter(isAdminPermission)));
  return JSON.stringify(unique);
}

export function uniquePermissions(perms: AdminPermission[]): AdminPermission[] {
  return Array.from(new Set(perms.filter(isAdminPermission)));
}

/** True if every permission in `target` is also held by `actor`. */
export function permissionsWithinCeiling(
  target: AdminPermission[],
  actor: AdminPermission[],
): boolean {
  const ceiling = new Set(actor);
  return target.every((p) => ceiling.has(p));
}

/**
 * Cap requested permissions to what the actor themselves holds.
 * Owner actors pass through (after optional strip of empty).
 */
export function capPermissionsByActor(
  requested: AdminPermission[],
  actorPerms: AdminPermission[],
  actorIsOwner: boolean,
): AdminPermission[] {
  const cleaned = uniquePermissions(requested);
  if (actorIsOwner) return cleaned;
  const ceiling = new Set(actorPerms);
  return cleaned.filter((p) => ceiling.has(p));
}

/**
 * Apply permission checkbox save for a role type.
 * - Actor may freely change permissions they themselves have
 * - Permissions beyond the actor's ceiling that already exist are preserved
 *   (disabled fields don't submit; server keeps them)
 * - Actor cannot newly grant anything above their ceiling
 */
export function applyRolePermissionEdit(options: {
  existing: AdminPermission[];
  requested: AdminPermission[];
  actorPerms: AdminPermission[];
  actorIsOwner: boolean;
}): AdminPermission[] {
  const { existing, requested, actorPerms, actorIsOwner } = options;
  let next = capPermissionsByActor(requested, actorPerms, actorIsOwner);

  if (!actorIsOwner) {
    const ceiling = new Set(actorPerms);
    const preservedBeyond = existing.filter((p) => !ceiling.has(p));
    next = uniquePermissions([...preservedBeyond, ...next]);
  }

  if (!next.includes("security")) next.push("security");
  return next;
}

/** @deprecated use capPermissionsByActor / applyRolePermissionEdit */
export function sanitizeAssignablePermissions(
  perms: AdminPermission[],
): AdminPermission[] {
  return uniquePermissions(perms);
}

/** Map admin path prefix → required permission. */
export function permissionForAdminPath(pathname: string): AdminPermission | null {
  const path = pathname.replace(/\/+$/, "") || "/admin";
  if (path === "/admin" || path.startsWith("/admin/products")) return "products";
  if (path.startsWith("/admin/categories")) return "categories";
  if (path.startsWith("/admin/orders")) return "orders";
  if (path.startsWith("/admin/returns")) return "returns";
  if (path.startsWith("/admin/reviews")) return "reviews";
  if (path.startsWith("/admin/users")) return "users";
  if (path.startsWith("/admin/inbox")) return "inbox";
  if (path.startsWith("/admin/coupons")) return "coupons";
  if (path.startsWith("/admin/affiliates")) return "affiliates";
  if (path.startsWith("/admin/commissions")) return "commissions";
  if (path.startsWith("/admin/finance")) return "finance";
  if (path.startsWith("/admin/shipping")) return "shipping";
  if (path.startsWith("/admin/media")) return "media";
  if (path.startsWith("/admin/backup")) return "backup";
  if (path.startsWith("/admin/security")) return "security";
  if (path.startsWith("/admin/team")) return "team";
  return null;
}

export const NAV_PERMISSION: Record<string, AdminPermission> = {
  "/admin": "products",
  "/admin/products/new": "products",
  "/admin/categories": "categories",
  "/admin/orders": "orders",
  "/admin/returns": "returns",
  "/admin/reviews": "reviews",
  "/admin/users": "users",
  "/admin/inbox": "inbox",
  "/admin/coupons": "coupons",
  "/admin/affiliates": "affiliates",
  "/admin/commissions": "commissions",
  "/admin/finance": "finance",
  "/admin/shipping": "shipping",
  "/admin/media": "media",
  "/admin/backup": "backup",
  "/admin/security": "security",
  "/admin/team": "team",
};
