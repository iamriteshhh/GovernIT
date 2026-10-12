import { PrismaClient } from "@prisma/client";
import { SOURCE_REGISTRY } from "./adapters";

/** Upserts the code-defined source registry. Keeps runtime state (timestamps, snapshot) intact. */
export async function registerSources(client: PrismaClient) {
  for (const s of SOURCE_REGISTRY) {
    await client.monitoredSource.upsert({
      where: { key: s.key },
      create: { ...s },
      update: {
        name: s.name,
        organization: s.organization,
        kind: s.kind,
        url: s.url,
        allowedHost: s.allowedHost,
        adapterId: s.adapterId,
        adapterVersion: s.adapterVersion,
        opportunityType: s.opportunityType,
        checkIntervalMinutes: s.checkIntervalMinutes,
        staleAfterHours: s.staleAfterHours,
        autoPublish: s.autoPublish,
      },
    });
  }
  return SOURCE_REGISTRY.length;
}
