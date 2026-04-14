import { pgTable, text, real, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const nvdCvesTable = pgTable("nvd_cves", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  cveId: text("cve_id").notNull().unique(),
  description: text("description"),
  cvssScore: real("cvss_score"),
  severity: text("severity"),
  publishedDate: timestamp("published_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type NvdCve = typeof nvdCvesTable.$inferSelect;
export type InsertNvdCve = typeof nvdCvesTable.$inferInsert;
