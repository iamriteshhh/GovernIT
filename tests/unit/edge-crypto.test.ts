import { describe, it, expect } from "vitest";
import {
  edgeSha256Hex,
  edgeHmacSha256Base64Url,
  edgeBase64UrlEncode,
  edgeBase64UrlDecode,
  edgeTimingSafeEqual,
} from "@/server/auth/edge-crypto";
import crypto from "crypto";

describe("Edge-compatible Crypto", () => {
  it("should match node crypto SHA-256 hex output", () => {
    const text = "GovernIT test payload 12345";
    const expected = crypto.createHash("sha256").update(text).digest("hex");
    const actual = edgeSha256Hex(text);
    expect(actual).toBe(expected);
  });

  it("should match node crypto HMAC-SHA-256 base64url output", () => {
    const text = "GovernIT test payload 12345";
    const key = "secret-key-xyz";
    const expected = crypto.createHmac("sha256", key).update(text).digest("base64url");
    const actual = edgeHmacSha256Base64Url(key, text);
    expect(actual).toBe(expected);
  });

  it("should encode and decode base64url correctly", () => {
    const payload = JSON.stringify({ role: "admin", username: "admin", createdAt: 1700000000 });
    const encoded = edgeBase64UrlEncode(payload);
    expect(encoded).toBe(Buffer.from(payload).toString("base64url"));

    const decoded = edgeBase64UrlDecode(encoded);
    expect(decoded).toBe(payload);
  });

  it("should perform constant-time string equality check correctly", () => {
    expect(edgeTimingSafeEqual("secret123", "secret123")).toBe(true);
    expect(edgeTimingSafeEqual("secret123", "secret124")).toBe(false);
    expect(edgeTimingSafeEqual("secret123", "short")).toBe(false);
  });
});
