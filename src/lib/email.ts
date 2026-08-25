import nodemailer from "nodemailer";
import {
  formatOrderId,
  formatShippingAddress,
  parseOrderItems,
  parseShippingAddress,
} from "@/lib/orders";
import { formatPrice } from "@/lib/format";
import {
  getCarrierLabel,
  getTrackingUrl,
  hasTrackingInfo,
} from "@/lib/shipping-tracking";

type Order = {
  id: string;
  email: string;
  total: number;
  items: string;
  shippingAddress?: string;
  shippingCarrier?: string;
  trackingNumber?: string;
};

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

function createTransport() {
  const port = Number(process.env.SMTP_PORT ?? 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

function lineLabel(item: {
  nameEn: string;
  nameZh?: string;
  variantNameEn?: string;
  variantNameZh?: string;
  variantSku?: string;
}) {
  const option =
    item.variantNameEn || item.variantNameZh || item.variantSku || "";
  return option ? `${item.nameEn} (${option})` : item.nameEn;
}

function buildItemRows(items: ReturnType<typeof parseOrderItems>) {
  return items
    .map(
      (item) =>
        `• ${lineLabel(item)} × ${item.quantity} — ${formatPrice(item.price * item.quantity)}`,
    )
    .join("\n");
}

function buildItemHtml(items: ReturnType<typeof parseOrderItems>) {
  return `<ul>${items
    .map(
      (i) =>
        `<li>${lineLabel(i)} × ${i.quantity} — <strong>${formatPrice(i.price * i.quantity)}</strong></li>`,
    )
    .join("")}</ul>`;
}

export async function sendOrderConfirmationEmail(order: Order) {
  if (!order.email) {
    return { sent: false, reason: "no_email" as const };
  }

  if (!isSmtpConfigured()) {
    return { sent: false, reason: "smtp_not_configured" as const };
  }

  const storeName = process.env.STORE_NAME ?? "Stagevio";
  const items = parseOrderItems(order.items);
  const shipping = parseShippingAddress(order.shippingAddress ?? "");
  const orderNo = formatOrderId(order.id);

  const subject = `Order confirmed #${orderNo} — ${storeName}`;
  const shippingBlock = shipping
    ? `\nShipping to:\n${formatShippingAddress(shipping)}\n`
    : "";

  const text = `Hi${shipping ? ` ${shipping.name}` : ""},

Thank you for your order! We've received your payment.

Order #${orderNo}

Items:
${buildItemRows(items)}

Total: ${formatPrice(order.total)}
${shippingBlock}
We'll notify you when your order ships.

Thank you for shopping at ${storeName}!`;

  const shippingHtml = shipping
    ? `<p><strong>Ship to:</strong><br/>${formatShippingAddress(shipping).replace(/\n/g, "<br/>")}</p>`
    : "";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1c1917">
      <h2 style="color:#d97706">Order confirmed!</h2>
      <p>Thank you for your purchase. Order <strong>#${orderNo}</strong> is confirmed.</p>
      ${buildItemHtml(items)}
      <p><strong>Total:</strong> ${formatPrice(order.total)}</p>
      ${shippingHtml}
      <p>We'll email you again when your order ships.</p>
      <p style="color:#78716c">Thank you for shopping at ${storeName}.</p>
      <hr style="border:none;border-top:1px solid #e7e5e4;margin:24px 0" />
      <p style="color:#78716c;font-size:14px">您好，您的订单 #${orderNo} 已确认，付款成功。发货后我们会再次通知您。</p>
    </div>
  `;

  await createTransport().sendMail({
    from: process.env.SMTP_FROM,
    to: order.email,
    subject,
    text,
    html,
  });

  return { sent: true as const };
}

function buildTrackingBlock(order: Order) {
  if (!hasTrackingInfo(order)) return { text: "", html: "" };

  const carrier = getCarrierLabel(order.shippingCarrier ?? "other", "en");
  const url = getTrackingUrl(order.shippingCarrier ?? "other", order.trackingNumber ?? "");

  const text = `
Carrier: ${carrier}
Tracking: ${order.trackingNumber}
Track: ${url ?? ""}`;

  const html = `
    <p><strong>Carrier:</strong> ${carrier}<br/>
    <strong>Tracking:</strong> ${order.trackingNumber}<br/>
    ${url ? `<a href="${url}">Track shipment</a>` : ""}</p>`;

  return { text, html };
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  if (!isSmtpConfigured()) {
    return { sent: false, reason: "smtp_not_configured" as const };
  }

  const storeName = process.env.STORE_NAME ?? "Stagevio";
  const subject = `Reset your password — ${storeName}`;
  const text = `You requested a password reset for your ${storeName} account.

Open this link to set a new password (valid for 1 hour):
${resetUrl}

If you did not request this, you can ignore this email.`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1c1917">
      <h2 style="color:#d97706">Reset your password</h2>
      <p>Click the button below to choose a new password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}" style="display:inline-block;background:#1c1917;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">Reset password</a></p>
      <p style="color:#78716c;font-size:14px">If you didn't request this, ignore this email.</p>
      <hr style="border:none;border-top:1px solid #e7e5e4;margin:24px 0" />
      <p style="color:#78716c;font-size:14px">您请求重置 ${storeName} 账户密码，请点击上方链接（1 小时内有效）。</p>
    </div>
  `;

  await createTransport().sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject,
    text,
    html,
  });

  return { sent: true as const };
}

