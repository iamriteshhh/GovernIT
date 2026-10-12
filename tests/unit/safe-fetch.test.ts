import { describe, it, expect } from "vitest";
import { FetchBlockedError, isHostAllowed, isPublicAddress, safeFetch } from "@/server/ingestion/safe-fetch";
import { classifyLinkError, countsAsFailure } from "@/server/ingestion/link-check";

describe("SSRF guards", () => {
  it.each([
    ["127.0.0.1", false],
    ["10.1.2.3", false],
    ["172.16.0.1", false],
    ["192.168.1.1", false],
    ["169.254.169.254", false],
    ["100.64.0.1", false],
    ["0.0.0.0", false],
    ["::1", false],
    ["fe80::1", false],
    ["fd00::1", false],
    ["::ffff:127.0.0.1", false],
    ["64:ff9b::a464:86e8", true], // NAT64 of 164.100.134.232 (public)
    ["64:ff9b::7f00:1", false], // NAT64 of 127.0.0.1
    ["164.100.134.232", true],
    ["2404:6800:4009::200e", true],
  ])("isPublicAddress(%s) = %s", (ip, expected) => {
    expect(isPublicAddress(ip)).toBe(expected);
  });

  it("host allowlist matches exact host and subdomains only", () => {
    expect(isHostAllowed("tnpsc.gov.in", ["tnpsc.gov.in"])).toBe(true);
    expect(isHostAllowed("www.tnpsc.gov.in", ["tnpsc.gov.in"])).toBe(true);
    expect(isHostAllowed("tnpsc.gov.in.evil.com", ["tnpsc.gov.in"])).toBe(false);
    expect(isHostAllowed("eviltnpsc.gov.in", ["tnpsc.gov.in"])).toBe(false);
  });

  it("refuses non-allowlisted hosts, raw IPs, credentials and non-https before any network I/O", async () => {
    const opts = { allowedHosts: ["tnpsc.gov.in"], retries: 0 };
    await expect(safeFetch("https://example.com/", opts)).rejects.toBeInstanceOf(FetchBlockedError);
    await expect(safeFetch("https://127.0.0.1/", { ...opts, allowedHosts: ["127.0.0.1"] })).rejects.toBeInstanceOf(FetchBlockedError);
    await expect(safeFetch("https://user:pw@tnpsc.gov.in/", opts)).rejects.toBeInstanceOf(FetchBlockedError);
    await expect(safeFetch("http://tnpsc.gov.in/", opts)).rejects.toBeInstanceOf(FetchBlockedError);
    await expect(safeFetch("file:///etc/passwd", opts)).rejects.toBeInstanceOf(FetchBlockedError);
  });

  it("refuses hostnames that resolve to private addresses (checked at connect time)", async () => {
    // "localhost" resolves to loopback on every machine.
    await expect(safeFetch("https://localhost/", { allowedHosts: ["localhost"], retries: 0 })).rejects.toThrow(/non-public/);
  });
});

describe("Link check classification is conservative", () => {
  it("bot blocks, TLS chain gaps and odd headers are inconclusive, not failures", () => {
    expect(countsAsFailure(classifyLinkError(Object.assign(new Error("x"), { code: "UNABLE_TO_VERIFY_LEAF_SIGNATURE" })))).toBe(false);
    expect(countsAsFailure(classifyLinkError(Object.assign(new Error("x"), { code: "HPE_INVALID_HEADER_TOKEN" })))).toBe(false);
    expect(classifyLinkError(new FetchBlockedError("Host not on the official allowlist: x"))).toBe("NOT_ALLOWED");
  });

  it("network errors count as failures", () => {
    expect(countsAsFailure(classifyLinkError(Object.assign(new Error("socket hang up"), { code: "ECONNRESET" })))).toBe(true);
  });
});

describe("Bundled chain-completing intermediates", () => {
  it("each one parses, is a CA, and is signed by a root in Node's trust store", async () => {
    const tls = await import("node:tls");
    const { X509Certificate } = await import("node:crypto");
    const { EXTRA_INTERMEDIATES } = await import("@/server/ingestion/intermediates");
    const roots = tls.rootCertificates.map((p) => new X509Certificate(p));
    for (const pem of EXTRA_INTERMEDIATES) {
      const cert = new X509Certificate(pem);
      expect(cert.ca).toBe(true);
      expect(roots.some((r) => cert.checkIssued(r) && cert.verify(r.publicKey)), cert.subject).toBe(true);
    }
  });
});
