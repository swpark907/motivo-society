import fs from "node:fs/promises";
import { format, resolveConfig } from "prettier";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { workbookReadingSchema } from "../src/lib/content/workbook-editorial-schema.ts";

const destination = new URL(
  "../content/schemas/workbook-editorial-v1.schema.json",
  import.meta.url,
);
const options = await resolveConfig(fileURLToPath(destination));
await fs.mkdir(new URL(".", destination), { recursive: true });
await fs.writeFile(
  destination,
  await format(JSON.stringify(z.toJSONSchema(workbookReadingSchema)), {
    ...options,
    parser: "json",
  }),
);