export async function sendDigitalDeliveryEmail(order: Order) {
  if (!order.email) {
    return { sent: false, reason: "no_email" as const };
  }

  if (!isSmtpConfigured()) {
    return { sent: false, reason: "smtp_not_configured" as const };
  }

  const storeName = process.env.STORE_NAME ?? "Stagevio";
  const items = parseOrderItems(order.items);
  const orderNo = formatOrderId(order.id);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const orderUrl = appUrl
    ? `${appUrl}/en/account/orders/${order.id}`
    : `/account/orders/${order.id}`;

  const subject = `Your order #${orderNo} is ready — ${storeName}`;
  const text = `Hi,

Your order #${orderNo} has been delivered digitally. You can download your files from your account order page:
${orderUrl}

Items:
${buildItemRows(items)}

Total: ${formatPrice(order.total)}

Thank you for shopping at ${storeName}!`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1c1917">
      <h2 style="color:#d97706">Ready to download</h2>
      <p>Order <strong>#${orderNo}</strong> was delivered instantly — no shipping needed.</p>
      ${buildItemHtml(items)}
      <p><strong>Total:</strong> ${formatPrice(order.total)}</p>
      <p><a href="${orderUrl}" style="display:inline-block;background:#1c1917;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">Open order &amp; downloads</a></p>
      <p style="color:#78716c">Thank you for shopping at ${storeName}.</p>
      <hr style="border:none;border-top:1px solid #e7e5e4;margin:24px 0" />
      <p style="color:#78716c;font-size:14px">您好，订单 #${orderNo} 已在线交付。请登录账户订单页下载附件，无需物流。</p>
    </div>
  `;

  await createTransport().sendMail({
    from: process.env.SMTP_FROM,
    to: order.email,
    subject,
    text,
    html,
  });

  return { sent: true as const };
}

export async function sendShippingEmail(order: Order) {
  if (!order.email) {
    return { sent: false, reason: "no_email" as const };
  }

  if (!isSmtpConfigured()) {
    return { sent: false, reason: "smtp_not_configured" as const };
  }

  const storeName = process.env.STORE_NAME ?? "Stagevio";
  const items = parseOrderItems(order.items);
  const shipping = parseShippingAddress(order.shippingAddress ?? "");
  const orderNo = formatOrderId(order.id);
  const tracking = buildTrackingBlock(order);

  const subject = `Your order #${orderNo} has shipped — ${storeName}`;
  const shippingBlock = shipping
    ? `\nShipping to:\n${formatShippingAddress(shipping)}\n`
    : "";

  const text = `Hi,

Good news! Your order #${orderNo} has been shipped.

Items:
${buildItemRows(items)}

Total: ${formatPrice(order.total)}
${shippingBlock}${tracking.text ? `\n${tracking.text}\n` : ""}
Thank you for shopping at ${storeName}!`;

  const shippingHtml = shipping
    ? `<p><strong>Ship to:</strong><br/>${formatShippingAddress(shipping).replace(/\n/g, "<br/>")}</p>`
    : "";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1c1917">
      <h2 style="color:#d97706">Your order has shipped!</h2>
      <p>Order <strong>#${orderNo}</strong> is on its way.</p>
      ${buildItemHtml(items)}
      <p><strong>Total:</strong> ${formatPrice(order.total)}</p>
      ${shippingHtml}
      ${tracking.html}
      <p style="color:#78716c">Thank you for shopping at ${storeName}.</p>
      <hr style="border:none;border-top:1px solid #e7e5e4;margin:24px 0" />
      <p style="color:#78716c;font-size:14px">您好，您的订单 #${orderNo} 已发货${order.trackingNumber ? `，运单号：${order.trackingNumber}` : ""}，感谢您的购买！</p>
    </div>
  `;

  await createTransport().sendMail({
    from: process.env.SMTP_FROM,
    to: order.email,
    subject,
    text,
    html,
  });

  return { sent: true as const };
}

export async function sendContactInquiryEmail(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
  locale?: string;
}) {
  if (!isSmtpConfigured()) {
    return { sent: false, reason: "smtp_not_configured" as const };
  }

  const storeName = process.env.STORE_NAME ?? "Stagevio";
  const to =
    process.env.CONTACT_EMAIL?.trim() ||
    process.env.SMTP_FROM?.replace(/.*<([^>]+)>.*/, "$1").trim() ||
    process.env.SMTP_USER;

  if (!to) {
    return { sent: false, reason: "smtp_not_configured" as const };
  }

  const mailSubject = `[${storeName} Contact] ${input.subject}`;
  const text = `New contact form message

From: ${input.name} <${input.email}>
Locale: ${input.locale ?? "en"}
Subject: ${input.subject}

${input.message}
`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1c1917">
      <h2 style="color:#d97706">New contact message</h2>
      <p><strong>From:</strong> ${input.name} &lt;${input.email}&gt;</p>
      <p><strong>Subject:</strong> ${input.subject}</p>
      <p style="white-space:pre-wrap">${input.message}</p>
    </div>
  `;

  await createTransport().sendMail({
    from: process.env.SMTP_FROM,
    to,
    replyTo: input.email,
    subject: mailSubject,
    text,
    html,
  });

  return { sent: true as const };
}
