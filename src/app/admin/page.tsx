import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/server/auth/session";
import { db } from "@/lib/db";
import { AdminConsole } from "@/components/admin/AdminConsole";

export const metadata = {
  title: "Admin Editorial Console | GovernIT",
  robots: {
    index: false,
    follow: false,
  },
};

interface AdminPageProps {
  searchParams: Promise<{
    search?: string;
    tab?: string;
    page?: string;
  }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await getAuthenticatedAdmin();

  if (!session.isAuthenticated) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const search = params.search?.trim() || "";
  const tab = params.tab || "exams";
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 50;
  const skip = (page - 1) * pageSize;

  // Search filter
  const examWhere = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
          { conductingBody: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const schemeWhere = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
          { department: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [
    totalExams,
    totalSchemes,
    totalOrgs,
    totalVerifications,
    rawExams,
    rawSchemes,
    organizations,
    states,
    filteredExamCount,
    filteredSchemeCount,
  ] = await Promise.all([
    db.exam.count({ where: { isPublished: true, isArchived: false } }),
    db.scheme.count({ where: { isPublished: true, isArchived: false } }),
    db.organization.count(),
    db.verification.count(),
    db.exam.findMany({
      where: examWhere,
      skip,
      take: pageSize,
      orderBy: { updatedAt: "desc" },
      include: {
        conductingBody: true,
        state: true,
        applicationPeriod: true,
        verifications: { take: 1, orderBy: { verifiedAt: "desc" } },
      },
    }),
    db.scheme.findMany({
      where: schemeWhere,
      skip,
      take: pageSize,
      orderBy: { updatedAt: "desc" },
      include: {
        department: true,
        state: true,
        applicationPeriod: true,
        verifications: { take: 1, orderBy: { verifiedAt: "desc" } },
      },
    }),
    db.organization.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.state.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.exam.count({ where: examWhere }),
    db.scheme.count({ where: schemeWhere }),
  ]);

  const exams = rawExams.map((e) => ({
    id: e.id,
    name: e.name,
    slug: e.slug,
    conductingBodyId: e.conductingBodyId,
    conductingBody: e.conductingBody.name,
    department: e.department,
    educationEligibility: e.educationEligibility,
    ageEligibility: e.ageEligibility,
    stateId: e.stateId,
    stateName: e.state?.name ?? null,
    examDate: e.examDate?.toISOString() ?? null,
    admitCardDate: e.admitCardDate?.toISOString() ?? null,
    resultStatus: e.resultStatus,
    applicationFee: e.applicationFee,
    vacancyCount: e.vacancyCount,
    officialApplyUrl: e.officialApplyUrl,
    opensAt: e.applicationPeriod?.opensAt?.toISOString() ?? null,
    closesAt: e.applicationPeriod?.closesAt?.toISOString() ?? null,
    lastVerifiedAt: e.verifications[0]?.verifiedAt.toISOString() ?? null,
    lastVerifiedBy: e.verifications[0]?.verifiedBy ?? null,
    isPublished: e.isPublished,
    isArchived: e.isArchived,
  }));

  const schemes = rawSchemes.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    departmentId: s.departmentId,
    department: s.department.name,
    whoCanBenefit: s.whoCanBenefit,
    eligibility: s.eligibility,
    benefits: s.benefits,
    requiredDocuments: s.requiredDocuments,
    applicationProcess: s.applicationProcess,
    stateId: s.stateId,
    stateName: s.state?.name ?? null,
    officialApplyUrl: s.officialApplyUrl,
    deadline: s.applicationPeriod?.closesAt?.toISOString() ?? null,
    lastVerifiedAt: s.verifications[0]?.verifiedAt.toISOString() ?? null,
    lastVerifiedBy: s.verifications[0]?.verifiedBy ?? null,
    isPublished: s.isPublished,
    isArchived: s.isArchived,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminConsole
        adminUsername={session.username || "admin"}
        stats={{
          totalExams,
          totalSchemes,
          totalOrgs,
          totalVerifications,
        }}
        exams={exams}
        schemes={schemes}
        organizations={organizations}
        states={states}
        pagination={{
          search,
          currentTab: tab,
          currentPage: page,
          pageSize,
          totalExamPages: Math.ceil(filteredExamCount / pageSize),
          totalSchemePages: Math.ceil(filteredSchemeCount / pageSize),
        }}
      />
    </div>
  );
}
