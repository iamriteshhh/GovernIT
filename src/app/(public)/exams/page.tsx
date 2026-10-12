import { OpportunityCatalog, CatalogSearchParams } from "@/components/opportunity/OpportunityCatalog";

export const dynamic = "force-dynamic";

interface ExamsListingPageProps {
  searchParams: Promise<CatalogSearchParams>;
}

export async function generateMetadata({ searchParams }: ExamsListingPageProps) {
  const params = await searchParams;
  let title = "Government Exams & Recruitments";
  if (params.search) {
    title = `"${params.search}" — Government Exams`;
  } else if (params.category) {
    title = `${params.category.toUpperCase()} Government Exams`;
  }

  return {
    title,
    description:
      "UPSC, SSC, Banking, Railways, Defence and State PSC exams with IST application deadlines, verification status and official links.",
    alternates: { canonical: "/exams" },
    openGraph: {
      title,
      description: "Government exams with IST deadlines, verification status and official links.",
      url: "/exams",
    },
  };
}

export default async function ExamsListingPage({ searchParams }: ExamsListingPageProps) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-line pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-fg">Government exams and recruitments</h1>
        <p className="mt-2 max-w-3xl text-base text-muted">
          Central and state recruitments with their application window, verification status and official links. Open
          listings appear first.
        </p>
      </header>
      <OpportunityCatalog kind="exam" params={params} />
    </div>
  );
}
