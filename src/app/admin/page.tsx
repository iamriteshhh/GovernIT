import { redirect } from "next/navigation";
import { isAuthenticatedAdmin } from "@/server/auth/session";
import { db } from "@/lib/db";
import { AdminConsole } from "@/components/admin/AdminConsole";

export const metadata = {
  title: "Admin Editorial Console | GovernIT",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const isAuthed = await isAuthenticatedAdmin();

  if (!isAuthed) {
    redirect("/admin/login");
  }

  const [totalExams, totalSchemes, totalOrgs, totalVerifications, rawExams, rawSchemes] = await Promise.all([
    db.exam.count({ where: { isPublished: true } }),
    db.scheme.count({ where: { isPublished: true } }),
    db.organization.count(),
    db.verification.count(),
    db.exam.findMany({
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: {
        conductingBody: true,
        verifications: { take: 1, orderBy: { verifiedAt: "desc" } },
      },
    }),
    db.scheme.findMany({
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: {
        department: true,
        verifications: { take: 1, orderBy: { verifiedAt: "desc" } },
      },
    }),
  ]);

  const recentExams = rawExams.map((e) => ({
    id: e.id,
    name: e.name,
    slug: e.slug,
    conductingBody: e.conductingBody.name,
    lastVerifiedAt: e.verifications[0]?.verifiedAt.toISOString() ?? null,
    isPublished: e.isPublished,
  }));

  const recentSchemes = rawSchemes.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    department: s.department.name,
    lastVerifiedAt: s.verifications[0]?.verifiedAt.toISOString() ?? null,
    isPublished: s.isPublished,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminConsole
        stats={{
          totalExams,
          totalSchemes,
          totalOrgs,
          totalVerifications,
        }}
        recentExams={recentExams}
        recentSchemes={recentSchemes}
      />
    </div>
  );
}
