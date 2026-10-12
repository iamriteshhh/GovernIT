import http from "node:http";
import https from "node:https";
import dns from "node:dns";
import net from "node:net";
import tls from "node:tls";
import zlib from "node:zlib";
import type { LookupFunction } from "node:net";
import { EXTRA_INTERMEDIATES } from "./intermediates";

/** Default roots plus chain-completing intermediates. Verification is never disabled. */
const CA_BUNDLE = [...tls.rootCertificates, ...EXTRA_INTERMEDIATES];

/**
 * Outbound HTTP for official sources only. Defences:
 *  - host allowlist, checked on the first URL and on every redirect target
 *  - resolved IP must be public (checked inside the socket lookup, so DNS rebinding cannot swap it)
 *  - http(s) only, no credentials in URLs, bounded redirects, timeout, response-size cap
 *  - per-host spacing, bounded retries with exponential backoff + jitter
 * Never sends cookies; never logs headers.
 */

export const USER_AGENT = "GovernIT-SourceCheck/1.0 (+https://github.com/Serion89/GovernIT; official-source monitor)";

export class FetchBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FetchBlockedError";
  }
}

export interface FetchOptions {
  allowedHosts: string[];
  method?: "GET" | "HEAD";
  etag?: string | null;
  lastModified?: string | null;
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  retries?: number;
  allowHttp?: boolean;
  /** Minimum gap between requests to the same host. */
  hostSpacingMs?: number;
}

export interface FetchResult {
  status: number;
  finalUrl: string;
  etag: string | null;
  lastModified: string | null;
  contentType: string | null;
  body: string;
  notModified: boolean;
}

// ---------- address checks ----------

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, o) => (acc << 8) + Number(o), 0) >>> 0;
}

const V4_BLOCKS: Array<[string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

/** True only for globally routable unicast addresses. */
export function isPublicAddress(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) {
    const n = ipv4ToInt(ip);
    return !V4_BLOCKS.some(([base, bits]) => {
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
      return (n & mask) === (ipv4ToInt(base) & mask);
    });
  }
  if (family === 6) {
    const lower = ip.toLowerCase();
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(lower);
    if (mapped) return isPublicAddress(mapped[1]);
    if (lower === "::" || lower === "::1") return false;
    if (/^f[cd]/.test(lower)) return false; // unique local fc00::/7
    if (/^fe[89ab]/.test(lower)) return false; // link-local fe80::/10
    if (/^ff/.test(lower)) return false; // multicast
    if (/^2001:0?db8:/.test(lower)) return false; // documentation
    // NAT64 well-known prefix (64:ff9b::/96): judge the embedded IPv4 address.
    const nat64 = /^64:ff9b::([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(lower);
    if (nat64) {
      const hi = parseInt(nat64[1], 16);
      const lo = parseInt(nat64[2], 16);
      return isPublicAddress(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
    }
    if (/^64:ff9b:/.test(lower)) return false; // other NAT64 forms: refuse
    return true;
  }
  return false;
}

export function isHostAllowed(hostname: string, allowedHosts: string[]): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return allowedHosts.some((a) => {
    const allowed = a.toLowerCase();
    return host === allowed || host.endsWith(`.${allowed}`);
  });
}

/** DNS lookup that refuses non-public answers. Runs at connect time for every socket. */
const safeLookup: LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "", 4);
    // Connect only to public addresses; private/loopback/link-local answers are dropped.
    const list = (addresses as dns.LookupAddress[]).filter((a) => isPublicAddress(a.address));
    if (list.length === 0) {
      return callback(new FetchBlockedError(`Refused non-public address for ${hostname}`), "", 4);
    }
    if ((options as dns.LookupOptions).all) return callback(null, list as unknown as string, 4);
    callback(null, list[0].address, list[0].family);
  });
};

function validateUrl(raw: string, opts: FetchOptions): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new FetchBlockedError("Invalid URL");
  }
  if (url.protocol !== "https:" && !(opts.allowHttp && url.protocol === "http:")) {
    throw new FetchBlockedError(`Protocol not allowed: ${url.protocol}`);
  }
  if (url.username || url.password) throw new FetchBlockedError("Credentials in URL are not allowed");
  if (net.isIP(url.hostname.replace(/^\[|\]$/g, ""))) throw new FetchBlockedError("Raw IP hosts are not allowed");
  if (!isHostAllowed(url.hostname, opts.allowedHosts)) {
    throw new FetchBlockedError(`Host not on the official allowlist: ${url.hostname}`);
  }
  return url;
}

// ---------- per-host spacing ----------

const nextSlot = new Map<string, number>();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitForHost(host: string, spacingMs: number) {
  const now = Date.now();
  const at = Math.max(now, nextSlot.get(host) ?? 0);
  nextSlot.set(host, at + spacingMs);
  if (at > now) await sleep(at - now);
}

// ---------- single request ----------

