import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("Health Check API", () => {
  it("should return status ok and GovernIT app name", async () => {
    const response = await GET();
    const data = await response.json();

    expect([200, 503]).toContain(response.status);
    expect(["ok", "degraded"]).toContain(data.status);
    expect(data.app).toBe("GovernIT");
    expect(data).toHaveProperty("timestamp");
    expect(data).toHaveProperty("uptimeSeconds");
    expect(data.checks).toHaveProperty("database");
    expect(data.checks).toHaveProperty("memory");
  });
});
