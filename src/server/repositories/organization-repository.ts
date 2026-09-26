import { db } from "@/lib/db";

export const organizationRepository = {
  async findMany() {
    return db.organization.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { exams: true, schemes: true },
        },
      },
    });
  },

  async findById(id: string) {
    return db.organization.findUnique({
      where: { id },
    });
  },

  async findCategories() {
    return db.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { exams: true, schemes: true },
        },
      },
    });
  },

  async findStates() {
    return db.state.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { exams: true, schemes: true },
        },
      },
    });
  },
};
