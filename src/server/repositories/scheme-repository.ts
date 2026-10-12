import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export interface SchemeQueryFilter {
  search?: string;
  categorySlug?: string;
  stateCode?: string;
  onlyCentral?: boolean;
  isPublished?: boolean;
  isArchived?: boolean;
  limit?: number;
  offset?: number;
}

/** applicationPeriod is the canonical scheme deadline and must be in every query. */
export const schemeInclude = {
  department: true,
  state: true,
  applicationPeriod: true,
  sources: { orderBy: { retrievedAt: "desc" } },
  verifications: { orderBy: { verifiedAt: "desc" } },
  categories: { include: { category: true } },
  monitoredSource: { select: { consecutiveFailures: true, staleAfterHours: true } },
  changeCandidates: { where: { state: "PENDING" }, select: { id: true }, take: 1 },
} satisfies Prisma.SchemeInclude;

export type SchemeRecord = Prisma.SchemeGetPayload<{ include: typeof schemeInclude }>;

function buildWhere(filters: SchemeQueryFilter): Prisma.SchemeWhereInput {
  const { search, categorySlug, stateCode, onlyCentral, isPublished = true, isArchived = false } = filters;
  const where: Prisma.SchemeWhereInput = { isPublished, isArchived };

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { whoCanBenefit: { contains: q, mode: "insensitive" } },
      { department: { name: { contains: q, mode: "insensitive" } } },
      { benefits: { contains: q, mode: "insensitive" } },
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

export const schemeRepository = {
  async findMany(filters: SchemeQueryFilter = {}): Promise<SchemeRecord[]> {
    const { limit = 50, offset = 0 } = filters;
    return db.scheme.findMany({
      where: buildWhere(filters),
      include: schemeInclude,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  },

  async findBySlug(slug: string): Promise<SchemeRecord | null> {
    return db.scheme.findUnique({ where: { slug }, include: schemeInclude });
  },

  async findById(id: string): Promise<SchemeRecord | null> {
    return db.scheme.findUnique({ where: { id }, include: schemeInclude });
  },

  async count(filters: SchemeQueryFilter = {}) {
    return db.scheme.count({ where: buildWhere(filters) });
  },

  async update(id: string, data: Prisma.SchemeUpdateInput) {
    return db.scheme.update({ where: { id }, data, include: schemeInclude });
  },
};
