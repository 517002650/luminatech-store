import { generateSecret, generateSync, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";

const ISSUER = "LuminaTech Admin";

export function generateTotpSecret() {
  return generateSecret();
}

export function buildTotpUri(email: string, secret: string) {
  return generateURI({
    issuer: ISSUER,
    label: email,
    secret,
  });
}

export async function totpQrDataUrl(email: string, secret: string) {
  const uri = buildTotpUri(email, secret);
  return QRCode.toDataURL(uri, { margin: 1, width: 220 });
}

export function verifyTotpToken(secret: string, token: string) {
  const code = token.replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return false;
  try {
    const result = verifySync({ secret, token: code, epochTolerance: 30 });
    return Boolean(result && result.valid);
  } catch {
    return false;
  }
}

/** Dev helper — not used in production paths. */
export function generateTotpToken(secret: string) {
  return generateSync({ secret });
}
