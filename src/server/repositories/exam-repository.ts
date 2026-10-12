import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export interface ExamQueryFilter {
  search?: string;
  categorySlug?: string;
  stateCode?: string;
  onlyCentral?: boolean;
  isPublished?: boolean;
  isArchived?: boolean;
  limit?: number;
  offset?: number;
}

/** Everything the service layer needs to compute status, freshness and links. */
export const examInclude = {
  conductingBody: true,
  state: true,
  applicationPeriod: true,
  sources: { orderBy: { retrievedAt: "desc" } },
  verifications: { orderBy: { verifiedAt: "desc" } },
  categories: { include: { category: true } },
  monitoredSource: { select: { consecutiveFailures: true, staleAfterHours: true } },
  changeCandidates: { where: { state: "PENDING" }, select: { id: true }, take: 1 },
} satisfies Prisma.ExamInclude;

export type ExamRecord = Prisma.ExamGetPayload<{ include: typeof examInclude }>;

function buildWhere(filters: ExamQueryFilter): Prisma.ExamWhereInput {
  const { search, categorySlug, stateCode, onlyCentral, isPublished = true, isArchived = false } = filters;
  const where: Prisma.ExamWhereInput = { isPublished, isArchived };

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { department: { contains: q, mode: "insensitive" } },
      { conductingBody: { name: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (categorySlug) {
    where.categories = { some: { category: { slug: categorySlug } } };
  }
  if (onlyCentral) {
    where.stateId = null;
  } else if (stateCode) {
    where.state = { code: stateCode };
  }
  return where;
}

export const examRepository = {
  async findMany(filters: ExamQueryFilter = {}): Promise<ExamRecord[]> {
    const { limit = 50, offset = 0 } = filters;
    return db.exam.findMany({
      where: buildWhere(filters),
      include: examInclude,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  },

  async findBySlug(slug: string): Promise<ExamRecord | null> {
    return db.exam.findUnique({ where: { slug }, include: examInclude });
  },

  async findById(id: string): Promise<ExamRecord | null> {
    return db.exam.findUnique({ where: { id }, include: examInclude });
  },

  async count(filters: ExamQueryFilter = {}) {
    return db.exam.count({ where: buildWhere(filters) });
  },

  async update(id: string, data: Prisma.ExamUpdateInput) {
    return db.exam.update({ where: { id }, data, include: examInclude });
  },
};
