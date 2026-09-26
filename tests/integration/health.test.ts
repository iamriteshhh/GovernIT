import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("Health Check API", () => {
  it("should return status ok and GovernIT app name", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.app).toBe("GovernIT");
    expect(data).toHaveProperty("timestamp");
  });
});
