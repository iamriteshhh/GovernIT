import { describe, it, expect } from "vitest";
import { examService } from "@/server/services/exam-service";
import { schemeService } from "@/server/services/scheme-service";
import { searchService } from "@/server/services/search-service";

describe("Phase 4 - Domain Services & Repositories Integration", () => {
  it("should list exams with computed status and verification metadata", async () => {
    const { exams, total } = await examService.listExams({ limit: 10 });
    expect(total).toBeGreaterThanOrEqual(20);
    expect(exams.length).toBeGreaterThan(0);

    const firstExam = exams[0];
    expect(firstExam).toHaveProperty("applicationStatus");
    expect(firstExam.applicationStatus).toHaveProperty("status");
    expect(firstExam.applicationStatus).toHaveProperty("daysLeft");
    expect(firstExam.conductingBody.name).toBeTruthy();
    expect(firstExam.sources.length).toBeGreaterThan(0);
  });

  it("should get an exam by slug with accurate details", async () => {
    const exam = await examService.getExamBySlug("upsc-cse-2026");
    expect(exam).not.toBeNull();
    expect(exam?.name).toContain("Civil Services");
    expect(exam?.conductingBody.name).toContain("UPSC");
    expect(exam?.officialApplyUrl).toContain("upsconline.nic.in");
    expect(exam?.sources[0].url).toContain("upsc.gov.in");
  });

  it("should list schemes with computed status", async () => {
    const { schemes, total } = await schemeService.listSchemes({ limit: 10 });
    expect(total).toBeGreaterThanOrEqual(20);
    expect(schemes.length).toBeGreaterThan(0);

    const firstScheme = schemes[0];
    expect(firstScheme).toHaveProperty("status");
    expect(firstScheme.department.name).toBeTruthy();
    expect(firstScheme.benefits).toBeTruthy();
  });

  it("should get a scheme by slug with accurate details", async () => {
    const scheme = await schemeService.getSchemeBySlug("pm-kisan");
    expect(scheme).not.toBeNull();
    expect(scheme?.name).toContain("PM-KISAN");
    expect(scheme?.department.name).toContain("Agriculture");
    expect(scheme?.officialApplyUrl).toContain("pmkisan.gov.in");
  });

  it("should perform unified search across both exams and schemes", async () => {
    const searchResult = await searchService.searchAll("UPSC");
    expect(searchResult.exams.length).toBeGreaterThan(0);
    expect(searchResult.totalExams).toBeGreaterThan(0);
  });

  it("should identify closing soon opportunities", async () => {
    const closingSoonExams = await examService.getClosingSoonExams();
    expect(Array.isArray(closingSoonExams)).toBe(true);
    for (const exam of closingSoonExams) {
      expect(exam.applicationStatus.status).toBe("CLOSING_SOON");
      expect(exam.applicationStatus.daysLeft).toBeLessThanOrEqual(7);
    }
  });

  it("should identify upcoming exams", async () => {
    const upcomingExams = await examService.getUpcomingExams();
    expect(Array.isArray(upcomingExams)).toBe(true);
    for (const exam of upcomingExams) {
      expect(exam.examScheduleStatus.status).toBe("EXAM_UPCOMING");
      expect(exam.examScheduleStatus.daysLeft).toBeGreaterThanOrEqual(0);
    }
  });
});
