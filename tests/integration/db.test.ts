import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";

describe("Database Connection", () => {
  it("should connect to PostgreSQL and query tables", async () => {
    // Check organizations table count
    const orgCount = await db.organization.count();
    expect(typeof orgCount).toBe("number");

    // Check exams table count
    const examCount = await db.exam.count();
    expect(typeof examCount).toBe("number");

    // Check schemes table count
    const schemeCount = await db.scheme.count();
    expect(typeof schemeCount).toBe("number");
  });
});
