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

export const examRepository = {
  async findMany(filters: ExamQueryFilter = {}) {
    const {
      search,
      categorySlug,
      stateCode,
      onlyCentral,
      isPublished = true,
      isArchived = false,
      limit = 50,
      offset = 0,
    } = filters;

    const where: Prisma.ExamWhereInput = {
      isPublished,
      isArchived,
    };

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { department: { contains: q, mode: "insensitive" } },
        { conductingBody: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    if (categorySlug) {
      where.categories = {
        some: {
          category: {
            slug: categorySlug,
          },
        },
      };
    }

    if (onlyCentral) {
      where.stateId = null;
    } else if (stateCode) {
      where.state = {
        code: stateCode,
      };
    }

    return db.exam.findMany({
      where,
      include: {
        conductingBody: true,
        state: true,
        applicationPeriod: true,
        sources: {
          orderBy: { retrievedAt: "desc" },
        },
        verifications: {
          orderBy: { verifiedAt: "desc" },
          take: 1,
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });
  },

  async findBySlug(slug: string) {
    return db.exam.findUnique({
      where: { slug },
      include: {
        conductingBody: true,
        state: true,
        applicationPeriod: true,
        sources: {
          orderBy: { retrievedAt: "desc" },
        },
        verifications: {
          orderBy: { verifiedAt: "desc" },
        },
        categories: {
          include: {
            category: true,
          },
        },
        eligibilityCriteria: true,
      },
    });
  },

  async findById(id: string) {
    return db.exam.findUnique({
      where: { id },
      include: {
        conductingBody: true,
        state: true,
        applicationPeriod: true,
        sources: true,
        verifications: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
    });
  },

  async count(filters: ExamQueryFilter = {}) {
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

    return db.exam.count({ where });
  },
};
