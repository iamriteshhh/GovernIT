import { examService } from "./exam-service";
import { schemeService } from "./scheme-service";
import { prioritizeOpportunities, PrioritizedGroups } from "@/domain/prioritize";
import { ExamOpportunity } from "@/domain/exam";
import { SchemeOpportunity } from "@/domain/scheme";

export type DiscoveryItem = ExamOpportunity | SchemeOpportunity;

/** Deadline-first view over exams AND schemes (home page + /closing-soon). */
export async function getDeadlineFirstGroups(): Promise<PrioritizedGroups<DiscoveryItem>> {
  const [exams, schemes] = await Promise.all([
    examService.listActiveCandidates(),
    schemeService.listActiveCandidates(),
  ]);
  return prioritizeOpportunities<DiscoveryItem>([...exams, ...schemes]);
}