class HttpStatusError extends Error {
  constructor(public status: number, public retryAfterMs: number | null) {
    super(`HTTP ${status}`);
  }
}

function requestOnce(url: URL, opts: FetchOptions): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  const lib = url.protocol === "https:" ? https : http;
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
  };
  if (opts.etag) headers["If-None-Match"] = opts.etag;
  if (opts.lastModified) headers["If-Modified-Since"] = opts.lastModified;

  const maxBytes = opts.maxBytes ?? 2_000_000;

  return new Promise((resolve, reject) => {
    const req = lib.request(
      url,
      {
        method: opts.method ?? "GET",
        headers,
        lookup: safeLookup,
        timeout: opts.timeoutMs ?? 15_000,
        ...(url.protocol === "https:" ? { ca: CA_BUNDLE, rejectUnauthorized: true } : {}),
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (opts.method === "HEAD" || (status >= 300 && status < 400)) {
          res.resume();
          return resolve({ status, headers: res.headers, body: "" });
        }
        const enc = String(res.headers["content-encoding"] ?? "").toLowerCase();
        const stream =
          enc === "gzip" ? res.pipe(zlib.createGunzip()) : enc === "deflate" ? res.pipe(zlib.createInflate()) : enc === "br" ? res.pipe(zlib.createBrotliDecompress()) : res;
        const chunks: Buffer[] = [];
        let size = 0;
        stream.on("data", (c: Buffer) => {
          size += c.length;
          if (size > maxBytes) {
            req.destroy(new Error(`Response larger than ${maxBytes} bytes`));
            return;
          }
          chunks.push(c);
        });
        stream.on("end", () => resolve({ status, headers: res.headers, body: Buffer.concat(chunks).toString("utf8") }));
        stream.on("error", reject);
      }
    );
    req.on("timeout", () => req.destroy(new Error(`Timed out after ${opts.timeoutMs ?? 15_000} ms`)));
    req.on("error", reject);
    req.end();
  });
}

function headerValue(h: http.IncomingHttpHeaders, name: string): string | null {
  const v = h[name];
  return Array.isArray(v) ? v[0] ?? null : v ?? null;
}

function retryAfterMs(h: http.IncomingHttpHeaders): number | null {
  const v = headerValue(h, "retry-after");
  if (!v) return null;
  const secs = Number(v);
  if (!isNaN(secs)) return secs * 1000;
  const at = Date.parse(v);
  return isNaN(at) ? null : Math.max(0, at - Date.now());
}

// ---------- public API ----------

export async function safeFetch(rawUrl: string, opts: FetchOptions): Promise<FetchResult> {
  const retries = opts.retries ?? 2;
  let attempt = 0;
  for (;;) {
    try {
      return await fetchFollowingRedirects(rawUrl, opts);
    } catch (error) {
      const retryable =
        !(error instanceof FetchBlockedError) &&
        (!(error instanceof HttpStatusError) || error.status === 429 || error.status >= 500);
      if (!retryable || attempt >= retries) throw error;
      const backoff = 1000 * 2 ** attempt + Math.floor(Math.random() * 500);
      const hinted = error instanceof HttpStatusError ? error.retryAfterMs : null;
      await sleep(Math.min(30_000, Math.max(backoff, hinted ?? 0)));
      attempt++;
    }
  }
}

async function fetchFollowingRedirects(rawUrl: string, opts: FetchOptions): Promise<FetchResult> {
  let url = validateUrl(rawUrl, opts);
  const maxRedirects = opts.maxRedirects ?? 3;

  for (let hop = 0; ; hop++) {
    await waitForHost(url.hostname, opts.hostSpacingMs ?? 2000);
    const res = await requestOnce(url, hop === 0 ? opts : { ...opts, etag: null, lastModified: null });

    if (res.status >= 300 && res.status < 400 && res.status !== 304) {
      const location = headerValue(res.headers, "location");
      if (!location) throw new HttpStatusError(res.status, null);
      if (hop >= maxRedirects) throw new FetchBlockedError(`Too many redirects (> ${maxRedirects})`);
      url = validateUrl(new URL(location, url).toString(), opts);
      continue;
    }

    if (res.status === 304) {
      return {
        status: 304,
        finalUrl: url.toString(),
        etag: headerValue(res.headers, "etag") ?? opts.etag ?? null,
        lastModified: headerValue(res.headers, "last-modified") ?? opts.lastModified ?? null,
        contentType: null,
        body: "",
        notModified: true,
      };
    }
    if (res.status >= 400) throw new HttpStatusError(res.status, retryAfterMs(res.headers));

    return {
      status: res.status,
      finalUrl: url.toString(),
      etag: headerValue(res.headers, "etag"),
      lastModified: headerValue(res.headers, "last-modified"),
      contentType: headerValue(res.headers, "content-type"),
      body: res.body,
      notModified: false,
    };
  }
}

export function httpStatusOf(error: unknown): number | null {
  return error instanceof HttpStatusError ? error.status : null;
}
