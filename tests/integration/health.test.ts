import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/health/route";
import { GET as cronGet } from "@/app/api/cron/check-sources/route";
import { POST as reviewPost } from "@/app/api/admin/review/[id]/route";
import { POST as checkNowPost } from "@/app/api/admin/sources/[id]/check/route";

describe("Health endpoint", () => {
  it("reports database and ingestion state without internals", async () => {
    const response = await GET();
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.checks.database.status).toBe("connected");
    expect(data.checks.ingestion).toHaveProperty("status");
    expect(data.checks.ingestion).toHaveProperty("lastScheduledRunAt");
    expect(data).not.toHaveProperty("environment");
    expect(JSON.stringify(data)).not.toMatch(/heap|rss|DATABASE_URL|password/i);
  });
});

describe("Protected ingestion endpoints", () => {
  it("cron endpoint rejects missing and wrong bearer tokens", async () => {
    const none = await cronGet(new NextRequest("http://localhost/api/cron/check-sources"));
    expect(none.status).toBe(401);
    const wrong = await cronGet(
      new NextRequest("http://localhost/api/cron/check-sources", { headers: { authorization: "Bearer not-the-secret" } })
    );
    expect(wrong.status).toBe(401);
  });

  it("review and check-now require an admin session", async () => {
    const params = Promise.resolve({ id: "x" });
    const review = await reviewPost(
      new NextRequest("http://localhost/api/admin/review/x", { method: "POST", body: JSON.stringify({ action: "approve", note: "x" }) }),
      { params }
    );
    expect(review.status).toBe(401);
    const check = await checkNowPost(new NextRequest("http://localhost/api/admin/sources/x/check", { method: "POST" }), { params });
    expect(check.status).toBe(401);
  });
});
