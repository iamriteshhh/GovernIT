import { examService } from "./exam-service";
import { schemeService } from "./scheme-service";
import { ExamOpportunity } from "@/domain/exam";
import { SchemeOpportunity } from "@/domain/scheme";

export interface UnifiedSearchResult {
  exams: ExamOpportunity[];
  schemes: SchemeOpportunity[];
  totalExams: number;
  totalSchemes: number;
  query: string;
}

export const searchService = {
  async searchAll(query: string, filters: {
    categorySlug?: string;
    stateCode?: string;
    onlyCentral?: boolean;
    limit?: number;
  } = {}): Promise<UnifiedSearchResult> {
    const cleanQuery = query?.trim() ?? "";
    const limit = filters.limit ?? 25;

    const [examResult, schemeResult] = await Promise.all([
      examService.listExams({
        search: cleanQuery || undefined,
        categorySlug: filters.categorySlug,
        stateCode: filters.stateCode,
        onlyCentral: filters.onlyCentral,
        limit,
      }),
      schemeService.listSchemes({
        search: cleanQuery || undefined,
        categorySlug: filters.categorySlug,
        stateCode: filters.stateCode,
        onlyCentral: filters.onlyCentral,
        limit,
      }),
    ]);

    return {
      exams: examResult.exams,
      schemes: schemeResult.schemes,
      totalExams: examResult.total,
      totalSchemes: schemeResult.total,
      query: cleanQuery,
    };
  },
};
