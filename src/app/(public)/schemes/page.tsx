import { OpportunityCatalog, CatalogSearchParams } from "@/components/opportunity/OpportunityCatalog";

export const dynamic = "force-dynamic";

interface SchemesListingPageProps {
  searchParams: Promise<CatalogSearchParams>;
}

export async function generateMetadata({ searchParams }: SchemesListingPageProps) {
  const params = await searchParams;
  let title = "Government Schemes & Citizen Benefits";
  if (params.search) {
    title = `"${params.search}" — Government Schemes`;
  } else if (params.category) {
    title = `${params.category.toUpperCase()} Government Schemes`;
  }

  return {
    title,
    description:
      "Central and state welfare schemes, scholarships and subsidies with application status, verification date and official links.",
    alternates: { canonical: "/schemes" },
    openGraph: {
      title,
      description: "Government schemes with application status, verification date and official links.",
      url: "/schemes",
    },
  };
}

export default async function SchemesListingPage({ searchParams }: SchemesListingPageProps) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-line pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-fg">Government schemes and benefits</h1>
        <p className="mt-2 max-w-3xl text-base text-muted">
          Welfare schemes, scholarships and subsidies. Each listing shows whether applications are open, when it was last
          verified, and the official website.
        </p>
      </header>
      <OpportunityCatalog kind="scheme" params={params} />
    </div>
  );
}
