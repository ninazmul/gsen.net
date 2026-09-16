import { connectToDatabase } from "@/lib/database";
import Settings from "@/lib/database/models/settings.model";
import crypto from "crypto";

export interface ApiAuthResult {
  isValid: boolean;
  error?: string;
  status?: number;
  owner?: string;
}

/**
 * Safely compares two strings in constant time to prevent timing attacks.
 */
function safeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Validates API owner and secret key from request headers or query parameters.
 * Headers supported:
 *   - x-api-owner (or x-api-user)
 *   - x-api-secret-key (or x-api-key, or Authorization: Bearer <secretKey>)
 */
export async function validateApiCredentials(req: Request): Promise<ApiAuthResult> {
  const url = new URL(req.url);

  // Extract API Owner from headers or query parameters
  const headerOwner =
    req.headers.get("x-api-owner") ||
    req.headers.get("x-api-user") ||
    url.searchParams.get("apiOwner") ||
    url.searchParams.get("owner");

  // Extract API Secret Key from headers, Authorization header, or query parameters
  let headerSecret =
    req.headers.get("x-api-secret-key") ||
    req.headers.get("x-api-key") ||
    url.searchParams.get("apiSecretKey") ||
    url.searchParams.get("secretKey");

  const authHeader = req.headers.get("authorization");
  if (!headerSecret && authHeader && authHeader.startsWith("Bearer ")) {
    headerSecret = authHeader.slice(7).trim();
  }

  if (!headerOwner || !headerSecret) {
    return {
      isValid: false,
      error: "Missing API credentials. Please provide 'x-api-owner' and 'x-api-secret-key' headers.",
      status: 401,
    };
  }

  await connectToDatabase();
  const settings = await Settings.findOne().lean() as {
    apiOwner?: string;
    apiSecretKey?: string;
  } | null;

  const configuredOwner = settings?.apiOwner?.trim();
  const configuredSecret = settings?.apiSecretKey?.trim();

  if (!configuredOwner || !configuredSecret) {
    return {
      isValid: false,
      error: "API access is not configured. Please set API Owner and API Secret Key in Settings first.",
      status: 403,
    };
  }

  const isOwnerValid = safeCompare(headerOwner.trim().toLowerCase(), configuredOwner.toLowerCase());
  const isSecretValid = safeCompare(headerSecret.trim(), configuredSecret);

  if (!isOwnerValid || !isSecretValid) {
    return {
      isValid: false,
      error: "Invalid API credentials provided.",
      status: 401,
    };
  }

  return {
    isValid: true,
    owner: configuredOwner,
  };
}
