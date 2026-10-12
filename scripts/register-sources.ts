import { PrismaClient } from "@prisma/client";
import { registerSources } from "../src/server/ingestion/registry";

const client = new PrismaClient();
registerSources(client)
  .then((n) => console.log(`Registered ${n} monitored sources.`))
  .finally(() => client.$disconnect());
