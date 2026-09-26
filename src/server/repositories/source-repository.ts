import { db } from "@/lib/db";
import { SourceType } from "@prisma/client";

export const sourceRepository = {
  async findByExamId(examId: string) {
    return db.source.findMany({
      where: { examId },
      orderBy: { retrievedAt: "desc" },
    });
  },

  async findBySchemeId(schemeId: string) {
    return db.source.findMany({
      where: { schemeId },
      orderBy: { retrievedAt: "desc" },
    });
  },

  async addSource(data: {
    examId?: string;
    schemeId?: string;
    url: string;
    type: SourceType;
    title?: string;
  }) {
    return db.source.create({
      data: {
        examId: data.examId,
        schemeId: data.schemeId,
        url: data.url,
        type: data.type,
        title: data.title,
        retrievedAt: new Date(),
      },
    });
  },
};
