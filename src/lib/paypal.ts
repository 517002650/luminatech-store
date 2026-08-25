import { roundMoney } from "@/lib/pricing";

type PaypalTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type PaypalOrderResponse = {
  id?: string;
  status?: string;
  purchase_units?: Array<{
    amount?: { currency_code?: string; value?: string };
    payments?: {
      captures?: Array<{
        id?: string;
        status?: string;
        amount?: { currency_code?: string; value?: string };
      }>;
    };
  }>;
};

function paypalApiBase() {
  return process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function paypalCredentials() {
  const clientId =
    process.env.PAYPAL_CLIENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim();
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!clientId || !secret) {
    return null;
  }
  return { clientId, secret };
}

async function getPaypalAccessToken(): Promise<
  { ok: true; token: string } | { ok: false; error: string }
> {
  const creds = paypalCredentials();
  if (!creds) {
    return {
      ok: false,
      error:
        "PayPal 服务端凭证未配置（需要 PAYPAL_CLIENT_SECRET，以及 PAYPAL_CLIENT_ID 或 NEXT_PUBLIC_PAYPAL_CLIENT_ID）",
    };
  }

  const auth = Buffer.from(`${creds.clientId}:${creds.secret}`).toString(
    "base64",
  );
  const res = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  const data = (await res.json()) as PaypalTokenResponse;
  if (!res.ok || !data.access_token) {
    return {
      ok: false,
      error:
        data.error_description ||
        data.error ||
        `PayPal OAuth 失败 (${res.status})`,
    };
  }
  return { ok: true, token: data.access_token };
}

/**
 * Verify a client-captured PayPal order against expected USD total.
 * Fail closed: missing credentials / non-COMPLETED / amount mismatch → reject.
 */
export async function verifyPaypalCapturedOrder(options: {
  paypalOrderId: string;
  expectedTotalUsd: number;
}): Promise<{ ok: true; captureId: string } | { ok: false; error: string }> {
  const orderId = options.paypalOrderId.trim();
  if (!orderId) {
    return { ok: false, error: "缺少 PayPal 订单号" };
  }

  const tokenResult = await getPaypalAccessToken();
  if (!tokenResult.ok) return tokenResult;

  const res = await fetch(
    `${paypalApiBase()}/v2/checkout/orders/${encodeURIComponent(orderId)}`,
    {
      headers: {
        Authorization: `Bearer ${tokenResult.token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    return {
      ok: false,
      error: `无法向 PayPal 核验订单 (${res.status})`,
    };
  }

  const order = (await res.json()) as PaypalOrderResponse;
  if (order.status !== "COMPLETED") {
    return {
      ok: false,
      error: `PayPal 订单未完成（状态：${order.status ?? "unknown"}）`,
    };
  }

  const captures =
    order.purchase_units?.flatMap((u) => u.payments?.captures ?? []) ?? [];
  const completedCaptures = captures.filter((c) => c.status === "COMPLETED");
  if (completedCaptures.length === 0) {
    return { ok: false, error: "PayPal 未找到已完成的 capture" };
  }

  let capturedTotal = 0;
  let currencyOk = true;
  for (const c of completedCaptures) {
    if ((c.amount?.currency_code ?? "USD").toUpperCase() !== "USD") {
      currencyOk = false;
    }
    capturedTotal += Number(c.amount?.value ?? 0);
  }
  if (!currencyOk) {
    return { ok: false, error: "PayPal 币种必须为 USD" };
  }

  const expected = roundMoney(options.expectedTotalUsd);
  const actual = roundMoney(capturedTotal);
  if (Math.abs(actual - expected) > 0.02) {
    return {
      ok: false,
      error: `PayPal 金额不匹配（已付 ${actual.toFixed(2)}，应付 ${expected.toFixed(2)}）`,
    };
  }

  const captureId = completedCaptures[0]?.id ?? orderId;
  return { ok: true, captureId };
}
