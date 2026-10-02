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

export const schemeRepository = {
  async findMany(filters: SchemeQueryFilter = {}) {
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

    const where: Prisma.SchemeWhereInput = {
      isPublished,
      isArchived,
    };

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

    return db.scheme.findMany({
      where,
      include: {
        department: true,
        state: true,
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
    return db.scheme.findUnique({
      where: { slug },
      include: {
        department: true,
        state: true,
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
    return db.scheme.findUnique({
      where: { id },
      include: {
        department: true,
        state: true,
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

  async count(filters: SchemeQueryFilter = {}) {
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

    return db.scheme.count({ where });
  },

  async update(id: string, data: Prisma.SchemeUpdateInput) {
    return db.scheme.update({
      where: { id },
      data,
      include: {
        department: true,
        state: true,
        sources: true,
        verifications: true,
      },
    });
  },
};

