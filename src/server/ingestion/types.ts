import { FetchOptions, FetchResult } from "./safe-fetch";

/**
 * One normalised notice from an official source. Dates are ISO instants (already IST-converted).
 * A field the source does not state is null. A field the source states but we could not parse
 * is listed in `ambiguous` and must go to admin review, never be guessed.
 */
export interface ParsedNotice {
  externalId: string;
  title: string;
  evidenceUrl: string;
  noticeUrl: string | null;
  applyUrl: string | null;
  opensAt: string | null;
  closesAt: string | null;
  examDate: string | null;
  /** Source-provided last-modified marker (sitemaps) used for change signals. */
  updatedAt: string | null;
  /** Official wording suggesting cancellation/withdrawal. Always reviewed by a human. */
  lifecycleSignal: "CANCELLED" | "WITHDRAWN" | null;
  ambiguous: string[];
}

export interface AdapterContext {
  source: {
    url: string;
    allowedHost: string;
    etag: string | null;
    lastModified: string | null;
  };
  fetch: (url: string, opts?: Partial<FetchOptions>) => Promise<FetchResult>;
}

export interface AdapterResult {
  notModified: boolean;
  http: { status: number; finalUrl: string; etag: string | null; lastModified: string | null };
  /** Hash of the primary document, to skip work when content is byte-identical. */
  contentHash: string | null;
  notices: ParsedNotice[];
}

export interface SourceAdapter {
  id: string;
  version: string;
  /**
   * "opportunities": notices carry dates and map to exam records.
   * "signals": notices only say "something official changed"; every change is reviewed.
   */
  mode: "opportunities" | "signals";
  /** Hosts this adapter may contact (official domains only). */
  hosts: string[];
  /** State code for opportunities created from this source (null = central). */
  stateCode: string | null;
  run(ctx: AdapterContext): Promise<AdapterResult>;
}

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}
